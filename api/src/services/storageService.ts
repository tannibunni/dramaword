import AsyncStorage from '@react-native-async-storage/async-storage';
import { Word } from '@/types/word';

class StorageService {
  private readonly WORDS_KEY = 'vocabulary_words';
  private readonly CACHE_EXPIRY_KEY = 'cache_expiry';
  private readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  // Local cache operations
  async getFromCache(word: string): Promise<Word | null> {
    try {
      const wordsData = await AsyncStorage.getItem(this.WORDS_KEY);
      if (!wordsData) return null;

      const words: Record<string, { word: Word; timestamp: number }> = JSON.parse(wordsData);
      const cached = words[word.toLowerCase()];

      if (!cached) return null;

      // Check if cache is expired
      const now = Date.now();
      if (now - cached.timestamp > this.CACHE_DURATION) {
        // Remove expired entry
        delete words[word.toLowerCase()];
        await AsyncStorage.setItem(this.WORDS_KEY, JSON.stringify(words));
        return null;
      }

      return cached.word;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }

  async saveToCache(word: Word): Promise<void> {
    try {
      const wordsData = await AsyncStorage.getItem(this.WORDS_KEY);
      const words: Record<string, { word: Word; timestamp: number }> = wordsData 
        ? JSON.parse(wordsData) 
        : {};

      words[word.word.toLowerCase()] = {
        word,
        timestamp: Date.now(),
      };

      await AsyncStorage.setItem(this.WORDS_KEY, JSON.stringify(words));
      console.log(`💾 Word saved to cache: ${word.word}`);
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  async getAllCachedWords(): Promise<Word[]> {
    try {
      const wordsData = await AsyncStorage.getItem(this.WORDS_KEY);
      if (!wordsData) return [];

      const words: Record<string, { word: Word; timestamp: number }> = JSON.parse(wordsData);
      return Object.values(words).map(item => item.word);
    } catch (error) {
      console.error('Get all cached words error:', error);
      return [];
    }
  }

  async updateWordInCache(updatedWord: Word): Promise<void> {
    try {
      const wordsData = await AsyncStorage.getItem(this.WORDS_KEY);
      if (!wordsData) return;

      const words: Record<string, { word: Word; timestamp: number }> = JSON.parse(wordsData);
      const existing = words[updatedWord.word.toLowerCase()];

      if (existing) {
        words[updatedWord.word.toLowerCase()] = {
          word: updatedWord,
          timestamp: existing.timestamp, // Keep original timestamp
        };
        await AsyncStorage.setItem(this.WORDS_KEY, JSON.stringify(words));
        console.log(`🔄 Word updated in cache: ${updatedWord.word}`);
      }
    } catch (error) {
      console.error('Update word in cache error:', error);
    }
  }

  async clearCache(): Promise<void> {
    try {
      console.log('🗑️ Clearing word cache...');
      
      // 清除单词缓存
      await AsyncStorage.removeItem(this.WORDS_KEY);
      
      // 清除其他相关缓存
      await AsyncStorage.removeItem(this.CACHE_EXPIRY_KEY);
      
      console.log('✅ Word cache cleared successfully');
    } catch (error) {
      console.error('Clear cache error:', error);
      throw error; // 重新抛出错误，让调用者知道清除失败
    }
  }

  // 获取缓存大小信息
  async getCacheInfo(): Promise<{
    wordCount: number;
    totalSize: string;
  }> {
    try {
      const wordsData = await AsyncStorage.getItem(this.WORDS_KEY);
      if (!wordsData) {
        return { wordCount: 0, totalSize: '0 KB' };
      }

      const words: Record<string, { word: Word; timestamp: number }> = JSON.parse(wordsData);
      const wordCount = Object.keys(words).length;
      const sizeInBytes = new Blob([wordsData]).size;
      const sizeInKB = (sizeInBytes / 1024).toFixed(2);

      return {
        wordCount,
        totalSize: `${sizeInKB} KB`,
      };
    } catch (error) {
      console.error('Get cache info error:', error);
      return { wordCount: 0, totalSize: '0 KB' };
    }
  }

  // Database simulation (in real app, this would be MongoDB operations)
  async saveToDatabase(word: Word): Promise<void> {
    // In a real implementation, this would save to MongoDB
    // For now, we'll use the cache as our "database"
    await this.saveToCache(word);
  }

  async getFromDatabase(word: string): Promise<Word | null> {
    // In a real implementation, this would query MongoDB
    // For now, we'll use the cache as our "database"
    return await this.getFromCache(word);
  }

  // 完全重置所有存储数据
  async resetAllData(): Promise<void> {
    try {
      console.log('🔄 Resetting all storage data...');
      
      // 获取所有 AsyncStorage 键
      const keys = await AsyncStorage.getAllKeys();
      
      // 过滤出与应用相关的键
      const appKeys = keys.filter(key => 
        key.startsWith('vocabulary_') || 
        key.startsWith('celebration_') ||
        key.startsWith('review_') ||
        key.includes('words') ||
        key.includes('cache')
      );
      
      if (appKeys.length > 0) {
        await AsyncStorage.multiRemove(appKeys);
        console.log(`✅ Removed ${appKeys.length} storage keys:`, appKeys);
      }
      
      console.log('✅ All storage data reset successfully');
    } catch (error) {
      console.error('Reset all data error:', error);
      throw error;
    }
  }
}

export const storageService = new StorageService();