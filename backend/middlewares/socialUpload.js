import multer from "multer";
import path from "path";

export const SOCIAL_MAX_FILE_SIZE = 50 * 1024 * 1024;
export const SOCIAL_MAX_FILES = 10;

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp",
  "image/heic", "image/heif", "image/svg+xml", "image/avif",
]);

const VIDEO_MIME_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/mpeg", "video/x-matroska"]);

const DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

const EXTENSION_MIME_MAP = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif",
  webp: "image/webp", heic: "image/heic", heif: "image/heif", svg: "image/svg+xml", avif: "image/avif",
  mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime", avi: "video/x-msvideo",
  mpg: "video/mpeg", mpeg: "video/mpeg", mkv: "video/x-matroska",
  pdf: "application/pdf", doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain", md: "text/markdown", csv: "text/csv",
  xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

export function classifyMime(mimetype, originalname) {
  const ext = path.extname(originalname || "").slice(1).toLowerCase();
  const canonical = EXTENSION_MIME_MAP[ext] || mimetype;
  if (IMAGE_MIME_TYPES.has(canonical)) return { type: "image", canonical };
  if (VIDEO_MIME_TYPES.has(canonical)) return { type: "video", canonical };
  if (DOCUMENT_MIME_TYPES.has(canonical)) return { type: "document", canonical };
  return { type: "document", canonical };
}

const sanitizeFilename = (name) => {
  const basename = path.basename(String(name || "").trim());
  return basename.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 200);
};

const socialUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: SOCIAL_MAX_FILE_SIZE, files: SOCIAL_MAX_FILES },
  fileFilter: (req, file, cb) => {
    file.originalname = sanitizeFilename(file.originalname);
    const ext = path.extname(file.originalname || "").slice(1).toLowerCase();
    const canonical = EXTENSION_MIME_MAP[ext] || file.mimetype;
    const allowed =
      IMAGE_MIME_TYPES.has(canonical) ||
      VIDEO_MIME_TYPES.has(canonical) ||
      DOCUMENT_MIME_TYPES.has(canonical);
    if (allowed) {
      cb(null, true);
      return;
    }
    cb(new Error(`Unsupported file type "${file.mimetype}". Images, videos, PDF, DOCX, PPT and XLSX are supported.`));
  },
});

export const socialUploadMiddleware = (req, res, next) => {
  socialUpload.any()(req, res, (error) => {
    if (!error) {
      req.files = req.files || [];
      next();
      return;
    }
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ success: false, message: "File size must be 50MB or less." });
      }
      if (error.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({ success: false, message: `You can upload up to ${SOCIAL_MAX_FILES} files at once.` });
      }
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(400).json({ success: false, message: error.message || "File upload failed." });
  });
};