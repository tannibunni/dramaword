import AsyncStorage from '@react-native-async-storage/async-storage';
import { Word } from '@/types/word';
import { wordService } from './wordService';

interface ReviewSchedule {
  wordId: string;
  nextReviewDate: string;
  reviewCount: number;
  correctCount: number;
  difficulty: number; // 1-5, 动态调整
  lastReviewed: string;
}

interface ReviewSession {
  date: string;
  wordsReviewed: number;
  correctAnswers: number;
  accuracy: number;
}

interface ReviewGuide {
  shouldShow: boolean;
  type: 'first_milestone' | 'daily_reminder' | 'streak_bonus';
  title: string;
  message: string;
  wordCount: number;
  reviewCount: number;
  streak?: number;
}

class ReviewService {
  private readonly REVIEW_SCHEDULE_KEY = 'review_schedule';
  private readonly REVIEW_SESSIONS_KEY = 'review_sessions';
  private readonly REVIEW_GUIDE_KEY = 'review_guide_data';

  // 艾宾浩斯遗忘曲线间隔（天）
  private readonly REVIEW_INTERVALS = [1, 3, 7, 15, 30, 90];

  // 获取今日需要复习的单词
  async getTodayReviewWords(): Promise<Word[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const schedules = await this.getReviewSchedules();
      const allWords = await wordService.getAllWords();
      
      // 筛选今日需要复习的单词
      const todayReviewIds = schedules
        .filter(schedule => schedule.nextReviewDate <= today)
        .map(schedule => schedule.wordId);

      const reviewWords = allWords.filter(word => 
        todayReviewIds.includes(word.id)
      );

      console.log(`📅 Today's review: ${reviewWords.length} words`);
      return reviewWords.slice(0, 20); // 限制每日最多20个
    } catch (error) {
      console.error('Get today review words error:', error);
      return [];
    }
  }

  // 更新单词复习记录
  async updateWordReview(wordId: string, correct: boolean): Promise<void> {
    try {
      const schedules = await this.getReviewSchedules();
      const scheduleIndex = schedules.findIndex(s => s.wordId === wordId);
      
      if (scheduleIndex >= 0) {
        const schedule = schedules[scheduleIndex];
        schedule.reviewCount++;
        schedule.lastReviewed = new Date().toISOString().split('T')[0];
        
        if (correct) {
          schedule.correctCount++;
          // 正确回答，增加间隔
          const nextInterval = this.getNextInterval(schedule.reviewCount, schedule.difficulty);
          schedule.nextReviewDate = this.addDays(new Date(), nextInterval);
          
          // 降低难度（更容易）
          schedule.difficulty = Math.max(1, schedule.difficulty - 0.1);
        } else {
          // 错误回答，缩短间隔
          const nextInterval = Math.max(1, Math.floor(this.getNextInterval(schedule.reviewCount, schedule.difficulty) / 2));
          schedule.nextReviewDate = this.addDays(new Date(), nextInterval);
          
          // 增加难度（更困难）
          schedule.difficulty = Math.min(5, schedule.difficulty + 0.2);
        }
        
        schedules[scheduleIndex] = schedule;
      } else {
        // 新单词，创建复习计划
        const newSchedule: ReviewSchedule = {
          wordId,
          nextReviewDate: this.addDays(new Date(), correct ? 1 : 0),
          reviewCount: 1,
          correctCount: correct ? 1 : 0,
          difficulty: 3, // 默认中等难度
          lastReviewed: new Date().toISOString().split('T')[0],
        };
        schedules.push(newSchedule);
      }
      
      await this.saveReviewSchedules(schedules);
      
      // 更新单词本身的学习状态
      await wordService.updateWordProgress(wordId, correct);
    } catch (error) {
      console.error('Update word review error:', error);
    }
  }

  // 检查是否需要显示复习引导
  async checkReviewGuide(): Promise<ReviewGuide> {
    try {
      const allWords = await wordService.getAllWords();
      const wordCount = allWords.length;
      const reviewWords = await this.getTodayReviewWords();
      const reviewCount = reviewWords.length;
      const guideData = await this.getReviewGuideData();
      
      // 第一次达到10个单词
      if (wordCount >= 10 && !guideData.firstMilestoneShown) {
        await this.updateReviewGuideData({ firstMilestoneShown: true });
        return {
          shouldShow: true,
          type: 'first_milestone',
          title: '🎉 词汇新手达成！',
          message: '你现在已经有一个迷你词库啦，要不要来复习一下？',
          wordCount,
          reviewCount,
        };
      }
      
      // 每日复习提醒（有新增单词且有待复习）
      const today = new Date().toISOString().split('T')[0];
      if (reviewCount > 0 && guideData.lastDailyReminder !== today) {
        await this.updateReviewGuideData({ lastDailyReminder: today });
        return {
          shouldShow: true,
          type: 'daily_reminder',
          title: '📚 今日复习时间',
          message: '今天学了新词，花1分钟复习一下吧！',
          wordCount,
          reviewCount,
        };
      }
      
      // 连续学习奖励（连续3天以上）
      const streak = await this.getLearningStreak();
      if (streak >= 3 && reviewCount > 0 && !guideData.streakBonusShown) {
        await this.updateReviewGuideData({ streakBonusShown: true });
        return {
          shouldShow: true,
          type: 'streak_bonus',
          title: '🔥 学习达人！',
          message: '你太棒了！已经连续学习多天，来挑战一下记忆小测验？',
          wordCount,
          reviewCount,
          streak,
        };
      }

      return {
        shouldShow: false,
        type: 'daily_reminder',
        title: '',
        message: '',
        wordCount,
        reviewCount,
      };
    } catch (error) {
      console.error('Check review guide error:', error);
      return {
        shouldShow: false,
        type: 'daily_reminder',
        title: '',
        message: '',
        wordCount: 0,
        reviewCount: 0,
      };
    }
  }

  // 记录复习会话
  async recordReviewSession(correctAnswers: number, totalAnswers: number): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const sessions = await this.getReviewSessions();
      
      const todaySession: ReviewSession = {
        date: today,
        wordsReviewed: totalAnswers,
        correctAnswers,
        accuracy: totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0,
      };
      
      // 更新或添加今日会话
      const existingIndex = sessions.findIndex(s => s.date === today);
      if (existingIndex >= 0) {
        sessions[existingIndex] = todaySession;
      } else {
        sessions.push(todaySession);
      }
      
      // 只保留最近30天的记录
      const thirtyDaysAgo = this.addDays(new Date(), -30);
      const filteredSessions = sessions.filter(s => s.date >= thirtyDaysAgo);
      
      await AsyncStorage.setItem(this.REVIEW_SESSIONS_KEY, JSON.stringify(filteredSessions));
    } catch (error) {
      console.error('Record review session error:', error);
    }
  }

  // 获取今日复习数量
  async getTodayReviewCount(): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const sessions = await this.getReviewSessions();
      const todaySession = sessions.find(s => s.date === today);
      return todaySession?.wordsReviewed || 0;
    } catch (error) {
      console.error('Get today review count error:', error);
      return 0;
    }
  }

  // 获取学习连续天数
  async getLearningStreak(): Promise<number> {
    try {
      const sessions = await this.getReviewSessions();
      if (sessions.length === 0) return 0;
      
      // 按日期排序
      sessions.sort((a, b) => b.date.localeCompare(a.date));
      
      let streak = 0;
      let currentDate = new Date();
      
      for (const session of sessions) {
        const sessionDate = new Date(session.date);
        const daysDiff = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === streak) {
          streak++;
          currentDate = sessionDate;
        } else {
          break;
        }
      }
      
      return streak;
    } catch (error) {
      console.error('Get learning streak error:', error);
      return 0;
    }
  }

  // 私有方法
  private async getReviewSchedules(): Promise<ReviewSchedule[]> {
    try {
      const data = await AsyncStorage.getItem(this.REVIEW_SCHEDULE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Get review schedules error:', error);
      return [];
    }
  }

  private async saveReviewSchedules(schedules: ReviewSchedule[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.REVIEW_SCHEDULE_KEY, JSON.stringify(schedules));
    } catch (error) {
      console.error('Save review schedules error:', error);
    }
  }

  private async getReviewSessions(): Promise<ReviewSession[]> {
    try {
      const data = await AsyncStorage.getItem(this.REVIEW_SESSIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Get review sessions error:', error);
      return [];
    }
  }

  private async getReviewGuideData(): Promise<{
    firstMilestoneShown: boolean;
    lastDailyReminder: string;
    streakBonusShown: boolean;
  }> {
    try {
      const data = await AsyncStorage.getItem(this.REVIEW_GUIDE_KEY);
      return data ? JSON.parse(data) : {
        firstMilestoneShown: false,
        lastDailyReminder: '',
        streakBonusShown: false,
      };
    } catch (error) {
      console.error('Get review guide data error:', error);
      return {
        firstMilestoneShown: false,
        lastDailyReminder: '',
        streakBonusShown: false,
      };
    }
  }

  private async updateReviewGuideData(updates: Partial<{
    firstMilestoneShown: boolean;
    lastDailyReminder: string;
    streakBonusShown: boolean;
  }>): Promise<void> {
    try {
      const current = await this.getReviewGuideData();
      const updated = { ...current, ...updates };
      await AsyncStorage.setItem(this.REVIEW_GUIDE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Update review guide data error:', error);
    }
  }

  private getNextInterval(reviewCount: number, difficulty: number): number {
    const baseInterval = this.REVIEW_INTERVALS[Math.min(reviewCount - 1, this.REVIEW_INTERVALS.length - 1)];
    // 根据难度调整间隔
    const difficultyMultiplier = 6 - difficulty; // 难度越高，间隔越短
    return Math.max(1, Math.floor(baseInterval * (difficultyMultiplier / 3)));
  }

  private addDays(date: Date, days: number): string {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toISOString().split('T')[0];
  }

  // 重置复习数据（用于测试）
  async resetReviewData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.REVIEW_SCHEDULE_KEY,
        this.REVIEW_SESSIONS_KEY,
        this.REVIEW_GUIDE_KEY,
      ]);
    } catch (error) {
      console.error('Reset review data error:', error);
    }
  }
}

export const reviewService = new ReviewService();