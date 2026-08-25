import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes.js';
import fileRoutes from './routes/file.routes.js';
import { publicDownload } from './controllers/file.controller.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';

const app = express();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Try again later.' }
});

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.get('/api/health', (req, res) => res.json({ success: true, message: 'API is running' }));
app.use('/api/auth', authLimiter, authRoutes);
app.get('/api/share/:shareToken', publicDownload);
app.use('/api/files', fileRoutes);
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});
app.use(notFound);
app.use(errorHandler);

export default app;
