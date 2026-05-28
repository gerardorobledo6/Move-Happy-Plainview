import { Router } from 'express';
import { createCard, updateCard, deleteCard, addComment, updateFollowUp } from '../controllers/cardController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/', authMiddleware, createCard);
router.put('/:id', authMiddleware, updateCard);
router.delete('/:id', authMiddleware, deleteCard);
router.post('/:id/comments', authMiddleware, addComment);
router.put('/:id/followup', authMiddleware, updateFollowUp);

export default router;
