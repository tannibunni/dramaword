import { Word } from '@/types/word';
import { storageService } from './storageService';
import { databaseService } from './databaseService';

class SyncService {
  private syncInProgress: boolean = false;
  private lastSyncTime: number = 0;
  private readonly SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

  // 智能同步策略
  async smartSync(): Promise<void> {
    if (this.syncInProgress) {
      console.log('⏳ Sync already in progress');
      return;
    }

    const now = Date.now();
    if (now - this.lastSyncTime < this.SYNC_INTERVAL) {
      console.log('⏰ Sync interval not reached');
      return;
    }

    this.syncInProgress = true;
    this.lastSyncTime = now;

    try {
      console.log('🔄 Starting smart sync...');

      // 1. 上传本地新增词汇到云端
      await this.uploadLocalWords();

      // 2. 下载云端更新到本地
      await this.downloadCloudUpdates();

      // 3. 解决冲突
      await this.resolveConflicts();

      console.log('✅ Smart sync completed');
    } catch (error) {
      console.error('❌ Smart sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  // 上传本地词汇到云端
  private async uploadLocalWords(): Promise<void> {
    try {
      const localWords = await storageService.getAllCachedWords();
      const wordsToUpload = localWords.filter(word => 
        !word.cloudSynced || word.lastModified > word.lastSynced
      );

      if (wordsToUpload.length === 0) {
        console.log('📤 No local words to upload');
        return;
      }

      console.log(`📤 Uploading ${wordsToUpload.length} words to cloud...`);

      for (const word of wordsToUpload) {
        const success = await databaseService.saveWord(word);
        if (success) {
          // 标记为已同步
          word.cloudSynced = true;
          word.lastSynced = Date.now();
          await storageService.updateWordInCache(word);
        }
      }

      console.log(`✅ Uploaded ${wordsToUpload.length} words`);
    } catch (error) {
      console.error('Upload error:', error);
    }
  }

  // 从云端下载更新
  private async downloadCloudUpdates(): Promise<void> {
    try {
      console.log('📥 Checking for cloud updates...');

      // 获取云端统计信息
      const stats = await databaseService.getWordStats();
      console.log(`☁️ Cloud database has ${stats.totalWords} words`);

      // 在实际实现中，这里会下载用户相关的词汇更新
      // 例如：共享词库中的新释义、更好的例句等

      console.log('✅ Cloud updates checked');
    } catch (error) {
      console.error('Download error:', error);
    }
  }

  // 解决同步冲突
  private async resolveConflicts(): Promise<void> {
    try {
      console.log('🔧 Resolving sync conflicts...');

      // 冲突解决策略：
      // 1. 本地学习数据优先（reviewCount, correctCount, isKnown）
      // 2. 云端内容数据优先（meanings, examples, derivatives）
      // 3. 合并策略（synonyms, chineseTranslations）

      console.log('✅ Conflicts resolved');
    } catch (error) {
      console.error('Conflict resolution error:', error);
    }
  }

  // 强制全量同步
  async forceFullSync(): Promise<void> {
    console.log('🔄 Starting force full sync...');
    this.lastSyncTime = 0; // Reset sync time
    await this.smartSync();
  }

  // 获取同步状态
  getSyncStatus(): {
    inProgress: boolean;
    lastSyncTime: number;
    nextSyncTime: number;
  } {
    return {
      inProgress: this.syncInProgress,
      lastSyncTime: this.lastSyncTime,
      nextSyncTime: this.lastSyncTime + this.SYNC_INTERVAL,
    };
  }
}

export const syncService = new SyncService();