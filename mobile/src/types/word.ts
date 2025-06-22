export interface IMeaning {
  partOfSpeech: string;
  definitionCn?: string;
  example?: string;
  exampleCn?: string;
}

export interface IWord {
  _id: string;
  word: string;
  pronunciation?: string;
  audioUrl?: string;
  meanings: IMeaning[];
  difficulty: number;
  queryCount: number;
  lastQueried: string;
  searchTerms: string[];
  createdAt: string;
  updatedAt: string;
  spellingSuggestions?: string[];
}

export interface StudySession {
  date: string;
  wordsStudied: number;
  correctAnswers: number;
  totalAnswers: number;
}

export interface WordSearchResult {
  word: string;
  translations: string[];
  frequency?: number;
}

// 云端词库统计
export interface CloudWordStats {
  totalWords: number;
  recentWords: number;
  popularWords: IWord[];
  userContributions: number;
}

// 同步状态
export interface SyncStatus {
  inProgress: boolean;
  lastSyncTime: number;
  nextSyncTime: number;
  pendingUploads: number;
  pendingDownloads: number;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 用户相关类型
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface UserStats {
  streak: number;
  totalDays: number;
  totalWords: number;
  knownWords: number;
  accuracy: number;
} 