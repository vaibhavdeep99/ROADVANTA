import { Router, Request, Response } from 'express';
import { upload } from '../middleware/upload';
import { analyzeRoadImage } from '../services/aiDetection';

const router = Router();

// Validate external image URL against SSRF (Server-Side Request Forgery)
const isSafePublicUrl = (urlString: string): boolean => {
  try {
    const parsed = new URL(urlString);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;

    const hostname = parsed.hostname.toLowerCase();
    // Block loopback and internal network IP ranges
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('172.16.') ||
      hostname === '169.254.169.254' // Cloud metadata IP
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

// POST /api/v1/detect
router.post('/', upload.single('image'), async (req: Request, res: Response) => {
  try {
    let imagePathOrUrl = '';
    let buffer: Buffer | undefined;
    let mimeType = 'image/jpeg';

    if (req.file) {
      imagePathOrUrl = req.file.path;
      mimeType = req.file.mimetype;
    } else if (req.body.imageUrl) {
      if (!isSafePublicUrl(req.body.imageUrl)) {
        res.status(400).json({
          success: false,
          error: { message: 'Invalid or restricted external image URL.' },
        });
        return;
      }
      imagePathOrUrl = req.body.imageUrl;
    } else {
      res.status(400).json({
        success: false,
        error: { message: 'Please upload an image file or provide an imageUrl in JSON payload.' },
      });
      return;
    }

    const publicUrl = req.file
      ? `/uploads/${req.file.filename}`
      : req.body.imageUrl;

    const analysis = await analyzeRoadImage(imagePathOrUrl, buffer, mimeType);

    res.json({
      success: true,
      data: {
        ...analysis,
        imageUrl: publicUrl,
      },
      message: 'AI Hazard analysis completed successfully.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: 'AI detection failed to process image.' },
    });
  }
});

export default router;
