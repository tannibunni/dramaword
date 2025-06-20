import { create } from 'zustand';
import { Word, WordSearchResult } from '../types/word';
import { wordService } from '../services/wordService';

interface WordState {
  // 状态
  words: Word[];
  currentWord: Word | null;
  searchResults: WordSearchResult[];
  isLoading: boolean;
  error: string | null;
  
  // 统计
  stats: {
    totalWords: number;
    knownWords: number;
    reviewWords: number;
    accuracy: number;
  };
  
  // 操作
  fetchWord: (word: string) => Promise<Word | null>;
  searchWords: (query: string) => Promise<void>;
  loadUserWords: () => Promise<void>;
  saveWord: (word: Word) => Promise<void>;
  deleteWord: (id: string) => Promise<void>;
  updateWordProgress: (id: string, correct: boolean) => Promise<void>;
  loadStats: () => Promise<void>;
  clearError: () => void;
  setCurrentWord: (word: Word | null) => void;
}

export const useWordStore = create<WordState>((set, get) => ({
  // 初始状态
  words: [],
  currentWord: null,
  searchResults: [],
  isLoading: false,
  error: null,
  stats: {
    totalWords: 0,
    knownWords: 0,
    reviewWords: 0,
    accuracy: 0,
  },

  // 获取单词数据
  fetchWord: async (word: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const wordData = await wordService.fetchWordFullData(word);
      if (wordData) {
        set({ currentWord: wordData });
        return wordData;
      } else {
        set({ error: `未找到单词 "${word}" 的相关信息` });
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取单词数据失败';
      set({ error: errorMessage });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  // 搜索单词
  searchWords: async (query: string) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }

    try {
      const results = await wordService.searchWords(query);
      set({ searchResults: results });
    } catch (error) {
      console.error('Search words error:', error);
      set({ searchResults: [] });
    }
  },

  // 加载用户单词
  loadUserWords: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const words = await wordService.getAllWords();
      set({ words });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载单词失败';
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },

  // 保存单词
  saveWord: async (word: Word) => {
    try {
      await wordService.saveWord(word);
      
      // 更新本地状态
      const { words } = get();
      const existingIndex = words.findIndex(w => w.id === word.id);
      
      if (existingIndex >= 0) {
        // 更新现有单词
        const updatedWords = [...words];
        updatedWords[existingIndex] = word;
        set({ words: updatedWords });
      } else {
        // 添加新单词
        set({ words: [...words, word] });
      }
      
      // 更新统计
      get().loadStats();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '保存单词失败';
      set({ error: errorMessage });
      throw error;
    }
  },

  // 删除单词
  deleteWord: async (id: string) => {
    try {
      await wordService.deleteWord(id);
      
      // 更新本地状态
      const { words } = get();
      const filteredWords = words.filter(w => w.id !== id);
      set({ words: filteredWords });
      
      // 更新统计
      get().loadStats();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除单词失败';
      set({ error: errorMessage });
      throw error;
    }
  },

  // 更新单词进度
  updateWordProgress: async (id: string, correct: boolean) => {
    try {
      await wordService.updateWordProgress(id, correct);
      
      // 更新本地状态
      const { words } = get();
      const updatedWords = words.map(word => {
        if (word.id === id) {
          return {
            ...word,
            reviewCount: word.reviewCount + 1,
            correctCount: word.correctCount + (correct ? 1 : 0),
            lastReviewed: new Date().toISOString().split('T')[0],
            isKnown: (word.correctCount + (correct ? 1 : 0)) >= 3 && (word.reviewCount + 1) >= 3,
          };
        }
        return word;
      });
      
      set({ words: updatedWords });
      
      // 更新统计
      get().loadStats();
    } catch (error) {
      console.error('Update word progress error:', error);
    }
  },

  // 加载统计
  loadStats: async () => {
    try {
      const stats = await wordService.getStudyStats();
      set({ stats });
    } catch (error) {
      console.error('Load stats error:', error);
    }
  },

  // 清除错误
  clearError: () => {
    set({ error: null });
  },

  // 设置当前单词
  setCurrentWord: (word: Word | null) => {
    set({ currentWord: word });
  },
})); 