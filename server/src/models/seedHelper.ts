import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import { ReportModel } from './Report';
import { seedReports } from '../data/seedData';

export const seedDatabaseIfEmpty = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return;
    }

    const count = await ReportModel.countDocuments();
    if (count === 0) {
      console.log(`🌱 Seeding MongoDB Atlas with ${seedReports.length} hazard reports...`);
      await ReportModel.insertMany(seedReports);
      console.log(`✅ Successfully seeded MongoDB Atlas with ${seedReports.length} reports!`);
    } else {
      console.log(`📊 MongoDB Atlas already contains ${count} reports.`);
    }
  } catch (err: any) {
    console.warn(`⚠️ Seeding warning: ${err.message}`);
  }
};
