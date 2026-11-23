
import { Router } from 'express';
import {
    getLanes,
    createLane,
    updateLane,
        deleteLane,
    moveLane
} from '../controllers/laneController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware, getLanes);
router.post('/', authMiddleware, createLane);
router.put('/:id', authMiddleware, updateLane);
router.patch('/:id/move', authMiddleware, moveLane);
router.delete('/:id', authMiddleware, deleteLane);

export default router;
