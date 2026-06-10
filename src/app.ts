import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { authRoutes } from './modules/auth/index.js';
import { postsRoutes } from './modules/posts/index.js';
import { accountsRoutes } from './modules/accounts/index.js';
import { analyticsRoutes } from './modules/analytics/index.js';
import { settingsRoutes } from './modules/settings/index.js';
import { adminRoutes } from './modules/admin/index.js';
import { aiRoutes } from './modules/ai/index.js';
import { notificationRoutes } from './modules/notifications/index.js';
import { linkedinRoutes } from './modules/linkedin/index.js';
import { validateEnvironment } from './config/env.js';
import connectDB from './config/db.js';
import { initSocket } from './sockets/socketService.js';
import './modules/posts/worker.js';
import healthRoutes from './routes/health.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';
import { protect } from './middlewares/auth.js';

dotenv.config();

validateEnvironment();

connectDB();

const app = express();

const server = http.createServer(app);
initSocket(server);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(helmet({
  crossOriginResourcePolicy: false,
}));

const allowedOrigins = [process.env.CLIENT_URL].filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');
    const isProduction = process.env.NODE_ENV === 'production';
    if (!origin || allowedOrigins.includes(origin) || (isLocal && !isProduction)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts, please try again after 15 minutes.' },
});

app.use('/', healthRoutes);

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api', apiLimiter);

// protect imported AFTER all module routes to avoid circular dependency TDZ error

const screenshotsDir = path.join(__dirname, '../uploads/screenshots');
if (process.env.NODE_ENV === 'production') {
  app.use('/screenshots', protect, express.static(screenshotsDir));
} else {
  app.use('/screenshots', express.static(screenshotsDir));
}

app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/linkedin', linkedinRoutes);

app.get('/', (_req, res) => {
  res.json({ message: 'Welcome to LinkPilot AI Scheduling Platform API' });
});


app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

const shutdown = (signal: string): void => {
  console.log(`[Shutdown] Received ${signal}. Closing server...`);
  server.close(() => {
    console.log('[Shutdown] HTTP server closed.');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('[Shutdown] Forced exit after timeout.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

export { app, server };