import Folder from '../models/folder.model.js';
import { validateFolderName } from '../middleware/upload.middleware.js';
import { sendSuccess } from '../utils/response.js';

export async function listFolders(req, res) {
  const folders = await Folder.find({ owner: req.user._id }).sort({ name: 1 });
  return sendSuccess(res, { folders });
}

export async function createFolder(req, res) {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  validateFolderName(name);

  try {
    const folder = await Folder.create({ name, owner: req.user._id });
    return sendSuccess(res, { folder }, 201);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'A folder with this name already exists' });
    }
    throw error;
  }
}
