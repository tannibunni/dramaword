import express from 'express';
import { getWord, searchWord, getUserWords } from '../controllers/wordController';
import { authMiddleware } from '../middleware/auth';
import { validateWord } from '../middleware/validation';

const router = express.Router();

// Public routes
router.get('/search', searchWord);
router.get('/user', getUserWords);
router.get('/:word', getWord);

// Authenticated routes below (example)
// router.post('/', authMiddleware, validateWord, saveUserWord);

export default router; 