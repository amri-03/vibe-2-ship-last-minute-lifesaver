import { Router } from 'express';
import { register, login, status, googleAuthRedirect, googleAuthCallback, seedDemoData, updateConfig } from '../controllers/auth';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/seed
router.post('/seed', seedDemoData);

// GET /api/auth/status
router.get('/status', status);

// GET /api/auth/google
router.get('/google', googleAuthRedirect);

// GET /api/auth/google/callback
router.get('/google/callback', googleAuthCallback);

// PATCH /api/auth/config
router.patch('/config', authenticateJWT, updateConfig);

export default router;
