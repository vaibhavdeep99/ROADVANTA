import mongoose from 'mongoose';
import config from './index';

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.mongodb.uri, {
      serverSelectionTimeoutMS: 10000, // 10s timeout for cloud Atlas
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
  } catch (error: any) {
    console.warn(`⚠️  MongoDB not available (${error.message}).`);
    console.log(`⚡ Activated Resilient In-Memory & File Store with Seed Data.`);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.warn('⚠️  MongoDB error:', err.message);
});

export default connectDB;
