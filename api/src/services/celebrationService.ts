import AsyncStorage from '@react-native-async-storage/async-storage';

interface MilestoneData {
  count: number;
  title: string;
  description: string;
  icon: 'trophy' | 'star' | 'book' | 'target';
  color: string;
  isSpecial?: boolean;
}

interface CelebrationStats {
  totalWords: number;
  improvement: number;
  streak: number;
  lastCelebration: number;
  celebrationHistory: number[];
}

class CelebrationService {
  private readonly CELEBRATION_KEY = 'celebration_data';
  private readonly MILESTONE_INTERVALS = [10, 20, 30, 40, 50, 75, 100, 150, 200, 300, 500, 750, 1000];

  // 检查是否应该触发庆祝
  async shouldCelebrate(currentWordCount: number): Promise<MilestoneData | null> {
    try {
      const celebrationData = await this.getCelebrationData();
      
      // 找到当前应该庆祝的里程碑
      const nextMilestone = this.MILESTONE_INTERVALS.find(milestone => 
        currentWordCount >= milestone && !celebrationData.celebrationHistory.includes(milestone)
      );

      if (nextMilestone) {
        return this.getMilestoneData(nextMilestone);
      }

      return null;
    } catch (error) {
      console.error('Check celebration error:', error);
      return null;
    }
  }

  // 获取里程碑数据
  private getMilestoneData(count: number): MilestoneData {
    const milestones: Record<number, MilestoneData> = {
      10: {
        count,
        title: '词汇新手',
        description: '开启词汇收集之旅',
        icon: 'book',
        color: '#4ECDC4',
      },
      20: {
        count,
        title: '学习达人',
        description: '词汇积累初见成效',
        icon: 'target',
        color: '#45B7D1',
      },
      30: {
        count,
        title: '词汇收藏家',
        description: '持续学习，收获颇丰',
        icon: 'star',
        color: '#96CEB4',
      },
      50: {
        count,
        title: '词汇专家',
        description: '半百词汇，实力见证',
        icon: 'trophy',
        color: '#FFEAA7',
        isSpecial: true,
      },
      75: {
        count,
        title: '学习精英',
        description: '词汇量稳步提升',
        icon: 'star',
        color: '#FD79A8',
      },
      100: {
        count,
        title: '百词大师',
        description: '百词里程碑达成！',
        icon: 'trophy',
        color: '#FF7675',
        isSpecial: true,
      },
      150: {
        count,
        title: '词汇达人',
        description: '词汇储备日渐丰富',
        icon: 'book',
        color: '#A29BFE',
      },
      200: {
        count,
        title: '学习标兵',
        description: '两百词汇，厚积薄发',
        icon: 'trophy',
        color: '#6C5CE7',
        isSpecial: true,
      },
      300: {
        count,
        title: '词汇精英',
        description: '三百词汇，出类拔萃',
        icon: 'star',
        color: '#00B894',
      },
      500: {
        count,
        title: '词汇大师',
        description: '五百词汇，登峰造极',
        icon: 'trophy',
        color: '#E17055',
        isSpecial: true,
      },
      750: {
        count,
        title: '学习传奇',
        description: '词汇量令人敬佩',
        icon: 'star',
        color: '#00CEC9',
      },
      1000: {
        count,
        title: '千词传说',
        description: '千词成就，传奇诞生！',
        icon: 'trophy',
        color: '#FF6B6B',
        isSpecial: true,
      },
    };

    return milestones[count] || {
      count,
      title: '词汇大神',
      description: '超越极限的词汇收藏家',
      icon: 'trophy',
      color: '#FF6B6B',
      isSpecial: true,
    };
  }

  // 记录庆祝
  async recordCelebration(milestone: number, totalWords: number): Promise<void> {
    try {
      const celebrationData = await this.getCelebrationData();
      
      celebrationData.celebrationHistory.push(milestone);
      celebrationData.lastCelebration = Date.now();
      celebrationData.totalWords = totalWords;
      
      await AsyncStorage.setItem(this.CELEBRATION_KEY, JSON.stringify(celebrationData));
    } catch (error) {
      console.error('Record celebration error:', error);
    }
  }

  // 获取庆祝统计数据
  async getCelebrationStats(currentWordCount: number): Promise<{
    totalWords: number;
    improvement: number;
    streak: number;
  }> {
    try {
      const celebrationData = await this.getCelebrationData();
      const lastWeekWords = await this.getWordsAddedInLastWeek();
      const streak = await this.getLearningStreak();
      
      const improvement = celebrationData.totalWords > 0 
        ? Math.round(((currentWordCount - celebrationData.totalWords) / celebrationData.totalWords) * 100)
        : 100;

      return {
        totalWords: currentWordCount,
        improvement: Math.max(improvement, 0),
        streak,
      };
    } catch (error) {
      console.error('Get celebration stats error:', error);
      return {
        totalWords: currentWordCount,
        improvement: 0,
        streak: 0,
      };
    }
  }

  // 获取庆祝数据
  private async getCelebrationData(): Promise<CelebrationStats> {
    try {
      const data = await AsyncStorage.getItem(this.CELEBRATION_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Get celebration data error:', error);
    }

    return {
      totalWords: 0,
      improvement: 0,
      streak: 0,
      lastCelebration: 0,
      celebrationHistory: [],
    };
  }

  // 获取最近一周新增单词数
  private async getWordsAddedInLastWeek(): Promise<number> {
    // 这里应该从实际的单词数据中计算
    // 暂时返回模拟数据
    return Math.floor(Math.random() * 20) + 5;
  }

  // 获取学习连续天数
  private async getLearningStreak(): Promise<number> {
    // 这里应该从实际的学习记录中计算
    // 暂时返回模拟数据
    return Math.floor(Math.random() * 30) + 1;
  }

  // 重置庆祝数据（用于测试）
  async resetCelebrationData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.CELEBRATION_KEY);
    } catch (error) {
      console.error('Reset celebration data error:', error);
    }
  }

  // 获取下一个里程碑
  getNextMilestone(currentCount: number): { count: number; remaining: number } | null {
    const nextMilestone = this.MILESTONE_INTERVALS.find(milestone => milestone > currentCount);
    
    if (nextMilestone) {
      return {
        count: nextMilestone,
        remaining: nextMilestone - currentCount,
      };
    }

    return null;
  }

  // 获取所有已达成的里程碑
  async getAchievedMilestones(): Promise<MilestoneData[]> {
    try {
      const celebrationData = await this.getCelebrationData();
      return celebrationData.celebrationHistory.map(count => this.getMilestoneData(count));
    } catch (error) {
      console.error('Get achieved milestones error:', error);
      return [];
    }
  }
}

export const celebrationService = new CelebrationService();