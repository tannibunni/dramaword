import { Schema, model } from 'mongoose';
import { IWordDocument } from '../types/word';

const meaningSchema = new Schema({
  partOfSpeech: { type: String, required: true },
  definitionCn: String,
  example: String,
  exampleCn: String
}, { _id: false });

const progressSchema = new Schema({
  correctCount: { type: Number, default: 0 },
  incorrectCount: { type: Number, default: 0 },
  lastReviewed: Date,
  nextReviewDate: Date,
  masteryLevel: { type: Number, default: 0, min: 0, max: 5 }, // 0-5, 5表示完全掌握
}, { _id: false });

const wordSchema = new Schema<IWordDocument>({
  word: { type: String, required: true, unique: true, index: true },
  pronunciation: String,
  audioUrl: String,
  meanings: [meaningSchema],
  difficulty: { type: Number, default: 1 },
  queryCount: { type: Number, default: 0 },
  lastQueried: { type: Date, default: Date.now },
  searchTerms: [{ type: String }],
  progress: progressSchema, // 学习进度
}, { timestamps: true });

export const Word = model<IWordDocument>('Word', wordSchema);
export default Word; 