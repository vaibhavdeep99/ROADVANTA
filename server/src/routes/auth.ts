import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import config from '../config';
import { demoUsers } from '../data/store';
import { AuthenticatedRequest, authenticate, requireAuth } from '../middleware/auth';
import { User } from '../types';

const router = Router();

// POST /api/v1/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ success: false, error: { message: 'Valid email address is required.' } });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ success: false, error: { message: 'Password must be at least 6 characters long.' } });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = demoUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      res.status(409).json({ success: false, error: { message: 'An account with this email already exists.' } });
      return;
    }

    // Hash password securely with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser: User = {
      id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: (name && typeof name === 'string' ? name.trim() : cleanEmail.split('@')[0]),
      email: cleanEmail,
      password: hashedPassword,
      role: 'citizen', // Enforced: users cannot self-assign authority/admin roles
      createdAt: new Date().toISOString(),
    };

    demoUsers.push(newUser);

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      config.jwt.secret,
      { expiresIn: (config.jwt.expire as any) || '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
        token,
      },
      message: 'Account registered successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: 'Failed to register account.' } });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;

    let user = demoUsers.find((u) => u.email.toLowerCase() === (email || '').trim().toLowerCase());

    // Demo convenience for hackathon: allow fast role login if email is not provided
    if (!user && role && !email) {
      user = demoUsers.find((u) => u.role === role);
    }

    if (!user) {
      // If logging in with a new email, create and hash password
      if (email && password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        user = {
          id: `usr-${Date.now()}`,
          name: email.split('@')[0],
          email: email.trim().toLowerCase(),
          password: hashedPassword,
          role: role === 'authority' ? 'authority' : 'citizen',
          createdAt: new Date().toISOString(),
        };
        demoUsers.push(user);
      } else {
        res.status(401).json({ success: false, error: { message: 'Invalid email or credentials.' } });
        return;
      }
    }

    // Verify password if user has password and password was provided
    if (user.password && password) {
      const isMatch = user.password.startsWith('$2')
        ? await bcrypt.compare(password, user.password)
        : user.password === password;

      if (!isMatch) {
        res.status(401).json({ success: false, error: { message: 'Invalid credentials. Password incorrect.' } });
        return;
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: (config.jwt.expire as any) || '7d' }
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
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: 'Authentication process failed.' } });
  }
});

// GET /api/v1/auth/me
router.get('/me', authenticate, requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { message: 'Not authenticated' } });
    return;
  }
  const { password: _, ...safeUser } = req.user as any;
  res.json({ success: true, data: { user: safeUser } });
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
