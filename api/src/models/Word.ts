import mongoose, { Document, Schema } from 'mongoose';

export interface IWord extends Document {
  word: string;
  phonetic?: string;
  audioUrl?: string;
  chineseTranslations: string[];
  meanings: Array<{
    partOfSpeech: string;
    definition: string;
    definitionCn: string;
    exampleEn: string;
    exampleCn: string;
  }>;
  derivatives: string[];
  synonyms: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  queryCount: number;
  lastQueried?: Date;
  searchTerms: string[];
}

const WordSchema = new Schema<IWord>({
  word: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phonetic: {
    type: String,
    trim: true,
  },
  audioUrl: {
    type: String,
    trim: true,
  },
  chineseTranslations: [{
    type: String,
    trim: true,
  }],
  meanings: [{
    partOfSpeech: {
      type: String,
      required: true,
      trim: true,
    },
    definition: {
      type: String,
      required: true,
      trim: true,
    },
    definitionCn: {
      type: String,
      trim: true,
    },
    exampleEn: {
      type: String,
      trim: true,
      default: '',
    },
    exampleCn: {
      type: String,
      trim: true,
      default: '',
    },
  }],
  derivatives: [{
    type: String,
    trim: true,
  }],
  synonyms: [{
    type: String,
    trim: true,
  }],
  difficulty: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    default: 3,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: String,
    trim: true,
  },
  queryCount: {
    type: Number,
    default: 1,
  },
  lastQueried: {
    type: Date,
    default: Date.now,
  },
  searchTerms: [{
    type: String,
    lowercase: true,
    trim: true,
  }],
}, {
  timestamps: true,
});

// 索引
WordSchema.index({ searchTerms: 1 });
WordSchema.index({ difficulty: 1 });
WordSchema.index({ queryCount: -1 });
WordSchema.index({ lastQueried: -1 });

// 中间件：更新时自动更新updatedAt
WordSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 中间件：查询时增加查询计数
WordSchema.pre('findOne', function() {
  // Remove the problematic updateOne call that was causing the error
  // The query count will be updated elsewhere when needed
});

// 静态方法：搜索单词
WordSchema.statics.searchWords = async function(query: string, limit: number = 10) {
  const regex = new RegExp(query, 'i');
  return this.find({
    $or: [
      { word: regex },
      { searchTerms: regex },
      { chineseTranslations: regex },
    ]
  })
  .sort({ queryCount: -1, lastQueried: -1 })
  .limit(limit);
};

// 静态方法：获取热门单词
WordSchema.statics.getPopularWords = async function(limit: number = 10) {
  return this.find()
    .sort({ queryCount: -1 })
    .limit(limit)
    .select('word chineseTranslations difficulty');
};

// 静态方法：获取最近查询的单词
WordSchema.statics.getRecentWords = async function(limit: number = 10) {
  return this.find()
    .sort({ lastQueried: -1 })
    .limit(limit)
    .select('word chineseTranslations difficulty');
};

export const Word = mongoose.model<IWord>('Word', WordSchema);
export default Word; 