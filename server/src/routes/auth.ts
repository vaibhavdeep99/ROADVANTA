import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { demoUsers } from '../data/store';
import { AuthenticatedRequest, authenticate } from '../middleware/auth';

const router = Router();

// POST /api/v1/auth/login
router.post('/login', (req: Request, res: Response) => {
  const { email, password, role } = req.body;

  let user = demoUsers.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());

  // Demo convenience: allow fast login with just role if email omitted
  if (!user && role) {
    user = demoUsers.find((u) => u.role === role);
  }

  if (!user) {
    // Generate citizen user on the fly if testing with custom email
    user = {
      id: `usr-${Date.now()}`,
      name: email ? email.split('@')[0] : 'Citizen User',
      email: email || 'citizen@roadpatrol.ai',
      role: (role as any) || 'citizen',
      createdAt: new Date().toISOString(),
    };
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expire as any || '7d' }
  );

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        badgeNumber: user.badgeNumber,
      },
      token,
    },
    message: `Logged in successfully as ${user.role}`,
  });
});

// GET /api/v1/auth/me
router.get('/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { message: 'Not authenticated' } });
    return;
  }
  res.json({ success: true, data: { user: req.user } });
});

// GET /api/v1/auth/demo-users
router.get('/demo-users', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: demoUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department,
    })),
  });
});

export default router;
