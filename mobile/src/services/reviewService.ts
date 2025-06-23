import { IWord } from '@/types/word';
import { wordService } from './wordService';
import { apiClient } from './apiClient';

// 复习记录类型
interface ReviewRecord {
  wordId: string;
  remembered: boolean;
  timestamp: Date;
  sessionId?: string;
}

// 学习会话类型
interface StudySession {
  id: string;
  startTime: Date;
  endTime?: Date;
  totalWords: number;
  correctWords: number;
  accuracy: number;
}

class ReviewService {
  private reviewRecords: ReviewRecord[] = [];
  private currentSession: StudySession | null = null;

  /**
   * 获取今天的复习单词列表
   */
  async getTodayReviewWords(): Promise<IWord[]> {
    try {
      const allWords = await wordService.getAllWords();
      // 根据复习算法选择需要复习的单词
      const reviewWords = allWords.filter(word => {
        // 简单的复习算法：如果单词没有复习记录或最后复习时间超过1天，则需要复习
        const lastReview = this.reviewRecords
          .filter(record => record.wordId === word._id)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        
        if (!lastReview) return true; // 从未复习过
        
        const daysSinceLastReview = (Date.now() - new Date(lastReview.timestamp).getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceLastReview >= 1; // 超过1天需要复习
      });
      
      return reviewWords.slice(0, 10); // 限制每天复习10个单词
    } catch (error) {
      console.error('Get today review words error:', error);
      return [];
    }
  }

  /**
   * 记录单词复习结果
   */
  async recordWordReview(wordId: string, remembered: boolean): Promise<void> {
    try {
      const record: ReviewRecord = {
        wordId,
        remembered,
        timestamp: new Date(),
        sessionId: this.currentSession?.id,
      };
      
      this.reviewRecords.push(record);
      
      // 更新单词的学习进度
      await wordService.updateWordProgress(wordId, remembered);
      
      // 如果当前有活跃会话，更新会话统计
      if (this.currentSession) {
        this.currentSession.totalWords++;
        if (remembered) {
          this.currentSession.correctWords++;
        }
        this.currentSession.accuracy = (this.currentSession.correctWords / this.currentSession.totalWords) * 100;
      }
      
      console.log(`📝 Recorded review: ${wordId}, remembered: ${remembered}`);
    } catch (error) {
      console.error('Record word review error:', error);
    }
  }

  /**
   * 开始新的学习会话
   */
  async startStudySession(): Promise<string> {
    const sessionId = `session_${Date.now()}`;
    this.currentSession = {
      id: sessionId,
      startTime: new Date(),
      totalWords: 0,
      correctWords: 0,
      accuracy: 0,
    };
    
    console.log(`🎯 Started new study session: ${sessionId}`);
    return sessionId;
  }

  /**
   * 结束当前学习会话
   */
  async endStudySession(): Promise<StudySession | null> {
    if (!this.currentSession) return null;
    
    this.currentSession.endTime = new Date();
    const session = { ...this.currentSession };
    
    // 保存会话记录
    await this.saveStudySession(session);
    
    this.currentSession = null;
    console.log(`✅ Ended study session: ${session.id}, accuracy: ${session.accuracy.toFixed(1)}%`);
    
    return session;
  }

  /**
   * 保存学习会话到后端
   */
  private async saveStudySession(session: StudySession): Promise<void> {
    try {
      await apiClient.post('/words/sessions', session);
    } catch (error) {
      console.error('Save study session error:', error);
    }
  }

  /**
   * 获取学习统计
   */
  async getStudyStats(): Promise<{
    totalReviews: number;
    correctReviews: number;
    accuracy: number;
    todayReviews: number;
    streak: number;
    totalSessions: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayRecords = this.reviewRecords.filter(
      record => new Date(record.timestamp) >= today
    );
    
    const totalReviews = this.reviewRecords.length;
    const correctReviews = this.reviewRecords.filter(r => r.remembered).length;
    const accuracy = totalReviews > 0 ? (correctReviews / totalReviews) * 100 : 0;
    
    // 计算连续学习天数
    const streak = this.calculateStreak();
    
    return {
      totalReviews,
      correctReviews,
      accuracy: Math.round(accuracy),
      todayReviews: todayRecords.length,
      streak,
      totalSessions: 0, // TODO: 从后端获取
    };
  }

  /**
   * 计算连续学习天数
   */
  private calculateStreak(): number {
    if (this.reviewRecords.length === 0) return 0;
    
    const dates = [...new Set(
      this.reviewRecords.map(r => 
        new Date(r.timestamp).toDateString()
      )
    )].sort();
    
    let streak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    
    // 从今天开始往前计算
    for (let i = dates.length - 1; i >= 0; i--) {
      const currentDate = dates[i];
      const expectedDate = new Date(Date.now() - streak * 24 * 60 * 60 * 1000).toDateString();
      
      if (currentDate === expectedDate) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  /**
   * 获取今天已复习的单词数
   */
  async getTodayReviewCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.reviewRecords.filter(
      record => new Date(record.timestamp) >= today
    ).length;
  }

  /**
   * 检查是否需要显示复习引导
   */
  async checkReviewGuide(): Promise<{ shouldShow: boolean; [key: string]: any }> {
    // 如果是第一次使用，显示引导
    if (this.reviewRecords.length === 0) {
      return { shouldShow: true, type: 'first_time' };
    }
    
    // 如果今天还没有复习，提醒用户
    const todayCount = await this.getTodayReviewCount();
    if (todayCount === 0) {
      return { shouldShow: true, type: 'daily_reminder' };
    }
    
    return { shouldShow: false };
  }

  /**
   * 获取复习历史
   */
  async getReviewHistory(): Promise<ReviewRecord[]> {
    return [...this.reviewRecords].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * 清除所有复习记录（用于测试）
   */
  async clearAllRecords(): Promise<void> {
    this.reviewRecords = [];
    this.currentSession = null;
    console.log('🗑️ Cleared all review records');
  }
}

export const reviewService = new ReviewService(); 