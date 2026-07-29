import https from "https";
import http from "http";
import { URL } from "url";

// Cloudinary's raw/upload delivery always answers with
// `Content-Type: application/octet-stream` regardless of the file's real
// type, even when we forward its own upstream header. Browsers have no
// inline renderer for octet-stream, so they force a download dialog no
// matter what Content-Disposition says. We therefore derive the real
// Content-Type ourselves from the filename extension instead of trusting
// whatever Cloudinary reports.
const EXTENSION_CONTENT_TYPES = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

const resolveContentType = (fileName, upstreamContentType, fallbackContentType) => {
  const ext = fileName?.split(".").pop()?.toLowerCase();
  if (ext && EXTENSION_CONTENT_TYPES[ext]) return EXTENSION_CONTENT_TYPES[ext];
  if (upstreamContentType && upstreamContentType !== "application/octet-stream") return upstreamContentType;
  return fallbackContentType;
};

// Proxies a remote file (Cloudinary asset) back through our own server so we
// control Content-Type and Content-Disposition ourselves — Cloudinary's
// raw/upload delivery otherwise always forces a download, which breaks
// in-app preview.
export const pipeRemoteFile = (req, res, fileUrl, fileName, fallbackContentType = "application/pdf") => {
  const parsedUrl = new URL(fileUrl);
  const client = parsedUrl.protocol === "http:" ? http : https;
  const disposition = req.query.download === "1" ? "attachment" : "inline";

  client
    .get(parsedUrl, (proxyRes) => {
      if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
        const redirectUrl = new URL(proxyRes.headers.location, parsedUrl);
        return client.get(redirectUrl, (redirectRes) => {
          res.setHeader("Content-Type", resolveContentType(fileName, redirectRes.headers["content-type"], fallbackContentType));
          res.setHeader("Content-Disposition", `${disposition}; filename="${fileName}"`);
          redirectRes.pipe(res);
        });
      }

      res.setHeader("Content-Type", resolveContentType(fileName, proxyRes.headers["content-type"], fallbackContentType));
      res.setHeader("Content-Disposition", `${disposition}; filename="${fileName}"`);
      proxyRes.pipe(res);
    })
    .on("error", (err) => {
      console.error("Error proxying file:", err);
      return res.status(500).json({ message: "Unable to proxy file", success: false });
    });
};

const ALLOWED_HOSTS = new Set(["res.cloudinary.com"]);

export const isAllowedRemoteAsset = (fileUrl) => {
  try {
    const parsed = new URL(fileUrl);
    return ALLOWED_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
};
