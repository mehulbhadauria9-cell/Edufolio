import { Router } from 'express';
import { getLeetCodeStats } from '../controllers/leetcodeController.js';

const router = Router();

router.get('/:username', getLeetCodeStats);

export default router;
