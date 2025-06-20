import { Word, WordSearchResult } from '@/types/word';
import { apiService } from './apiService';
import { storageService } from './storageService';
import { mongoService } from './mongoService';
import { celebrationService } from './celebrationService';
import { reviewService } from './reviewService';
import axios from 'axios';

class WordService {
  // 主要功能：多层级单词查找
  async fetchWordFullData(word: string): Promise<Word | null> {
    const normalizedWord = word.toLowerCase().trim();
    
    try {
      console.log(`🔍 Starting word lookup for: "${normalizedWord}"`);
      
      // 1️⃣ 检查本地缓存
      console.log('1️⃣ Checking local cache...');
      const cached = await storageService.getFromCache(normalizedWord);
      if (cached) {
        console.log('✅ Found in cache');
        return cached;
      }

      // 2️⃣ 检查云端数据库
      console.log('2️⃣ Checking MongoDB Atlas...');
      const dbResult = await mongoService.findWord(normalizedWord);
      if (dbResult) {
        console.log('✅ Found in MongoDB');
        await storageService.saveToCache(dbResult);
        return dbResult;
      }

      // 3️⃣ 从外部 API 获取数据
      console.log('3️⃣ Fetching from external APIs...');
      
      // 并行调用 API 提高性能
      const [youdaoData, freeDictData] = await Promise.allSettled([
        apiService.fetchFromYoudao(normalizedWord),
        apiService.fetchFromFreeDict(normalizedWord),
      ]);

      const youdaoResult = youdaoData.status === 'fulfilled' ? youdaoData.value : undefined;
      const freeDictResult = freeDictData.status === 'fulfilled' ? freeDictData.value : undefined;

      console.log('📊 API Results:', {
        youdao: !!youdaoResult,
        freeDict: !!freeDictResult,
      });

      // 4️⃣ GPT 补全缺失数据
      console.log('4️⃣ Completing with GPT...');
      const gptData = await apiService.fetchFromGPT(normalizedWord, youdaoResult, freeDictResult);

      // 5️⃣ 合并所有数据源
      console.log('5️⃣ Merging data sources...');
      let finalWord: Word;

      if (youdaoResult || freeDictResult || gptData) {
        finalWord = apiService.mergeWordData(normalizedWord, youdaoResult, freeDictResult, gptData);
      } else {
        console.log('⚠️ All APIs failed, generating fallback...');
        finalWord = apiService.generateFallbackWord(normalizedWord);
      }

      // 6️⃣ 保存到数据库和缓存
      console.log('6️⃣ Saving to storage...');
      await Promise.all([
        mongoService.saveWord(finalWord),  // 保存到 MongoDB
        storageService.saveToCache(finalWord),  // 保存到本地缓存
      ]);

      console.log('✅ Word lookup completed successfully');
      return finalWord;

    } catch (error) {
      console.error('❌ Word lookup failed:', error);
      
      // 降级处理：尝试返回基本单词结构
      try {
        const fallbackWord = apiService.generateFallbackWord(normalizedWord);
        await storageService.saveToCache(fallbackWord);
        return fallbackWord;
      } catch (fallbackError) {
        console.error('❌ Fallback generation failed:', fallbackError);
        return null;
      }
    }
  }

  // 🎉 检查并触发庆祝
  async checkAndTriggerCelebration(): Promise<{
    shouldCelebrate: boolean;
    milestone?: any;
    stats?: any;
  }> {
    try {
      const allWords = await this.getAllWords();
      const currentCount = allWords.length;
      
      const milestone = await celebrationService.shouldCelebrate(currentCount);
      
      if (milestone) {
        const stats = await celebrationService.getCelebrationStats(currentCount);
        
        // 记录庆祝
        await celebrationService.recordCelebration(milestone.count, currentCount);
        
        console.log('🎉 Celebration triggered!', { milestone: milestone.count, total: currentCount });
        
        return {
          shouldCelebrate: true,
          milestone,
          stats,
        };
      }

      return { shouldCelebrate: false };
    } catch (error) {
      console.error('Check celebration error:', error);
      return { shouldCelebrate: false };
    }
  }

  // 搜索单词建议
  async searchWords(query: string): Promise<WordSearchResult[]> {
    try {
      const allWords = await storageService.getAllCachedWords();
      
      const results = allWords
        .filter(word => 
          word.word.toLowerCase().includes(query.toLowerCase()) ||
          word.chineseTranslations.some(trans => trans.includes(query))
        )
        .map(word => ({
          word: word.word,
          translations: word.chineseTranslations,
          frequency: Math.floor(Math.random() * 1000) + 1
        }));

      // 如果没有本地结果，建议查询新单词
      if (results.length === 0 && query.trim().length > 0) {
        return [
          { word: query.trim(), translations: ['点击查询'], frequency: 0 }
        ];
      }

      return results.slice(0, 5);
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  // 获取所有单词
  async getAllWords(): Promise<Word[]> {
    try {
      const words = await storageService.getAllCachedWords();
      console.log(`📚 Retrieved ${words.length} words from storage`);
      return words;
    } catch (error) {
      console.error('Get all words error:', error);
      return [];
    }
  }

  // 根据 ID 获取单词
  async getWordById(id: string): Promise<Word | undefined> {
    const allWords = await this.getAllWords();
    return allWords.find(word => word.id === id);
  }

  // 获取需要复习的单词
  async getReviewWords(): Promise<Word[]> {
    const allWords = await this.getAllWords();
    return allWords.filter(word => !word.isKnown || word.reviewCount < 5);
  }

  // 更新单词学习进度
  async updateWordProgress(id: string, correct: boolean): Promise<void> {
    try {
      const allWords = await storageService.getAllCachedWords();
      const word = allWords.find(w => w.id === id);
      
      if (word) {
        word.reviewCount++;
        if (correct) {
          word.correctCount++;
        }
        word.lastReviewed = new Date().toISOString().split('T')[0];
        
        // 如果正确回答 3+ 次，标记为已掌握
        if (word.correctCount >= 3 && word.reviewCount >= 3) {
          word.isKnown = true;
        }

        await storageService.updateWordInCache(word);
      }
    } catch (error) {
      console.error('Update word progress error:', error);
    }
  }

  // 获取学习统计
  async getStudyStats() {
    try {
      const allWords = await this.getAllWords();
      const totalWords = allWords.length;
      const knownWords = allWords.filter(w => w.isKnown).length;
      const reviewWords = allWords.filter(w => !w.isKnown || w.reviewCount < 5).length;
      
      return {
        totalWords,
        knownWords,
        reviewWords,
        accuracy: totalWords > 0 ? Math.round((knownWords / totalWords) * 100) : 0
      };
    } catch (error) {
      console.error('Get study stats error:', error);
      return {
        totalWords: 0,
        knownWords: 0,
        reviewWords: 0,
        accuracy: 0
      };
    }
  }

  // 获取下一个里程碑信息
  async getNextMilestoneInfo(): Promise<{ count: number; remaining: number; progress: number } | null> {
    try {
      const allWords = await this.getAllWords();
      const currentCount = allWords.length;
      const nextMilestone = celebrationService.getNextMilestone(currentCount);
      
      if (nextMilestone) {
        const progress = (currentCount / nextMilestone.count) * 100;
        return {
          ...nextMilestone,
          progress: Math.min(progress, 100),
        };
      }

      return null;
    } catch (error) {
      console.error('Get next milestone error:', error);
      return null;
    }
  }

  // 获取已达成的里程碑
  async getAchievedMilestones() {
    return await celebrationService.getAchievedMilestones();
  }

  // 获取缓存信息
  async getCacheInfo() {
    return await storageService.getCacheInfo();
  }

  // 清除所有数据（用于测试/重置）
  async clearAllData(): Promise<void> {
    try {
      console.log('🗑️ Starting complete data clear...');
      
      // 1. 清除单词缓存
      await storageService.resetAllData();
      
      // 2. 清除庆祝记录
      await celebrationService.resetCelebrationData();
      
      // 3. 清除复习数据
      await reviewService.resetReviewData();
      
      console.log('✅ All data cleared successfully');
    } catch (error) {
      console.error('❌ Clear all data failed:', error);
      throw error;
    }
  }
}

// 1. Free Dictionary API
export async function fetchFreeDictionary(word: string) {
  try {
    const res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    return res.data[0]; // 结构可根据实际API调整
  } catch (error) {
    return null; // 没查到返回 null
  }
}

// 2. 有道 API（mock实现）
export async function fetchYoudao(word: string) {
  // TODO: 替换为真实有道API调用
  return {
    phonetic: 'tɛl',
    chineseTranslations: ['告诉', '讲述'],
  };
}

// 3. GPT（mock实现）
export async function fetchGPT(word: string, youdao: any, freeDict: any) {
  // TODO: 替换为真实OpenAI调用
  return {
    examples: [
      { en: 'Tell me the truth.', cn: '告诉我真相。' }
    ],
    derivatives: ['telling', 'told'],
    synonyms: ['inform', 'say'],
  };
}

// 4. 合并数据
export function mergeWordData(word: string, youdao: any, freeDict: any, gpt: any) {
  return {
    word: word.toLowerCase(),
    phonetic: youdao?.phonetic || freeDict?.phonetic || '',
    audioUrl: freeDict?.phonetics?.[0]?.audio || '',
    chineseTranslations: youdao?.chineseTranslations || [],
    meanings: freeDict?.meanings || [],
    examples: gpt?.examples || [],
    derivatives: gpt?.derivatives || [],
    synonyms: gpt?.synonyms || [],
    difficulty: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    queryCount: 1,
    lastQueried: new Date(),
    searchTerms: [word.toLowerCase()],
  };
}

export const wordService = new WordService();