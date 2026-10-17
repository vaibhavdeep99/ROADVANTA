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
    if (count < seedReports.length) {
      console.log(`🌱 Syncing MongoDB Atlas: found ${count} reports, ensuring all ${seedReports.length} seed hazards exist...`);
      const existingIds = new Set(await ReportModel.distinct('id'));
      const toInsert = seedReports.filter((r) => !existingIds.has(r.id));
      if (toInsert.length > 0) {
        await ReportModel.insertMany(toInsert, { ordered: false });
        console.log(`✅ Successfully added ${toInsert.length} new hazards to MongoDB Atlas!`);
      }
    } else {
      console.log(`📊 MongoDB Atlas contains ${count} reports.`);
    }
  } catch (err: any) {
    console.warn(`⚠️ Seeding note: ${err.message}`);
  }
};
