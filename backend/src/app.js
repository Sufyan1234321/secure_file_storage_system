import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes.js';
import fileRoutes from './routes/file.routes.js';
import { publicDownload } from './controllers/file.controller.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.get('/api/health', (req, res) => res.json({ success: true, message: 'API is running' }));
app.use('/api/auth', authRoutes);
app.get('/api/share/:shareToken', publicDownload);
app.use('/api/files', fileRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
