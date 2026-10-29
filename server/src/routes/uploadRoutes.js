import { Router } from 'express';
import { uploadAvatar, handleUploadResponse } from '../controllers/uploadController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/avatar', authenticate, uploadAvatar, handleUploadResponse);

export default router;
