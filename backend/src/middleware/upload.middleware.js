import path from 'node:path';
import multer from 'multer';

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
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.mkv': 'video/x-matroska'
};

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
  storage: multer.memoryStorage(),
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

export function validateFolderName(folder) {
  if (typeof folder !== 'string' || !folder.trim() || folder.length > 60) {
    throw createUploadError('Folder name must be between 1 and 60 characters');
  }

  if (!/^[a-zA-Z0-9][a-zA-Z0-9 _.()-]*$/.test(folder) || folder.includes('..')) {
    throw createUploadError('Folder name contains unsupported characters');
  }
}

function createUploadError(message, statusCode = 422) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
