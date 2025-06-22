import { Schema, model } from 'mongoose';
import { IWordDocument } from '../types/word';

const meaningSchema = new Schema({
  partOfSpeech: { type: String, required: true },
  definitionCn: String,
  example: String,
  exampleCn: String
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
}, { timestamps: true });

export const Word = model<IWordDocument>('Word', wordSchema);
export default Word; 