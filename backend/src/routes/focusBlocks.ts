import { Router } from 'express';
import { getFocusBlocks, createFocusBlock, updateFocusBlock, deleteFocusBlock, syncCalendar } from '../controllers/focusBlocks';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/', getFocusBlocks);
router.post('/', createFocusBlock);
router.patch('/:id', updateFocusBlock);
router.delete('/:id', deleteFocusBlock);

router.post('/sync', syncCalendar);

export default router;
