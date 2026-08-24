import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';

export const uploadDirectory = path.join(process.cwd(), 'uploads');
export const maxFileSize = 110 * 1024 * 1024;

const allowedFileTypes = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp'
};

fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${crypto.randomUUID()}${extension}`);
  }
});

function checkFileType(req, file, callback) {
  try {
    validateUploadName(file.originalname);
  } catch (error) {
    return callback(error);
  }

  const extension = path.extname(file.originalname).toLowerCase();
  const expectedMimeType = allowedFileTypes[extension];

  if (!expectedMimeType || expectedMimeType !== file.mimetype) {
    return callback(new Error('This file type is not allowed'));
  }

  callback(null, true);
}

export const uploadFile = multer({
  storage,
  limits: { fileSize: maxFileSize },
  fileFilter: checkFileType
}).single('file');

export function validateUploadName(filename) {
  if (typeof filename !== 'string' || filename.length > 120) {
    throw createUploadError('Filename must be 120 characters or less');
  }

  if (!/^[a-zA-Z0-9][a-zA-Z0-9 _.()-]*$/.test(filename) || filename.includes('..')) {
    throw createUploadError('Filename contains unsupported characters');
  }
}

function createUploadError(message, statusCode = 422) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
