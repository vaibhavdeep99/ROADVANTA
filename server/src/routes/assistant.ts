import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config';
import { reportStore } from '../data/store';
import { ReportModel } from '../models/Report';
import mongoose from 'mongoose';

const router = Router();

let genAI: GoogleGenerativeAI | null = null;
if (config.gemini.apiKey && config.gemini.apiKey !== 'your-gemini-api-key-here') {
  try {
    genAI = new GoogleGenerativeAI(config.gemini.apiKey);
  } catch (e) {
    console.warn('⚠️ Gemini assistant client initialization failed:', e);
  }
}

// POST /api/v1/assistant/chat
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const userMessage = (req.body.message || '').trim().slice(0, 500);
    const history: Array<{ role: 'user' | 'model'; parts: string }> = Array.isArray(req.body.history)
      ? req.body.history.slice(-6)
      : [];

    if (!userMessage) {
      res.status(400).json({ success: false, error: { message: 'Message is required.' } });
      return;
    }

    // Gather live summary context from MongoDB / store
    let reportCount = 0;
    let sampleHazards = '';
    try {
      if (mongoose.connection.readyState === 1) {
        reportCount = await ReportModel.countDocuments();
        const recent = await ReportModel.find({}, 'title category city estimatedSeverity').limit(4).lean();
        sampleHazards = recent.map((r) => `• [${r.estimatedSeverity?.toUpperCase()}] ${r.title} (${r.city})`).join('\n');
      } else {
        const all = reportStore.getAll();
        reportCount = all.length;
        sampleHazards = all.slice(0, 4).map((r) => `• [${r.estimatedSeverity?.toUpperCase()}] ${r.title} (${r.city})`).join('\n');
      }
    } catch {}

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({
          model: config.gemini.model || 'gemini-3.8-flash',
          systemInstruction: `You are the RoadVanta AI Assistant. Tagline: "See Risks. Save Roads."
You help citizens, drivers, and municipal road maintenance workers with road safety, hazard reporting, and traffic infrastructure guidance.

CONTEXT ON CURRENT ROADVANTA PLATFORM:
- Total operational reports in database: ${reportCount}
- Active sample corridor incidents:
${sampleHazards || '• Highway Pothole (Kanpur NH-27)\n• Waterlogging (Koramangala)\n• Expressway Sinkhole (Unnao)'}

CAPABILITIES & GUIDELINES:
1. Explain how to report a road hazard (go to "Report Hazard", pin GPS on OpenStreetMap, take/upload a photo, AI will analyze severity).
2. Explain report statuses:
   - "Submitted / Awaiting Verification": Citizen report logged, pending municipal inspection or AI verification.
   - "Assigned": Dispatched to Public Works Department (PWD) or Traffic Division.
   - "In Progress": Repair crew or asphalt patch vehicle deployed on-site.
   - "Resolved": Pothole filled/paved, confirmed with after-repair photographic evidence.
3. If asked about road safety statistics in India:
   - Mention official MoRTH data: In 2023, India recorded 480,583 accidents and 172,890 fatalities. In 2025: 513,563 accidents and 183,382 fatalities. In early 2026 (Jan-Jun): 285,770 accidents.
   - Mention that national stats do not guarantee current conditions on any specific unmonitored road.
4. Keep responses concise, helpful, and empathetic. Use bullet points where appropriate.
5. Emphasize that in life-threatening highway emergencies, citizens should dial national emergency 112 immediately.`,
        });

        const chat = model.startChat({
          history: history.map((h) => ({
            role: h.role === 'model' ? 'model' : 'user',
            parts: [{ text: h.parts }],
          })),
        });

        const result = await chat.sendMessage(userMessage);
        const reply = result.response.text();

        res.json({
          success: true,
          data: {
            reply,
            model: config.gemini.model || 'gemini-3.8-flash',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      } catch (geminiError: any) {
        console.warn('Gemini chat API error, using safe rule-based response:', geminiError.message);
      }
    }

    // Safe Rule-Based Intelligent Fallback
    const lower = userMessage.toLowerCase();
    let reply = `RoadVanta AI Assistant ("See Risks. Save Roads."):\n\n`;

    if (lower.includes('report') || lower.includes('file') || lower.includes('how to')) {
      reply += `To report a road defect or hazard:\n1. Click "File Report" in the navigation bar or dashboard.\n2. Pin the exact location on our OpenStreetMap interface.\n3. Upload a clear photograph (our Gemini 3.8 Vision engine will automatically scan for potholes and cracks).\n4. Submit to dispatch to the relevant municipal department (PWD, Traffic Police).`;
    } else if (lower.includes('status') || lower.includes('assigned') || lower.includes('progress') || lower.includes('resolved')) {
      reply += `RoadVanta Workflow Statuses:\n• **Submitted**: New citizen report, awaiting verification.\n• **Assigned**: Delegated to municipal division (e.g. PWD Quick Action Team).\n• **In Progress**: Road resurfacing or drainage crews dispatched to location.\n• **Resolved**: Hazard patched, verified with before-and-after photo evidence.`;
    } else if (lower.includes('stat') || lower.includes('accident') || lower.includes('death') || lower.includes('data')) {
      reply += `Official Ministry of Road Transport and Highways (MoRTH) Data:\n• 2023: 480,583 accidents | 172,890 fatalities\n• 2024: 487,707 accidents | 177,175 fatalities\n• 2025: 513,563 accidents | 183,382 fatalities\n• Jan-Jun 2026: 285,770 accidents (partial 6-month data)\nVisit our "Road Safety Statistics" dashboard for interactive charts!`;
    } else {
      reply += `I can help you navigate RoadVanta AI:\n• Type "how to report" for step-by-step reporting guide\n• Type "statuses" to understand repair tracking\n• Type "safety stats" for official MoRTH road accident data\n• For immediate highway life hazards, please also dial emergency services 112.`;
    }

    res.json({
      success: true,
      data: {
        reply,
        model: 'RoadVanta-Heuristic-Assistant',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: 'Failed to process message.' } });
  }
});

export default router;
