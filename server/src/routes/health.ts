import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const healthcheck = {
    success: true,
    message: 'Road Patrol AI API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      name: mongoose.connection.name || 'N/A',
    },
    datastore: mongoose.connection.readyState === 1 ? 'mongodb' : 'persistent-store',
    version: '1.0.0',
  };

  res.status(200).json(healthcheck);
});

export default router;
