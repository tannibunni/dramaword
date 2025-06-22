import express from 'express';
import { getWord, getUserWords, proxyAudio, saveWord } from '../controllers/wordController';
import { authMiddleware } from '../middleware/auth';
import { validateWord } from '../middleware/validation';

const router = express.Router();

// Public routes
router.get('/user', getUserWords);
router.get('/:word/audio', proxyAudio);
router.post('/', saveWord);

// 庆祝相关路由 - 必须在 /:word 路由之前
router.get('/celebration', (req, res) => {
  // 模拟庆祝检查响应
  res.json({
    shouldCelebrate: false,
    milestone: null,
    stats: null
  });
});

router.get('/milestone', (req, res) => {
  // 模拟里程碑信息
  res.json({
    count: 10,
    remaining: 5,
    progress: 0.67
  });
});

router.get('/milestones', (req, res) => {
  // 模拟已达成里程碑
  res.json([]);
});

// 单词查询路由 - 必须在最后，避免冲突
router.get('/:word', getWord);

router.options('/:word/audio', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range, Accept-Ranges');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.status(200).end();
});

// Authenticated routes below (example)
// router.post('/', authMiddleware, validateWord, saveUserWord);

export default router; 