import multer from "multer";
import ApiError from "../utils/ApiError.js";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    // Initial coarse check on client MIME type
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.mimetype)) {
      return cb(
        new ApiError(
          400,
          `Unsupported file type "${file.mimetype}". Only JPEG, PNG, WebP, and GIF images are permitted.`
        )
      );
    }
    cb(null, true);
  },
});

export const handleSingleUpload = (fieldName = "file") => {
  const single = upload.single(fieldName);
  return (req, res, next) => {
    single(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(new ApiError(400, "File size exceeds maximum permitted limit of 10 MB"));
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return next(new ApiError(400, `Unexpected field name. The file must be submitted under field "${fieldName}"`));
        }
        return next(err instanceof ApiError ? err : new ApiError(400, err.message));
      }
      next();
    });
  };
};
