import { Router } from 'express';

const router = Router();

// POST /api/auth/setup
router.post('/setup', (req, res) => {
  res.status(501).json({ message: 'Setup not implemented' });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  res.status(501).json({ message: 'Login not implemented' });
});

// GET /api/auth/status
router.get('/status', (req, res) => {
  res.status(501).json({ message: 'Status check not implemented' });
});

// GET /api/auth/google
router.get('/google', (req, res) => {
  res.status(501).json({ message: 'Google OAuth login redirect not implemented' });
});

// GET /api/auth/google/callback
router.get('/google/callback', (req, res) => {
  res.status(501).json({ message: 'Google OAuth callback not implemented' });
});

export default router;
