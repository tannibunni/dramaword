// 模拟的同步服务
class SyncService {
  /**
   * 获取同步状态
   */
  getSyncStatus(): { inProgress: boolean; lastSyncTime: number; nextSyncTime: number } {
    console.warn('mock: getSyncStatus');
    // 模拟返回状态
    return {
      inProgress: false,
      lastSyncTime: Date.now() - 1000 * 60 * 5, // 5分钟前
      nextSyncTime: Date.now() + 1000 * 60 * 60, // 1小时后
    };
  }

  /**
   * 强制执行一次完整同步
   */
  async forceFullSync(): Promise<void> {
    console.warn('mock: forceFullSync');
    // 模拟一个耗时2秒的同步过程
    return new Promise(resolve => setTimeout(resolve, 2000));
  }
}

export const syncService = new SyncService(); 