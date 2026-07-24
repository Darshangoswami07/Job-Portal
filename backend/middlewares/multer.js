import multer from "multer";

const storage = multer.memoryStorage();
const allowedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.has(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(new Error("Only PDF and image files are allowed"));
  },
});

export const singleUpload = (req, res, next) => {
  upload.any()(req, res, (error) => {
    if (!error) {
      if (!req.file && Array.isArray(req.files) && req.files.length === 1) {
        req.file = req.files[0];
      }
      next();
      return;
    }

    const message =
      error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
        ? "File size must be 5MB or less"
        : error.message || "File upload failed";

    return res.status(400).json({
      message,
      success: false,
    });
  });
};
