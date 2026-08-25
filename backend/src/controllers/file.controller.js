import File from '../models/file.model.js';
import User from '../models/user.model.js';
import { validateUploadName } from '../middleware/upload.middleware.js';
import { getFilePath, removeStoredFile } from '../services/file.service.js';
import { generateShareToken } from '../utils/generateToken.js';
import { sendSuccess } from '../utils/response.js';

const maxUserStorage = 5 * 1024 * 1024 * 1024;

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
  const usedStorage = await File.aggregate([
    { $match: { owner: req.user._id } },
    { $group: { _id: null, total: { $sum: '$size' } } }
  ]);
  const currentUsage = usedStorage[0]?.total || 0;

  if (currentUsage + req.file.size > maxUserStorage) {
    await removeStoredFile(req.file.filename).catch(() => {});
    return res.status(413).json({
      success: false,
      message: 'This upload would exceed your 5 GB storage limit'
    });
  }

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
    ? { isTrashed: false }
    : { owner: req.user._id, isTrashed: false };
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

  if (req.body.isPublic !== undefined && typeof req.body.isPublic !== 'boolean') {
    return res.status(422).json({ success: false, message: 'isPublic must be a boolean' });
  }

  if (req.body.isPublic !== undefined) {
    file.isPublic = req.body.isPublic;
    file.shareToken = file.isPublic
      ? file.shareToken || generateShareToken()
      : undefined;
  }

  if (req.body.originalName !== undefined) {
    validateUploadName(req.body.originalName);
    file.originalName = req.body.originalName;
  }

  if (req.body.folder !== undefined) {
    if (typeof req.body.folder !== 'string' || !req.body.folder.trim()) {
      return res.status(422).json({ success: false, message: 'Folder name is required' });
    }
    file.folder = req.body.folder.trim().slice(0, 60);
  }
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

  file.isTrashed = true;
  file.deletedAt = new Date();
  file.isPublic = false;
  file.shareToken = undefined;
  await file.save();

  return sendSuccess(res, { message: 'File moved to trash' });
}

export async function listTrash(req, res) {
  const filter = req.user.role === 'admin'
    ? { isTrashed: true }
    : { owner: req.user._id, isTrashed: true };
  const files = await File.find(filter)
    .select('+shareToken')
    .populate('owner', 'name email')
    .sort({ deletedAt: -1 });

  return sendSuccess(res, { files });
}

export async function restoreFile(req, res) {
  const file = await File.findOne({ _id: req.params.id, isTrashed: true })
    .populate('owner', 'name email');

  if (!file) return res.status(404).json({ success: false, message: 'Trashed file not found' });
  if (!userCanManageFile(file, req.user)) {
    return res.status(403).json({ success: false, message: 'You do not own this file' });
  }

  file.isTrashed = false;
  file.deletedAt = null;
  await file.save();
  return sendSuccess(res, { file });
}

export async function permanentlyDeleteFile(req, res) {
  const file = await File.findOne({ _id: req.params.id, isTrashed: true })
    .populate('owner', 'name email');

  if (!file) return res.status(404).json({ success: false, message: 'Trashed file not found' });
  if (!userCanManageFile(file, req.user)) {
    return res.status(403).json({ success: false, message: 'You do not own this file' });
  }

  await removeStoredFile(file.storageName);
  await file.deleteOne();
  return sendSuccess(res, { message: 'File permanently deleted' });
}

export async function downloadFile(req, res) {
  const file = await File.findById(req.params.id)
    .populate('owner', 'name email');

  if (!file) {
    return res.status(404).json({ success: false, message: 'File not found' });
  }

  if (file.isTrashed) {
    return res.status(404).json({ success: false, message: 'File is in the trash' });
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
