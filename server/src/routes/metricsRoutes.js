import { Router } from 'express';
import { getMetrics } from '../controllers/metricsController.js';
import { optionalAuthenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuthenticate, getMetrics);

export default router;
