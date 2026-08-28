import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { getCloudinary } from '../config/cloudinary.js';

const uploadDirectory = path.join(process.cwd(), 'uploads');

export function uploadStoredFile(file, ownerId, folder) {
  const cloudinary = getCloudinary();
  const publicId = `secure-file-storage/${ownerId}/${folder}/${crypto.randomUUID()}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({
      public_id: publicId,
      resource_type: 'auto'
    }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    Readable.from(file.buffer).pipe(uploadStream);
  });
}

export function getFilePath(storageName) {
  const filePath = path.resolve(uploadDirectory, storageName);
  const directory = `${path.resolve(uploadDirectory)}${path.sep}`;

  if (!filePath.startsWith(directory)) {
    throw new Error('Invalid file path');
  }

  return filePath;
}

export async function removeStoredFile(storageName, resourceType = 'raw', storageUrl) {
  if (storageUrl) {
    const cloudinary = getCloudinary();
    await cloudinary.uploader.destroy(storageName, { resource_type: resourceType, invalidate: true });
    return;
  }

  await fs.unlink(getFilePath(storageName));
}

export async function moveStoredFile(storageName, ownerId, folder, resourceType, storageUrl) {
  if (storageUrl) {
    const cloudinary = getCloudinary();
    const fileName = storageName.split('/').pop();
    const destination = `secure-file-storage/${ownerId}/${folder}/${fileName}`;
    const result = await cloudinary.uploader.rename(storageName, destination, {
      resource_type: resourceType,
      overwrite: false,
      invalidate: true
    });

    return { storageName: result.public_id, storageUrl: result.secure_url };
  }

  const sourcePath = getFilePath(storageName);
  const folderPath = path.resolve(uploadDirectory, String(ownerId), folder);
  const destinationName = path.join(String(ownerId), folder, path.basename(storageName));

  await fs.mkdir(folderPath, { recursive: true });
  await fs.rename(sourcePath, path.join(folderPath, path.basename(storageName)));

  return { storageName: destinationName };
}

export async function sendStoredFile(file, res) {
  if (!file.storageUrl) {
    return res.download(getFilePath(file.storageName), file.originalName);
  }

  const response = await fetch(file.storageUrl);
  if (!response.ok || !response.body) {
    throw new Error('Unable to retrieve file from Cloudinary');
  }

  res.setHeader('Content-Type', file.mimeType);
  res.attachment(file.originalName);
  Readable.fromWeb(response.body).pipe(res);
}
