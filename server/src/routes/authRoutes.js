import { Router } from 'express';
import {
  login,
  sendResetLink,
  verifyResetToken,
  resetPasswordWithToken,
  updatePassword,
  getMe
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/send-reset-link', sendResetLink);
router.post('/verify-reset-token', verifyResetToken);
router.post('/reset-password-with-token', resetPasswordWithToken);
router.post('/update-password', authenticate, updatePassword);
router.get('/me', authenticate, getMe);

export default router;
