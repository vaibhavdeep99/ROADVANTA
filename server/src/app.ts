import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import config from './config';
import { notFound, errorHandler } from './middleware/errorHandler';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import reportsRoutes from './routes/reports';
import detectRoutes from './routes/detect';
import analyticsRoutes from './routes/analytics';

const app = express();

// Security middleware with cross-origin resource policy for uploads
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: '*', // Allow client connections
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests * 10, // Generous for local development & testing
  message: {
    success: false,
    error: { message: 'Too many requests, please try again later.' },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static files for uploaded images
const uploadsPath = path.join(__dirname, '..', config.upload.uploadDir);
app.use('/uploads', express.static(uploadsPath));

// API Routes
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/detect', detectRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// Static files for client build when running as full-stack app
const clientDistPath = path.join(__dirname, '..', '..', 'client', 'dist');
try {
  const fs = require('fs');
  if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
        return next();
      }
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  }
} catch {
  // Silent fallback
}

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

export default app;
