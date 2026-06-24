import { Router } from 'express';
import { setup, login, status, googleAuthRedirect, googleAuthCallback, seedDemoData, updateConfig } from '../controllers/auth';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// POST /api/auth/setup
router.post('/setup', setup);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/seed
router.post('/seed', seedDemoData);

// GET /api/auth/status
router.get('/status', status);

// GET /api/auth/google
router.get('/google', authenticateJWT, googleAuthRedirect);

// GET /api/auth/google/callback
router.get('/google/callback', googleAuthCallback);

// PATCH /api/auth/config
router.patch('/config', authenticateJWT, updateConfig);

export default router;
