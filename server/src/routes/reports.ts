import { Router, Request, Response } from 'express';
import { reportStore } from '../data/store';
import { upload } from '../middleware/upload';
import { analyzeRoadImage } from '../services/aiDetection';
import { AuthenticatedRequest, authenticate } from '../middleware/auth';

const router = Router();

// GET /api/v1/reports
router.get('/', (req: Request, res: Response) => {
  try {
    const {
      category,
      severity,
      resolutionStatus,
      verificationStatus,
      search,
      city,
      north,
      south,
      east,
      west,
    } = req.query;

    let bounds: { north: number; south: number; east: number; west: number } | undefined;
    if (north && south && east && west) {
      bounds = {
        north: parseFloat(north as string),
        south: parseFloat(south as string),
        east: parseFloat(east as string),
        west: parseFloat(west as string),
      };
    }

    const reports = reportStore.getAll({
      category: category as string,
      severity: severity as string,
      resolutionStatus: resolutionStatus as string,
      verificationStatus: verificationStatus as string,
      search: search as string,
      city: city as string,
      bounds,
    });

    res.json({
      success: true,
      data: reports,
      count: reports.length,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// GET /api/v1/reports/:id
router.get('/:id', (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const report = reportStore.getById(id);
  if (!report) {
    res.status(404).json({ success: false, error: { message: 'Report not found' } });
    return;
  }
  res.json({ success: true, data: report });
});

// POST /api/v1/reports
router.post('/', upload.single('image'), async (req: Request, res: Response) => {
  try {
    let originalImageUrl = req.body.originalImageUrl || '';
    let detection = req.body.detection ? JSON.parse(req.body.detection) : undefined;
    let estimatedSeverity = req.body.estimatedSeverity || 'medium';
    let priorityScore = req.body.priorityScore ? parseInt(req.body.priorityScore, 10) : 65;

    // If an image file was uploaded
    if (req.file) {
      originalImageUrl = `/uploads/${req.file.filename}`;
      // Run AI detection if not already attached
      if (!detection) {
        try {
          const aiResult = await analyzeRoadImage(req.file.path, undefined, req.file.mimetype);
          detection = aiResult.detection;
          estimatedSeverity = aiResult.suggestedSeverity;
          priorityScore = aiResult.suggestedPriorityScore;
        } catch (e) {
          console.warn('AI inline detection note:', e);
        }
      }
    }

    let coords: [number, number] = [77.6229, 12.9177];
    if (req.body.coordinates) {
      if (typeof req.body.coordinates === 'string') {
        coords = JSON.parse(req.body.coordinates);
      } else if (Array.isArray(req.body.coordinates)) {
        coords = req.body.coordinates;
      }
    } else if (req.body.latitude && req.body.longitude) {
      coords = [parseFloat(req.body.longitude), parseFloat(req.body.latitude)];
    }

    const newReport = reportStore.create({
      reporterName: req.body.reporterName || 'Citizen User',
      reporterEmail: req.body.reporterEmail,
      isAnonymous: req.body.isAnonymous === 'true' || req.body.isAnonymous === true,
      category: req.body.category || 'pothole',
      title: req.body.title || 'Reported Road Hazard',
      description: req.body.description || 'Road surface obstruction reported by community.',
      originalImageUrl,
      annotatedImageUrl: req.body.annotatedImageUrl,
      location: {
        type: 'Point',
        coordinates: coords,
      },
      address: req.body.address || 'Bengaluru Road Network',
      wardOrZone: req.body.wardOrZone || 'Metro Zone',
      city: req.body.city || 'Bengaluru',
      verificationStatus: req.body.verificationStatus || 'awaiting_verification',
      estimatedSeverity,
      priorityScore,
      assignedDepartment: req.body.assignedDepartment,
      detection,
    });

    res.status(201).json({
      success: true,
      data: newReport,
      message: `Report ${newReport.reportNumber} registered successfully.`,
    });
  } catch (error: any) {
    console.error('Error creating report:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// PATCH /api/v1/reports/:id
router.patch('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    const performer = user ? user.name : 'Authorized Official';
    const role = user ? user.role : 'authority';
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const updated = reportStore.update(id, req.body, performer, role);
    if (!updated) {
      res.status(404).json({ success: false, error: { message: 'Report not found' } });
      return;
    }

    res.json({
      success: true,
      data: updated,
      message: 'Report updated successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// POST /api/v1/reports/:id/vote
router.post('/:id/vote', (req: Request, res: Response) => {
  const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const result = reportStore.vote(id, ip);
  if (!result.success) {
    res.status(404).json({ success: false, error: { message: result.message } });
    return;
  }
  res.json({ success: true, data: result });
});

export default router;
