import mongoose, { Schema, Document } from 'mongoose';

export interface ISupportTicket extends Document {
  ticketId: string;
  category: string;
  name?: string;
  email: string;
  subject?: string;
  description: string;
  status: 'open' | 'in_review' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
}

const SupportTicketSchema = new Schema(
  {
    ticketId: { type: String, required: true, unique: true, index: true },
    category: { type: String, required: true },
    name: { type: String, default: 'Citizen' },
    email: { type: String, required: true },
    subject: { type: String, default: 'General Support Inquiry' },
    description: { type: String, required: true },
    status: { type: String, default: 'open', enum: ['open', 'in_review', 'resolved'] },
  },
  { timestamps: true }
);

export const SupportTicketModel =
  mongoose.models.SupportTicket || mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);
