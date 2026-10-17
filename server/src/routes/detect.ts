import { Router, Request, Response } from 'express';
import { upload } from '../middleware/upload';
import { analyzeRoadImage } from '../services/aiDetection';

const router = Router();

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
    console.error('AI Detection Error:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'AI detection failed to process image.' },
    });
  }
});

export default router;
