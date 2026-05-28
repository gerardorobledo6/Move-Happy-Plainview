import { Router } from 'express';
import { login, register, getMe, getPublicStats } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.get('/stats', getPublicStats);

export default router;
