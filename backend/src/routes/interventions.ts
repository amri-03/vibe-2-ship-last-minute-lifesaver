import { Router } from 'express';
import { generateInterventions, updateInterventionStatus } from '../controllers/interventions';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.post('/generate', generateInterventions);
router.patch('/:id/status', updateInterventionStatus);

export default router;
