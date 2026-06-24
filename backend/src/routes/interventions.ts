import { Router } from 'express';

const router = Router();

// POST /api/interventions/generate
router.post('/generate', (req, res) => {
  res.status(501).json({ message: 'Generate interventions not implemented' });
});

// PATCH /api/interventions/:id/status
router.patch('/:id/status', (req, res) => {
  res.status(501).json({ message: 'Update intervention status not implemented' });
});

export default router;
