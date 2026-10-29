import { Router } from 'express';
import { listAchievements, createAchievement } from '../controllers/achievementController.js';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuthenticate, listAchievements);
router.post('/', authenticate, createAchievement);

export default router;
