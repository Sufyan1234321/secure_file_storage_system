import { Router } from 'express';
import { body } from 'express-validator';
import { currentUser, login, register } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();
const email = body('email').isEmail().withMessage('A valid email is required').normalizeEmail();
const password = body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters');

router.post('/register', [body('name').trim().notEmpty().withMessage('Name is required'), email, password], register);
router.post('/login', [email, body('password').notEmpty().withMessage('Password is required')], login);
router.get('/me', protect, currentUser);

export default router;
