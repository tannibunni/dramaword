import { apiClient } from './apiClient';

export interface DramaSearchResult {
  id: number;
  title: string;
  originalTitle?: string;
  type: 'movie' | 'tv';
  posterPath?: string;
  backdropPath?: string;
  overview?: string;
  releaseDate?: string;
  rating?: number;
  voteCount?: number;
}

export interface UserDrama {
  id: string;
  _id?: string;
  tmdbId: number;
  title: string;
  originalTitle?: string;
  type: 'movie' | 'tv';
  status: 'want' | 'watching' | 'completed' | 'dropped';
  platform?: string;
  notes?: string;
  rating?: number;
  posterPath?: string;
  overview?: string;
  releaseDate?: string;
  tmdbRating?: number;
  createdAt: string;
  updatedAt: string;
}

class DramaService {
  // 搜索剧集
  async searchDrama(query: string, type: 'multi' | 'movie' | 'tv' = 'multi'): Promise<DramaSearchResult[]> {
    try {
      console.log(`🔍 DramaService: Searching for "${query}"`);
      const results = await apiClient.get<DramaSearchResult[]>(`/drama/search?query=${encodeURIComponent(query)}&type=${type}`);
      console.log(`✅ DramaService: Found ${results?.length || 0} results`);
      return results || [];
    } catch (error) {
      console.error('❌ DramaService: Search error:', error);
      return [];
    }
  }

  // 获取用户剧单
  async getUserDramas(): Promise<UserDrama[]> {
    try {
      console.log('📚 DramaService: Getting user drama list');
      const dramas = await apiClient.get<UserDrama[]>('/drama/user');
      console.log(`✅ DramaService: Retrieved ${dramas?.length || 0} dramas`);
      return dramas || [];
    } catch (error) {
      console.error('❌ DramaService: Get user dramas error:', error);
      return [];
    }
  }

  // 保存剧集到剧单
  async saveDrama(drama: Partial<UserDrama>): Promise<UserDrama> {
    try {
      console.log(`💾 DramaService: Saving drama "${drama.title}"`);
      const savedDrama = await apiClient.post<UserDrama>('/drama', drama);
      console.log(`✅ DramaService: Drama saved successfully`);
      return savedDrama;
    } catch (error) {
      console.error('❌ DramaService: Save drama error:', error);
      throw error;
    }
  }

  // 更新剧集状态
  async updateDrama(id: string, updateData: Partial<UserDrama>): Promise<UserDrama> {
    try {
      console.log(`🔄 DramaService: Updating drama ${id}`);
      const updatedDrama = await apiClient.put<UserDrama>(`/drama/${id}`, updateData);
      console.log(`✅ DramaService: Drama updated successfully`);
      return updatedDrama;
    } catch (error) {
      console.error('❌ DramaService: Update drama error:', error);
      throw error;
    }
  }

  // 删除剧集
  async deleteDrama(id: string): Promise<void> {
    try {
      console.log(`🗑️ DramaService: Deleting drama ${id}`);
      await apiClient.delete(`/drama/${id}`);
      console.log(`✅ DramaService: Drama deleted successfully`);
    } catch (error) {
      console.error('❌ DramaService: Delete drama error:', error);
      throw error;
    }
  }
}

// 创建单例实例
export const dramaService = new DramaService();
export default dramaService; 