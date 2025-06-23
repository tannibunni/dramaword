import { Document } from 'mongoose';

export interface IMeaning {
  partOfSpeech: string;
  definitionCn?: string;
  example?: string;
  exampleCn?: string;
}

export interface IWordProgress {
  correctCount: number;
  incorrectCount: number;
  lastReviewed?: Date;
  nextReviewDate?: Date;
  masteryLevel: number; // 0-5, 5表示完全掌握
}

export interface IWord {
  _id?: string; // Changed to optional for unsaved words
  word: string;
  pronunciation?: string;
  audioUrl?: string;
  meanings: IMeaning[];
  difficulty: number;
  queryCount: number;
  lastQueried: Date;
  searchTerms: string[];
  progress?: IWordProgress; // 学习进度
  createdAt?: Date;
  updatedAt?: Date;
  spellingSuggestions?: string[]; // 拼写建议字段
}

// Mongoose document interface
export interface IWordDocument extends IWord, Document {
  _id: string; // Mongoose documents always have an _id
  createdAt: Date;
  updatedAt: Date;
}

// 添加缺失的类型定义
export type Word = IWord;
export type WordMeaning = IMeaning;

export interface WordSearchResult {
  word: string;
  meanings: IMeaning[];
  pronunciation?: string;
  audioUrl?: string;
}

export interface StudySession {
  date: string;
  wordsStudied: number;
  timeSpent: number;
}

export interface MilestoneData {
  type: string;
  count: number;
  achieved: boolean;
  progress: number;
} 