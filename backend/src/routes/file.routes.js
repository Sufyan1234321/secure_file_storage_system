import { Router } from 'express';
import {
	deleteFile,
	downloadFile,
	listFiles,
	listTrash,
	listUsers,
	permanentlyDeleteFile,
	publicDownload,
	requestUpload,
	restoreFile,
	updateFile
} from '../controllers/file.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { uploadFile } from '../middleware/upload.middleware.js';
import { createFolder, listFolders } from '../controllers/folder.controller.js';

const router = Router();

router.get('/share/:shareToken', publicDownload);
router.use(protect);
router.post('/upload', uploadFile, requestUpload);
router.get('/folders', listFolders);
router.post('/folders', createFolder);
router.get('/', listFiles);
router.get('/trash', listTrash);
router.get('/users', requireRole('admin'), listUsers);
router.patch('/:id/restore', restoreFile);
router.delete('/:id/permanent', permanentlyDeleteFile);
router.get('/:id/download', downloadFile);
router.patch('/:id', updateFile);
router.delete('/:id', deleteFile);

export default router;
