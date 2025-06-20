export interface WordMeaning {
  partOfSpeech: string;
  definition: string;
  exampleEn: string;
  exampleCn: string;
}

export interface Word {
  id: string;
  word: string;
  phonetic?: string;
  audioUrl?: string;
  chineseTranslations: string[];
  meanings: WordMeaning[];
  derivatives: string[];
  synonyms: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  createdAt: string;
  lastReviewed?: string;
  reviewCount: number;
  correctCount: number;
  isKnown: boolean;
  
  // 云端同步相关字段
  cloudSynced?: boolean;
  lastSynced?: number;
  lastModified?: number;
  cloudId?: string;
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
  popularWords: Word[];
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