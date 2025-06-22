import express from 'express';
import { searchDrama, getUserDramas, saveDrama, updateDrama, deleteDrama } from '../controllers/dramaController';

const router = express.Router();

// 剧集相关路由
router.get('/search', searchDrama);           // 搜索剧集
router.get('/user', getUserDramas);           // 获取用户剧单
router.post('/', saveDrama);                  // 保存剧集到剧单
router.put('/:id', updateDrama);              // 更新剧集状态
router.delete('/:id', deleteDrama);           // 删除剧集

export default router; 