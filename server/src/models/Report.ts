import mongoose, { Schema, Document } from 'mongoose';
import { Report as IReport } from '../types';

export interface ReportDocument extends Omit<IReport, 'id'>, Document {
  id: string;
}

const ReportSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    reportNumber: { type: String, required: true },
    reporterId: { type: String },
    reporterName: { type: String },
    reporterEmail: { type: String },
    isAnonymous: { type: Boolean, default: false },
    category: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    originalImageUrl: { type: String, default: '' },
    annotatedImageUrl: { type: String },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    address: { type: String, default: '' },
    wardOrZone: { type: String },
    city: { type: String, default: '' },
    verificationStatus: { type: String, default: 'pending', index: true },
    estimatedSeverity: { type: String, default: 'medium', index: true },
    priorityScore: { type: Number, default: 50 },
    resolutionStatus: { type: String, default: 'submitted', index: true },
    assignedDepartment: { type: String },
    assignedOfficer: { type: String },
    votes: { type: Number, default: 0 },
    votedIps: { type: [String], default: [] },
    detection: { type: Schema.Types.Mixed },
    resolutionNotes: { type: String },
    resolutionImageUrl: { type: String },
    auditLogs: { type: [Schema.Types.Mixed], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

ReportSchema.index({ location: '2dsphere' });

export const ReportModel = mongoose.models.Report || mongoose.model<ReportDocument>('Report', ReportSchema);
