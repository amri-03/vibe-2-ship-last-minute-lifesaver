import { Router } from 'express';
import { getTasks, createTask, updateTask } from '../controllers/tasks';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/', getTasks);
router.post('/', createTask);
router.patch('/:id', updateTask);

export default router;
