import { IWord, WordSearchResult, StudySession } from '../types/word';
import { apiClient } from './apiClient';

class WordService {
  // 获取单词完整数据
  async fetchWordFullData(word: string): Promise<IWord | null> {
    try {
      console.log(`🔍 Fetching word data for: "${word}"`);
      const wordData = await apiClient.get<IWord>(`/words/${word}`);
      return wordData;
    } catch (error) {
      console.error('❌ Fetch word data error:', error);
      return null;
    }
  }

  // 搜索单词建议
  async searchWords(query: string): Promise<WordSearchResult[]> {
    try {
      if (!query) return [];
      console.log(`Mock searching for: ${query}`);
      const allWords = await this.getAllWords();
      
      // 关键修复：在使用 allWords 之前，先确保它是一个数组
      if (!Array.isArray(allWords)) {
        console.error('searchWords received non-array:', allWords);
        return [];
      }

      const filtered = allWords
        .filter(
          w =>
            (w.word && w.word.toLowerCase().startsWith(query.toLowerCase())) ||
            (w.meanings && w.meanings.some(m => m.definitionCn && m.definitionCn.includes(query)))
        )
        .map(w => ({
          word: w.word,
          translations: w.meanings?.map(m => m.definitionCn).filter((t): t is string => Boolean(t)) || [], // Ensure only strings
          frequency: Math.floor(Math.random() * 100),
        }));
        
      return filtered.slice(0, 5);
    } catch (error) {
      console.error('Mock search error:', error);
      return [];
    }
  }

  // 获取用户所有单词
  async getAllWords(): Promise<IWord[]> {
    try {
      // 始终先从本地获取
      const localWords = await apiClient.getAllWords();
      if (localWords && localWords.length > 0) {
        return localWords;
      }
      // 本地没有，再从API获取
      const apiWords = await this.getAllWordsFromApi();
      return apiWords || []; // 再次确保返回数组
    } catch (error) {
      console.error('Error in getAllWords:', error);
      return [];
    }
  }

  async getAllWordsFromApi(): Promise<IWord[]> {
    try {
      const words = await apiClient.get<IWord[]>('/words/user');
      console.log(`📚 Retrieved ${words?.length || 0} words from API`);
      // API可能返回null，确保返回数组
      return words || [];
    } catch (error) {
      console.error('API get all words error:', error);
      return [];
    }
  }

  // 根据ID获取单词
  async getWordById(id: string): Promise<IWord | null> {
    try {
      const word = await apiClient.get<IWord>(`/words/id/${id}`);
      return word;
    } catch (error) {
      console.error('Get word by ID error:', error);
      return null;
    }
  }

  // 获取需要复习的单词
  async getReviewWords(): Promise<IWord[]> {
    try {
      const words = await apiClient.get<IWord[]>('/words/review');
      return words || [];
    } catch (error) {
      console.error('Get review words error:', error);
      return [];
    }
  }

  // 更新单词学习进度
  async updateWordProgress(id: string, correct: boolean): Promise<void> {
    try {
      await apiClient.post('/words/progress', {
        wordId: id,
        correct,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Update word progress error:', error);
    }
  }

  // 保存单词到用户词库
  async saveWord(word: IWord): Promise<IWord> {
    try {
      console.log(`💾 WordService: Starting to save word: ${word.word}`);
      console.log(`💾 WordService: Word data:`, JSON.stringify(word, null, 2));
      
      // 验证单词数据
      if (!word || !word.word) {
        throw new Error('Invalid word data: word is required');
      }

      const savedWord = await apiClient.post<IWord>('/words', word);
      console.log(`✅ WordService: Word saved successfully: ${word.word}`);
      console.log(`✅ WordService: Saved word response:`, JSON.stringify(savedWord, null, 2));
      return savedWord;
    } catch (error) {
      console.error('💾 WordService: Save word error:', error);
      console.error('💾 WordService: Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      throw error;
    }
  }

  // 删除单词
  async deleteWord(idOrWord: string): Promise<void> {
    try {
      // 优先尝试用_id删除
      if (/^[a-fA-F0-9]{24}$/.test(idOrWord)) {
        await apiClient.delete(`/words/${idOrWord}`);
        return;
      }
      // 如果不是合法ObjectId，尝试用单词字符串删除
      await apiClient.delete(`/words/word/${encodeURIComponent(idOrWord)}`);
      console.log(`🗑️ Word deleted by word: ${idOrWord}`);
    } catch (error) {
      console.error('Delete word error:', error);
      throw error;
    }
  }

  // 获取学习统计
  async getStudyStats(): Promise<{
    totalWords: number;
    knownWords: number;
    reviewWords: number;
    accuracy: number;
  }> {
    try {
      // 获取所有单词
      const allWords = await this.getAllWords();
      const totalWords = allWords.length;
      
      // 获取复习统计
      const { reviewService } = await import('./reviewService');
      const reviewStats = await reviewService.getStudyStats();
      
      // 计算已掌握的单词（复习准确率超过80%的单词）
      const knownWords = allWords.filter(word => {
        // 这里可以根据单词的学习进度来判断是否已掌握
        // 暂时使用简单的逻辑：如果单词被正确复习过，就算已掌握
        return true; // TODO: 实现更复杂的掌握度算法
      }).length;
      
      // 获取需要复习的单词数量
      const reviewWords = await reviewService.getTodayReviewWords();
      
      return {
        totalWords,
        knownWords: Math.min(knownWords, totalWords),
        reviewWords: reviewWords.length,
        accuracy: reviewStats.accuracy,
      };
    } catch (error) {
      console.error('Get study stats error:', error);
      return {
        totalWords: 0,
        knownWords: 0,
        reviewWords: 0,
        accuracy: 0,
      };
    }
  }

  // 获取学习会话记录
  async getStudySessions(): Promise<StudySession[]> {
    try {
      const sessions = await apiClient.get<StudySession[]>('/words/sessions');
      return sessions || [];
    } catch (error) {
      console.error('Get study sessions error:', error);
      return [];
    }
  }

  // 检查并触发庆祝
  async checkAndTriggerCelebration(): Promise<{
    shouldCelebrate: boolean;
    milestone?: any;
    stats?: any;
  }> {
    try {
      const result = await apiClient.get<{
        shouldCelebrate: boolean;
        milestone?: any;
        stats?: any;
      }>('/words/celebration');
      return result || { shouldCelebrate: false };
    } catch (error) {
      console.error('Check celebration error:', error);
      return { shouldCelebrate: false };
    }
  }

  // 获取下一个里程碑信息
  async getNextMilestoneInfo(): Promise<{
    count: number;
    remaining: number;
    progress: number;
  } | null> {
    try {
      const milestone = await apiClient.get<{
        count: number;
        remaining: number;
        progress: number;
      }>('/words/milestone');
      return milestone;
    } catch (error) {
      console.error('Get milestone error:', error);
      return null;
    }
  }

  // 获取已达成里程碑
  async getAchievedMilestones(): Promise<any[]> {
    try {
      const milestones = await apiClient.get<any[]>('/words/milestones');
      return milestones || [];
    } catch (error) {
      console.error('Get milestones error:', error);
      return [];
    }
  }

  /**
   * 获取缓存信息
   */
  async getCacheInfo(): Promise<{ wordCount: number; totalSize: string }> {
    console.warn('mock: getCacheInfo');
    const allWords = await this.getAllWords();
    const sizeInBytes = JSON.stringify(allWords).length;
    const sizeInKB = (sizeInBytes / 1024).toFixed(1);
    return {
      wordCount: allWords.length,
      totalSize: `${sizeInKB} KB`,
    };
  }

  /**
   * 清除所有本地数据
   */
  async clearAllData(): Promise<void> {
    console.warn('mock: clearAllData');
    await apiClient.clear(); // Assuming apiClient has a clear method
  }
}

// 创建单例实例
export const wordService = new WordService();
export default wordService; 