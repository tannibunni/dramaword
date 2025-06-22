import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import Drama from '../models/Drama'; // 引入新的Drama模型

// TMDB API 配置
const TMDB_API_KEY = process.env.TMDB_API_KEY || '044a27ee9cae3da0237498a1291df225';
const TMDB_READ_ACCESS_TOKEN = process.env.TMDB_READ_ACCESS_TOKEN || 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwNDRhMjdlZTljYWUzZGEwMjM3NDk4YTEyOTFkZjIyNSIsIm5iZiI6MTc1MDYxODI5OC4yODE5OTk4LCJzdWIiOiI2ODU4NTBiYTUxOGU5YTNjYzZjN2IwZTgiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.dvOgWpasIqo2tAmBPtcMsyzb8qOVBaYX9LvF7hCWc1M';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// 剧集数据结构
interface DramaSearchResult {
  id: number;
  title: string;
  original_title?: string;
  name?: string; // 电视剧用name字段
  original_name?: string;
  media_type: 'movie' | 'tv';
  poster_path?: string;
  backdrop_path?: string;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
}

interface UserDrama {
  id: string;
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
  createdAt: Date;
  updatedAt: Date;
}

// 模拟用户剧单数据（实际项目中应该使用数据库）
let userDramas: UserDrama[] = [];

// 搜索剧集
export const searchDrama = async (req: Request, res: Response, next: NextFunction) => {
  const { query, type = 'multi' } = req.query;
  
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: '搜索关键词不能为空' });
  }

  try {
    console.log(`🔍 Searching TMDB for: "${query}"`);
    
    // 调用TMDB搜索API
    const searchUrl = `${TMDB_BASE_URL}/search/${type}`;
    const response = await axios.get(searchUrl, {
      params: {
        api_key: TMDB_API_KEY,
        query: query,
        language: 'zh-CN',
        include_adult: false,
        page: 1,
      },
      headers: {
        'Authorization': `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const results = response.data.results || [];
    console.log(`📊 TMDB returned ${results.length} results`);
    
    // 格式化搜索结果
    const formattedResults = results.slice(0, 10).map((item: DramaSearchResult) => ({
      id: item.id,
      title: item.title || item.name || '未知标题',
      originalTitle: item.original_title || item.original_name,
      type: item.media_type,
      posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
      backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}` : null,
      overview: item.overview,
      releaseDate: item.release_date || item.first_air_date,
      rating: item.vote_average,
      voteCount: item.vote_count,
    }));

    console.log(`✅ Found ${formattedResults.length} formatted results for "${query}"`);
    return res.json(formattedResults);

  } catch (error) {
    console.error('❌ TMDB search error:', error);
    
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
    }
    
    // 如果TMDB API不可用，返回模拟数据
    const mockResults = [
      {
        id: 1399,
        title: '权力的游戏',
        originalTitle: 'Game of Thrones',
        type: 'tv',
        posterPath: null,
        overview: '九大家族争夺铁王座的史诗奇幻剧',
        releaseDate: '2011-04-17',
        rating: 9.3,
        voteCount: 20000,
      },
      {
        id: 1396,
        title: '怪奇物语',
        originalTitle: 'Stranger Things',
        type: 'tv',
        posterPath: null,
        overview: '一群孩子在小镇中遇到超自然现象',
        releaseDate: '2016-07-15',
        rating: 8.7,
        voteCount: 15000,
      },
    ];
    
    return res.json(mockResults);
  }
};

// 获取用户剧单
export const getUserDramas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('📚 Getting user drama list');
    const dramas = await Drama.find().sort({ createdAt: -1 });
    return res.json(dramas);
  } catch (error) {
    console.error('❌ Get user dramas error:', error);
    return next(error);
  }
};

// 保存剧集到剧单
export const saveDrama = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dramaData = req.body;
    
    // 检查剧集是否已存在
    const existingDrama = await Drama.findOne({ tmdbId: dramaData.tmdbId });
    if (existingDrama) {
      return res.status(409).json({ error: '该剧集已在您的剧单中' });
    }

    const newDrama = new Drama(dramaData);
    await newDrama.save();
    
    return res.status(201).json(newDrama);
  } catch (error) {
    console.error('❌ Save drama error:', error);
    return next(error);
  }
};

// 更新剧集状态
export const updateDrama = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedDrama = await Drama.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!updatedDrama) {
      return res.status(404).json({ error: '剧集不存在' });
    }

    return res.json(updatedDrama);
  } catch (error) {
    console.error('❌ Update drama error:', error);
    return next(error);
  }
};

// 删除剧集
export const deleteDrama = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const deletedDrama = await Drama.findByIdAndDelete(id);

    if (!deletedDrama) {
      return res.status(404).json({ error: '剧集不存在' });
    }
    
    return res.status(204).send();
  } catch (error) {
    console.error('❌ Delete drama error:', error);
    return next(error);
  }
}; 