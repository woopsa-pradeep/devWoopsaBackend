import multer, { StorageEngine } from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}


const fileFilter = (
  req: Express.Request,
  file: any,
  cb: multer.FileFilterCallback
) => {
  const imageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  const videoTypes = ['video/mp4', 'video/quicktime'];
  const documentTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/jpg'];

  const maxImageSize = 5 * 1024 * 1024; // 5MB
  const maxVideoSize = 25 * 1024 * 1024; // 25MB
  const maxDocumentSize = 10 * 1024 * 1024; // 10MB for documents

  if (imageTypes.includes(file.mimetype)) {
    if (file.size > maxImageSize) {
      return cb(new Error('Image file too large. Max 5MB allowed.'));
    }
    cb(null, true);
  } else if (videoTypes.includes(file.mimetype)) {
    if (file.size > maxVideoSize) {
      return cb(new Error('Video file too large. Max 25MB allowed.'));
    }
    cb(null, true);
  } else if (documentTypes.includes(file.mimetype)) {
    if (file.size > maxDocumentSize) {
      return cb(new Error('Document file too large. Max 10MB allowed.'));
    }
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, JPG, MP4, PDF, DOC, and DOCX allowed.'));
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
});

export default upload;
