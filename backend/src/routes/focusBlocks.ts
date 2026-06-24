import { Router } from 'express';

const router = Router();

// GET /api/focus-blocks
router.get('/', (req, res) => {
  res.status(501).json({ message: 'Get focus blocks not implemented' });
});

// POST /api/focus-blocks
router.post('/', (req, res) => {
  res.status(501).json({ message: 'Create focus block not implemented' });
});

// PATCH /api/focus-blocks/:id
router.patch('/:id', (req, res) => {
  res.status(501).json({ message: 'Update focus block not implemented' });
});

// POST /api/focus-blocks/sync
router.post('/sync', (req, res) => {
  res.status(501).json({ message: 'Sync calendar not implemented' });
});

export default router;
