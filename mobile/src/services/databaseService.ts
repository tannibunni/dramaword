// 模拟的数据库服务
class DatabaseService {
  /**
   * 获取数据库中的单词统计信息
   */
  async getWordStats(): Promise<{ totalWords: number; recentWords: number }> {
    console.warn('mock: getWordStats');
    // 模拟返回数据
    return {
      totalWords: 12345, // 模拟总单词数
      recentWords: 123,  // 模拟最近增加的单词数
    };
  }
}

export const databaseService = new DatabaseService(); 