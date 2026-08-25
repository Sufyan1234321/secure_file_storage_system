import fs from 'node:fs/promises';
import path from 'node:path';
import { uploadDirectory } from '../middleware/upload.middleware.js';

export function getFilePath(storageName) {
  const filePath = path.resolve(uploadDirectory, storageName);
  const directory = `${path.resolve(uploadDirectory)}${path.sep}`;

  if (!filePath.startsWith(directory)) {
    throw new Error('Invalid file path');
  }

  return filePath;
}

export async function removeStoredFile(storageName) {
  await fs.unlink(getFilePath(storageName));
}
