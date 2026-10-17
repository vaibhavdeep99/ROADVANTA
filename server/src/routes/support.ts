import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { SupportTicketModel } from '../models/SupportTicket';

const router = Router();

// In-memory support store fallback
const memoryTickets: any[] = [];

// POST /api/v1/support
router.post('/', async (req: Request, res: Response) => {
  try {
    const { category, email, description, name, subject } = req.body;

    if (!category || !email || !description) {
      res.status(400).json({
        success: false,
        error: { message: 'Category, contact email, and description are required.' },
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        error: { message: 'Please provide a valid contact email.' },
      });
      return;
    }

    const ticketId = `RV-SUP-${Date.now().toString().slice(-6)}`;
    const ticketData = {
      ticketId,
      category: String(category).trim(),
      email: String(email).trim().toLowerCase(),
      name: String(name || 'RoadVanta User').trim(),
      subject: String(subject || 'Support Ticket').trim(),
      description: String(description).trim(),
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    memoryTickets.push(ticketData);

    if (mongoose.connection.readyState === 1) {
      try {
        await SupportTicketModel.create(ticketData);
      } catch (err: any) {
        console.warn('Could not persist support ticket in MongoDB Atlas:', err.message);
      }
    }

    res.status(201).json({
      success: true,
      data: {
        ticketId,
        status: 'open',
        message: 'Your support inquiry has been registered. Our municipal technical support team will contact you.',
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: 'Internal server error while processing support request.' } });
  }
});

export default router;
