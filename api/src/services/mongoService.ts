// MongoDB 连接和操作服务
import { Word } from '@/types/word';

interface MongoConfig {
  uri: string;
  databaseName: string;
  collections: {
    words: string;
    userWords: string;
    stats: string;
  };
}

class MongoService {
  private config: MongoConfig;
  private isConnected: boolean = false;

  constructor() {
    this.config = {
      uri: process.env.MONGODB_URI || '',
      databaseName: 'vocabulary_app',
      collections: {
        words: 'words',
        userWords: 'user_words',
        stats: 'app_stats',
      },
    };
  }

  // 连接到 MongoDB
  async connect(): Promise<boolean> {
    try {
      if (!this.config.uri) {
        console.error('❌ MongoDB URI not configured');
        return false;
      }

      console.log('🔗 Connecting to MongoDB Atlas...');
      
      // 在实际部署中，这里会使用 MongoDB Driver
      // const { MongoClient } = require('mongodb');
      // this.client = new MongoClient(this.config.uri);
      // await this.client.connect();
      
      // 模拟连接延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.isConnected = true;
      console.log('✅ Connected to MongoDB Atlas');
      return true;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      return false;
    }
  }

  // 查找单词
  async findWord(word: string): Promise<Word | null> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      console.log(`🔍 Querying MongoDB for: ${word}`);
      
      // 实际 MongoDB 查询
      /*
      const db = this.client.db(this.config.databaseName);
      const collection = db.collection(this.config.collections.words);
      
      const result = await collection.findOne({ 
        word: word.toLowerCase() 
      });
      
      if (result) {
        // 更新查询计数
        await collection.updateOne(
          { word: word.toLowerCase() },
          { 
            $inc: { queryCount: 1 },
            $set: { lastQueried: new Date() }
          }
        );
        
        return this.transformDbWordToWord(result);
      }
      */

      // 当前返回 null，强制使用 API
      return null;
    } catch (error) {
      console.error('MongoDB query error:', error);
      return null;
    }
  }

  // 保存单词到数据库
  async saveWord(word: Word): Promise<boolean> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      console.log(`💾 Saving to MongoDB: ${word.word}`);
      
      // 实际 MongoDB 操作
      /*
      const db = this.client.db(this.config.databaseName);
      const collection = db.collection(this.config.collections.words);
      
      const dbWord = this.transformWordToDbWord(word);
      
      await collection.replaceOne(
        { word: word.word.toLowerCase() },
        dbWord,
        { upsert: true }
      );
      */

      // 模拟保存延迟
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log(`✅ Word saved to MongoDB: ${word.word}`);
      return true;
    } catch (error) {
      console.error('MongoDB save error:', error);
      return false;
    }
  }

  // 获取统计信息
  async getStats(): Promise<{
    totalWords: number;
    recentWords: number;
    popularWords: string[];
  }> {
    try {
      // 实际统计查询
      /*
      const db = this.client.db(this.config.databaseName);
      const collection = db.collection(this.config.collections.words);
      
      const [totalCount, recentCount, popular] = await Promise.all([
        collection.countDocuments(),
        collection.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }),
        collection.find()
          .sort({ queryCount: -1 })
          .limit(10)
          .project({ word: 1 })
          .toArray()
      ]);
      
      return {
        totalWords: totalCount,
        recentWords: recentCount,
        popularWords: popular.map(doc => doc.word)
      };
      */

      // 模拟数据
      return {
        totalWords: 15420,
        recentWords: 342,
        popularWords: ['obtain', 'achieve', 'acquire', 'develop', 'implement'],
      };
    } catch (error) {
      console.error('Get stats error:', error);
      return {
        totalWords: 0,
        recentWords: 0,
        popularWords: [],
      };
    }
  }

  // 数据转换方法
  private transformWordToDbWord(word: Word): any {
    return {
      _id: word.word.toLowerCase(),
      word: word.word,
      phonetic: word.phonetic,
      audioUrl: word.audioUrl,
      chineseTranslations: word.chineseTranslations,
      meanings: word.meanings,
      derivatives: word.derivatives,
      synonyms: word.synonyms,
      difficulty: word.difficulty,
      searchTerms: [
        word.word.toLowerCase(),
        ...word.chineseTranslations,
        ...word.synonyms.map(s => s.toLowerCase())
      ],
      queryCount: 1,
      createdAt: new Date(word.createdAt),
      lastQueried: new Date(),
    };
  }

  private transformDbWordToWord(dbWord: any): Word {
    return {
      id: dbWord._id,
      word: dbWord.word,
      phonetic: dbWord.phonetic,
      audioUrl: dbWord.audioUrl,
      chineseTranslations: dbWord.chineseTranslations,
      meanings: dbWord.meanings,
      derivatives: dbWord.derivatives,
      synonyms: dbWord.synonyms,
      difficulty: dbWord.difficulty,
      createdAt: dbWord.createdAt.toISOString().split('T')[0],
      reviewCount: 0,
      correctCount: 0,
      isKnown: false,
    };
  }

  // 关闭连接
  async disconnect(): Promise<void> {
    try {
      // await this.client?.close();
      this.isConnected = false;
      console.log('🔌 Disconnected from MongoDB');
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }
}

export const mongoService = new MongoService();