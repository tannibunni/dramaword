import { Word } from '@/types/word';
import { wordService } from './wordService';

// 模拟的复习服务，用于前端开发
class ReviewService {
  /**
   * 获取今天的复习单词列表
   */
  async getTodayReviewWords(): Promise<Word[]> {
    console.warn('mock: getTodayReviewWords');
    // 模拟从所有单词中获取需要复习的
    const allWords = await wordService.getAllWords();
    return allWords.slice(0, 5); // 模拟返回5个单词
  }

  /**
   * 更新单词的复习状态
   */
  async updateWordReview(wordId: string, correct: boolean): Promise<void> {
    console.warn(`mock: updateWordReview for ${wordId}, correct: ${correct}`);
    // 在实际应用中，这里会更新单词的复习间隔等信息
    return Promise.resolve();
  }

  /**
   * 记录一次复习会话
   */
  async recordReviewSession(correctCount: number, totalCount: number): Promise<void> {
    console.warn(`mock: recordReviewSession, correct: ${correctCount}, total: ${totalCount}`);
    return Promise.resolve();
  }

  /**
   * 获取今天已复习的单词数
   */
  async getTodayReviewCount(): Promise<number> {
    console.warn('mock: getTodayReviewCount');
    return 0; // 模拟返回0
  }

  /**
   * 检查是否需要显示复习引导
   */
  async checkReviewGuide(): Promise<{ shouldShow: boolean; [key: string]: any }> {
    console.warn('mock: checkReviewGuide');
    // 模拟永不显示引导
    return { shouldShow: false };
  }
}

export const reviewService = new ReviewService(); 