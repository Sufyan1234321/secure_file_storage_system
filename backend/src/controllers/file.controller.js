import File from '../models/file.model.js';
import User from '../models/user.model.js';
import { validateUploadName } from '../middleware/upload.middleware.js';
import { getFilePath, removeStoredFile } from '../services/file.service.js';
import { generateShareToken } from '../utils/generateToken.js';
import { sendSuccess } from '../utils/response.js';

function userCanManageFile(file, user) {
  const isAdmin = user.role === 'admin';
  const isOwner = file.owner._id.toString() === user._id.toString();

  return isAdmin || isOwner;
}

export async function requestUpload(req, res) {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please choose a file' });
  }

  validateUploadName(req.file.originalname);
  const isPublic = req.body.isPublic === 'true';
  const folder = typeof req.body.folder === 'string' && req.body.folder.trim()
    ? req.body.folder.trim().slice(0, 60)
    : 'General';

  const file = await File.create({
    originalName: req.file.originalname,
    folder,
    size: req.file.size,
    mimeType: req.file.mimetype,
    storageName: req.file.filename,
    owner: req.user._id,
    isPublic,
    shareToken: isPublic ? generateShareToken() : undefined
  });

  return sendSuccess(res, { file }, 201);
}

export async function listFiles(req, res) {
  const filter = req.user.role === 'admin'
    ? {}
    : { owner: req.user._id };
  const files = await File.find(filter)
    .select('+shareToken')
    .populate('owner', 'name email')
    .sort({ createdAt: -1 });

  return sendSuccess(res, { files });
}

export async function updateFile(req, res) {
  const file = await File.findById(req.params.id)
    .populate('owner', 'name email');

  if (!file) {
    return res.status(404).json({ success: false, message: 'File not found' });
  }

  if (!userCanManageFile(file, req.user)) {
    return res.status(403).json({ success: false, message: 'You do not own this file' });
  }

  if (typeof req.body.isPublic !== 'boolean') {
    return res.status(422).json({ success: false, message: 'isPublic must be a boolean' });
  }

  file.isPublic = req.body.isPublic;
  file.shareToken = file.isPublic
    ? file.shareToken || generateShareToken()
    : undefined;
  await file.save();

  return sendSuccess(res, { file });
}

export async function deleteFile(req, res) {
  const file = await File.findById(req.params.id)
    .populate('owner', 'name email');

  if (!file) {
    return res.status(404).json({ success: false, message: 'File not found' });
  }

  if (!userCanManageFile(file, req.user)) {
    return res.status(403).json({ success: false, message: 'You do not own this file' });
  }

  await removeStoredFile(file.storageName);
  await file.deleteOne();

  return sendSuccess(res, { message: 'File deleted' });
}

export async function downloadFile(req, res) {
  const file = await File.findById(req.params.id)
    .populate('owner', 'name email');

  if (!file) {
    return res.status(404).json({ success: false, message: 'File not found' });
  }

  const isAllowed = file.isPublic || userCanManageFile(file, req.user);

  if (!isAllowed) {
    return res.status(403).json({ success: false, message: 'This file is private' });
  }

  return res.download(getFilePath(file.storageName), file.originalName);
}

export async function publicDownload(req, res) {
  const file = await File.findOne({
    shareToken: req.params.shareToken,
    isPublic: true
  }).select('+shareToken');

  if (!file) {
    return res.status(404).json({ success: false, message: 'Shared file not found' });
  }

  return res.download(getFilePath(file.storageName), file.originalName);
}

export async function listUsers(req, res) {
  const users = await User.find()
    .select('name email role createdAt')
    .sort({ createdAt: -1 });

  return sendSuccess(res, { users });
}
