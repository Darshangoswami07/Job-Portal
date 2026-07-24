import multer from "multer";

const storage = multer.memoryStorage();

const RESUME_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
]);

const IMAGE_MIME_TYPES = new Set([
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
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (RESUME_MIME_TYPES.has(file.mimetype) || IMAGE_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error(`Unsupported file type "${file.mimetype}". Resume uploads support PDF, DOCX, DOC, and TXT files.`));
  },
});

export const singleUpload = (req, res, next) => {
  upload.any()(req, res, (error) => {
    if (!error) {
      if (Array.isArray(req.files) && req.files.length > 0) {
        const resumeFile = req.files.find(f => f.fieldname === "file");
        if (resumeFile) {
          req.file = resumeFile;
        } else {
          req.file = req.files[0];
        }
      }
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File size must be 10MB or less. Please upload a smaller file.",
        });
      }
      if (error.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({
          success: false,
          message: "Unexpected file field. Please use the correct upload field.",
        });
      }
    }

    return res.status(400).json({
      success: false,
      message: error.message || "File upload failed. Please check the file and try again.",
    });
  });
};
