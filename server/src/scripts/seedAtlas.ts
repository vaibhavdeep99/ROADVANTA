import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import { ReportModel } from '../models/Report';
import { seedReports } from '../data/seedData';
import config from '../config';

const seed = async () => {
  try {
    console.log('Connecting to MongoDB Atlas at:', config.mongodb.uri.split('@')[1] || 'cluster');
    await mongoose.connect(config.mongodb.uri, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log('✅ Connected to MongoDB Atlas!');

    const existingCount = await ReportModel.countDocuments();
    console.log(`Current reports in MongoDB Atlas: ${existingCount}`);

    for (const r of seedReports) {
      await ReportModel.findOneAndUpdate(
        { id: r.id },
        { $set: r },
        { upsert: true, new: true }
      );
    }

    const finalCount = await ReportModel.countDocuments();
    console.log(`🎉 Successfully seeded/synced! Total reports in MongoDB Atlas: ${finalCount}`);

    await mongoose.disconnect();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
};

seed();
