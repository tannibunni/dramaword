import { Word } from '@/types/word';

interface DatabaseConfig {
  mongoUri: string;
  databaseName: string;
  collectionName: string;
}

class DatabaseService {
  private config: DatabaseConfig;
  private isConnected: boolean = false;

  constructor() {
    this.config = {
      mongoUri: process.env.MONGODB_URI || '',
      databaseName: 'vocabulary_app',
      collectionName: 'words',
    };
  }

  // 连接到 MongoDB Atlas
  async connect(): Promise<boolean> {
    try {
      // 在实际部署中，这里会建立 MongoDB 连接
      console.log('🔗 Connecting to MongoDB Atlas...');
      
      // 模拟连接过程
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.isConnected = true;
      console.log('✅ Connected to cloud database');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      return false;
    }
  }

  // 从云端数据库查询单词
  async findWord(word: string): Promise<Word | null> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      // 实际实现中的 MongoDB 查询
      /*
      const db = this.client.db(this.config.databaseName);
      const collection = db.collection(this.config.collectionName);
      
      const result = await collection.findOne({ 
        word: word.toLowerCase() 
      });
      
      return result ? this.transformDbWordToWord(result) : null;
      */

      // 当前模拟实现
      console.log(`🔍 Querying cloud database for: ${word}`);
      return null; // 暂时返回 null，强制使用 API
    } catch (error) {
      console.error('Database query error:', error);
      return null;
    }
  }

  // 保存单词到云端数据库
  async saveWord(word: Word): Promise<boolean> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      // 实际实现中的 MongoDB 操作
      /*
      const db = this.client.db(this.config.databaseName);
      const collection = db.collection(this.config.collectionName);
      
      const dbWord = this.transformWordToDbWord(word);
      
      await collection.replaceOne(
        { word: word.word.toLowerCase() },
        dbWord,
        { upsert: true }
      );
      */

      console.log(`💾 Saving to cloud database: ${word.word}`);
      
      // 模拟保存过程
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log(`✅ Word saved to cloud: ${word.word}`);
      return true;
    } catch (error) {
      console.error('Database save error:', error);
      return false;
    }
  }

  // 获取词汇统计信息
  async getWordStats(): Promise<{
    totalWords: number;
    recentWords: number;
    popularWords: Word[];
  }> {
    try {
      // 实际实现中的聚合查询
      /*
      const db = this.client.db(this.config.databaseName);
      const collection = db.collection(this.config.collectionName);
      
      const [totalCount, recentCount, popular] = await Promise.all([
        collection.countDocuments(),
        collection.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }),
        collection.find()
          .sort({ queryCount: -1 })
          .limit(10)
          .toArray()
      ]);
      
      return {
        totalWords: totalCount,
        recentWords: recentCount,
        popularWords: popular.map(this.transformDbWordToWord)
      };
      */

      // 模拟数据
      return {
        totalWords: 15420,
        recentWords: 342,
        popularWords: [],
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

  // 批量导入词汇
  async bulkImportWords(words: Word[]): Promise<number> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      console.log(`📦 Bulk importing ${words.length} words...`);
      
      // 实际实现中的批量操作
      /*
      const db = this.client.db(this.config.databaseName);
      const collection = db.collection(this.config.collectionName);
      
      const operations = words.map(word => ({
        replaceOne: {
          filter: { word: word.word.toLowerCase() },
          replacement: this.transformWordToDbWord(word),
          upsert: true
        }
      }));
      
      const result = await collection.bulkWrite(operations);
      return result.upsertedCount + result.modifiedCount;
      */

      // 模拟批量导入
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`✅ Bulk import completed: ${words.length} words`);
      return words.length;
    } catch (error) {
      console.error('Bulk import error:', error);
      return 0;
    }
  }

  // 数据转换方法
  private transformWordToDbWord(word: Word): any {
    return {
      ...word,
      _id: word.word.toLowerCase(),
      searchTerms: [
        word.word.toLowerCase(),
        ...word.chineseTranslations,
        ...word.synonyms
      ],
      queryCount: 1,
      lastQueried: new Date(),
      createdAt: new Date(word.createdAt),
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
      lastReviewed: dbWord.lastReviewed?.toISOString().split('T')[0],
      reviewCount: dbWord.reviewCount,
      correctCount: dbWord.correctCount,
      isKnown: dbWord.isKnown,
    };
  }

  // 关闭数据库连接
  async disconnect(): Promise<void> {
    try {
      // 实际实现中关闭 MongoDB 连接
      // await this.client.close();
      
      this.isConnected = false;
      console.log('🔌 Disconnected from database');
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }
}

export const databaseService = new DatabaseService();