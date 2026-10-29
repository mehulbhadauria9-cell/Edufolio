import { Router } from 'express';
import { createUser, listProfiles, setRole } from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Matches Edge Function `create-user`
router.post('/create-user', authenticate, createUser);

// Matches RPC `admin_set_role` and profiles select
router.get('/', authenticate, authorize('faculty', 'admin'), listProfiles);
router.get('/profiles', authenticate, authorize('faculty', 'admin'), listProfiles);
router.post('/set-role', authenticate, authorize('admin'), setRole);

export default router;
