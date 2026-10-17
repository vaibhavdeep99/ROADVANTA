import { Router, Request, Response } from 'express';
import { reportStore } from '../data/store';
import { upload } from '../middleware/upload';
import { analyzeRoadImage } from '../services/aiDetection';
import { AuthenticatedRequest, authenticate, requireAuth } from '../middleware/auth';
import { HazardCategory, SeverityLevel } from '../types';

const router = Router();

const VALID_CATEGORIES: HazardCategory[] = [
  'pothole',
  'road_crack',
  'broken_surface',
  'road_debris',
  'damaged_signal',
  'damaged_barrier',
  'waterlogging',
  'road_obstruction',
  'potential_accident',
  'citizen_reported_accident',
  'other',
];

// Helper: Basic string sanitization to prevent stored XSS
const sanitizeString = (str: any, maxLength = 200): string => {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>]/g, '') // strip HTML brackets
    .trim()
    .slice(0, maxLength);
};

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
      search: search ? sanitizeString(search as string, 100) : undefined,
      city: city ? sanitizeString(city as string, 50) : undefined,
      bounds,
    });

    res.json({
      success: true,
      data: reports,
      count: reports.length,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: 'Failed to retrieve reports.' } });
  }
});

// GET /api/v1/reports/:id
router.get('/:id', (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const sanitizedId = sanitizeString(id, 60);
    const report = reportStore.getById(sanitizedId);

    if (!report) {
      res.status(404).json({ success: false, error: { message: 'Report not found' } });
      return;
    }

    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: 'Failed to retrieve report details.' } });
  }
});

// POST /api/v1/reports
router.post('/', authenticate, upload.single('image'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rawCategory = req.body.category;
    const category: HazardCategory = VALID_CATEGORIES.includes(rawCategory) ? rawCategory : 'pothole';

    const title = sanitizeString(req.body.title || 'Reported Road Hazard', 120);
    const description = sanitizeString(req.body.description || 'Road surface obstruction reported by community.', 1000);
    const address = sanitizeString(req.body.address || 'Reported Road Network', 180);
    const city = sanitizeString(req.body.city || 'Kanpur', 60);
    const wardOrZone = sanitizeString(req.body.wardOrZone || 'Expressway Corridor', 80);

    let originalImageUrl = req.body.originalImageUrl ? sanitizeString(req.body.originalImageUrl, 500) : '';
    let detection = undefined;
    let estimatedSeverity: SeverityLevel = 'medium';
    let priorityScore = 65;

    // Process image file if uploaded
    if (req.file) {
      originalImageUrl = `/uploads/${req.file.filename}`;
      try {
        const aiResult = await analyzeRoadImage(req.file.path, undefined, req.file.mimetype);
        detection = aiResult.detection;
        estimatedSeverity = aiResult.suggestedSeverity;
        priorityScore = aiResult.suggestedPriorityScore;
      } catch (e) {
        console.warn('AI inline detection note:', e);
      }
    }

    // Validate Coordinates with strict numeric and boundary check
    let coords: [number, number] = [80.3319, 26.4499]; // Default Kanpur fallback
    if (req.body.coordinates) {
      try {
        const parsed = typeof req.body.coordinates === 'string' ? JSON.parse(req.body.coordinates) : req.body.coordinates;
        if (Array.isArray(parsed) && parsed.length === 2) {
          const lng = parseFloat(parsed[0]);
          const lat = parseFloat(parsed[1]);
          if (!isNaN(lng) && !isNaN(lat) && lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
            coords = [lng, lat];
          }
        }
      } catch {}
    } else if (req.body.latitude && req.body.longitude) {
      const lat = parseFloat(req.body.latitude);
      const lng = parseFloat(req.body.longitude);
      if (!isNaN(lng) && !isNaN(lat) && lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
        coords = [lng, lat];
      }
    }

    // SECURITY: Server-enforced fields (Never trust client verificationStatus or resolutionStatus)
    const newReport = reportStore.create({
      reporterId: req.user?.id,
      reporterName: req.body.isAnonymous === 'true' || req.body.isAnonymous === true
        ? 'Anonymous Citizen'
        : (req.user?.name || sanitizeString(req.body.reporterName || 'Citizen User', 60)),
      reporterEmail: req.user?.email || (req.body.reporterEmail ? sanitizeString(req.body.reporterEmail, 80) : undefined),
      isAnonymous: req.body.isAnonymous === 'true' || req.body.isAnonymous === true,
      category,
      title,
      description,
      originalImageUrl,
      annotatedImageUrl: req.body.annotatedImageUrl ? sanitizeString(req.body.annotatedImageUrl, 500) : undefined,
      location: {
        type: 'Point',
        coordinates: coords,
      },
      address,
      wardOrZone,
      city,
      verificationStatus: 'awaiting_verification', // Server-enforced
      estimatedSeverity, // Server / AI-enforced
      priorityScore,     // Server / AI-enforced
      assignedDepartment: undefined, // Must be assigned by authority
      detection,
    });

    res.status(201).json({
      success: true,
      data: newReport,
      message: `Report ${newReport.reportNumber} registered successfully.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: 'Failed to create report.' } });
  }
});

// PATCH /api/v1/reports/:id (Protected with granular role & ownership check)
router.patch('/:id', authenticate, requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const existing = reportStore.getById(id);

    if (!existing) {
      res.status(404).json({ success: false, error: { message: 'Report not found' } });
      return;
    }

    // Authorization check
    const isOwner = existing.reporterId && existing.reporterId === user.id;
    const isAuthority = user.role === 'authority' || user.role === 'admin';

    if (!isAuthority && !isOwner) {
      res.status(403).json({
        success: false,
        error: { message: 'Forbidden: You do not have permission to modify this report.' },
      });
      return;
    }

    // Filter permitted updates based on role
    const updates: any = {};

    if (isAuthority) {
      // Authorities can update verification, resolution, assignments, and severity
      if (req.body.verificationStatus) updates.verificationStatus = req.body.verificationStatus;
      if (req.body.resolutionStatus) updates.resolutionStatus = req.body.resolutionStatus;
      if (req.body.assignedDepartment) updates.assignedDepartment = sanitizeString(req.body.assignedDepartment, 80);
      if (req.body.assignedOfficer) updates.assignedOfficer = sanitizeString(req.body.assignedOfficer, 80);
      if (req.body.resolutionNotes) updates.resolutionNotes = sanitizeString(req.body.resolutionNotes, 500);
      if (req.body.estimatedSeverity) updates.estimatedSeverity = req.body.estimatedSeverity;
      if (req.body.priorityScore) updates.priorityScore = Math.min(100, Math.max(1, parseInt(req.body.priorityScore, 10)));
    }

    // Both author and authority can update basic content
    if (req.body.title) updates.title = sanitizeString(req.body.title, 120);
    if (req.body.description) updates.description = sanitizeString(req.body.description, 1000);

    const updated = reportStore.update(id, updates, user.name, user.role);

    res.json({
      success: true,
      data: updated,
      message: 'Report updated successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: 'Failed to update report.' } });
  }
});

// DELETE /api/v1/reports/:id (Only author or admin can delete)
router.delete('/:id', authenticate, requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const existing = reportStore.getById(id);

    if (!existing) {
      res.status(404).json({ success: false, error: { message: 'Report not found' } });
      return;
    }

    const isOwner = existing.reporterId && existing.reporterId === user.id;
    const isAdmin = user.role === 'admin';

    if (!isAdmin && !isOwner) {
      res.status(403).json({
        success: false,
        error: { message: 'Forbidden: You do not have permission to delete this report.' },
      });
      return;
    }

    const deleted = reportStore.delete(id);
    if (!deleted) {
      res.status(404).json({ success: false, error: { message: 'Report could not be deleted.' } });
      return;
    }

    res.json({ success: true, message: 'Report deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: 'Failed to delete report.' } });
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
