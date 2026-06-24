import { Router } from 'express';

const router = Router();

// GET /api/tasks
router.get('/', (req, res) => {
  res.status(501).json({ message: 'Get tasks not implemented' });
});

// POST /api/tasks
router.post('/', (req, res) => {
  res.status(501).json({ message: 'Create task not implemented' });
});

// PATCH /api/tasks/:id
router.patch('/:id', (req, res) => {
  res.status(501).json({ message: 'Update task not implemented' });
});

export default router;
