import multer from "multer";
import path from "path";

export const CHAT_MAX_FILE_SIZE = 20 * 1024 * 1024;

const CHAT_ALLOWED_MIME_TYPES = new Set([
  // images
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
  // documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // archives
  "application/zip",
  "application/x-zip-compressed",
  "application/zip-compressed",
  "application/x-zip",
  "application/vnd.rar",
  "application/x-rar-compressed",
  // audio
  "audio/webm",
  "audio/mpeg",
  "audio/mp3",
  "audio/ogg",
  "audio/wav",
  "audio/x-wav",
  "audio/aac",
  "audio/mp4",
  "audio/x-m4a",
  // video
  "video/mp4",
  "video/webm",
]);

const EXTENSION_MIME_MAP = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
  md: "text/markdown",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  zip: "application/zip",
  rar: "application/vnd.rar",
  webm: "video/webm",
  mp4: "video/mp4",
  mpeg: "audio/mpeg",
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  wav: "audio/wav",
  aac: "audio/aac",
  m4a: "audio/mp4",
};

const sanitizeFilename = (name) => {
  const basename = path.basename(String(name || "").trim());
  return basename.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 200);
};

const chatUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: CHAT_MAX_FILE_SIZE,
    files: 8,
  },
  fileFilter: (req, file, cb) => {
    file.originalname = sanitizeFilename(file.originalname);

    const ext = path
      .extname(file.originalname || "")
      .slice(1)
      .toLowerCase();
    const canonicalMime = EXTENSION_MIME_MAP[ext];

    const allowed =
      CHAT_ALLOWED_MIME_TYPES.has(file.mimetype) ||
      (canonicalMime && CHAT_ALLOWED_MIME_TYPES.has(canonicalMime));

    if (allowed) {
      cb(null, true);
      return;
    }
    cb(new Error(`Unsupported file type "${file.mimetype}" for chat attachments.`));
  },
});

export const chatUploadMiddleware = (req, res, next) => {
  chatUpload.any()(req, res, (error) => {
    if (!error) {
      req.files = req.files || [];
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File size must be 20MB or less. Please upload a smaller file.",
        });
      }
      return res.status(400).json({
        success: false,
        message: error.message || "File upload failed. Please check the file and try again.",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "File upload failed. Please check the file and try again.",
    });
  });
};
