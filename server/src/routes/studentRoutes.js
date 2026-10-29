import { Router } from 'express';
import { listStudents, getStudentById, updateStudent, syncLeetCode, deleteStudent } from '../controllers/studentController.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuthenticate, listStudents);
router.get('/:id', optionalAuthenticate, getStudentById);
router.patch('/:id', authenticate, updateStudent);
router.delete('/:id', authenticate, deleteStudent);
router.post('/:id/sync-leetcode', authenticate, syncLeetCode);

export default router;
