import { Router } from 'express';
import { getLanes } from '../controllers/laneController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware, getLanes);

export default router;
