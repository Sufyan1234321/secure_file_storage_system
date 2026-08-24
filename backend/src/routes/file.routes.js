import { Router } from 'express';
import {
	deleteFile,
	downloadFile,
	listFiles,
	listUsers,
	publicDownload,
	requestUpload,
	updateFile
} from '../controllers/file.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { uploadFile } from '../middleware/upload.middleware.js';

const router = Router();

router.get('/share/:shareToken', publicDownload);
router.use(protect);
router.post('/upload', uploadFile, requestUpload);
router.get('/', listFiles);
router.get('/users', requireRole('admin'), listUsers);
router.get('/:id/download', downloadFile);
router.patch('/:id', updateFile);
router.delete('/:id', deleteFile);

export default router;
