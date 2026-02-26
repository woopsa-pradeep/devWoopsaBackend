// middleware/multer.middleware.ts
import multer from "multer";
import path from "path";

const allowedExtensions = [
  // Images
  ".jpg", ".jpeg", ".png", ".gif", ".svg", ".avif",
  // Documents
  ".pdf", ".doc", ".docx", ".txt", ".rtf",
  // Videos
  ".mp4", ".avi", ".mov", ".wmv", ".flv", ".webm", ".mkv", ".m4v", ".3gp", ".ogv"
];
const MAX_SIZE = 100 * 1024 * 1024; // 100MB to accommodate video files and large documents

const storage = multer.memoryStorage();

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return cb(new Error("Only image, document (PDF, DOC), and video files are allowed."));
  }
  cb(null, true);
};

export const multerUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE },
});
