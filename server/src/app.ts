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

// 1. Enhanced Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows image display in Leaflet maps
    xContentTypeOptions: true,
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'sameorigin' },
    hsts: { maxAge: 31536000, includeSubDomains: true },
  })
);

// 2. Strict CORS Configuration
const allowedOrigins = [
  config.frontendUrl,
  'http://localhost:5173',
  'http://localhost:5000',
  'http://localhost:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. serverless internal, curl, mobile apps)
      if (!origin) return callback(null, true);

      // Check allowed list or Vercel / Railway domains
      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.up.railway.app') ||
        origin.endsWith('.pages.dev');

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('CORS request blocked by security policy.'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 3. Granular Rate Limiters to Prevent Abuse & Brute-Force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 login/register attempts per IP
  message: { success: false, error: { message: 'Too many authentication attempts. Please try again in 15 minutes.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

const detectLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30, // max 30 AI detections per IP per 10 mins
  message: { success: false, error: { message: 'AI vision inference rate limit reached. Please wait a few minutes.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests * 5,
  message: { success: false, error: { message: 'Too many requests, please slow down.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiters
app.use('/api/', generalLimiter);
app.use('/api/v1/auth/', authLimiter);
app.use('/api/v1/detect', detectLimiter);

// 4. Safe Body Parsing (Restricted payload sizes)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Static Files for Uploads
const uploadsPath = path.join(__dirname, '..', config.upload.uploadDir);
app.use('/uploads', express.static(uploadsPath));

// 6. API Endpoints
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/detect', detectRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// 7. Static files for client build when running as full-stack app
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

// 8. 404 & Global Error Handling
app.use(notFound);
app.use(errorHandler);

export default app;
