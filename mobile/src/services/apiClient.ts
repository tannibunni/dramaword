import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Word } from '@/types/word';

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 错误类型
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

const WORD_STORAGE_KEY = 'dramaword_words';

class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    // For mobile development, use the computer's IP address instead of localhost
    const baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.2.59:3000/api';
    this.axiosInstance = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('user_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error: AxiosError<ApiError>) => {
        console.error('❌ Response error:', error.response?.data);
        
        // 处理401未授权
        if (error.response?.status === 401) {
          await AsyncStorage.removeItem('auth_token');
          // 可以在这里触发重新登录
        }
        
        return Promise.reject(error);
      }
    );
  }

  // 通用GET请求
  public async get<T>(url: string, params?: any): Promise<T | null> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<T>>(url, { params });
      return response.data.data ?? null;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // 通用POST请求
  async post<T>(url: string, data?: any): Promise<T> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<T>>(url, data);
      return response.data.data!;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // 通用PUT请求
  async put<T>(url: string, data?: any): Promise<T> {
    try {
      const response = await this.axiosInstance.put<ApiResponse<T>>(url, data);
      return response.data.data!;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // 通用DELETE请求
  async delete<T>(url: string): Promise<T> {
    try {
      const response = await this.axiosInstance.delete<ApiResponse<T>>(url);
      return response.data.data!;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // 文件上传
  async upload<T>(url: string, formData: FormData): Promise<T> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<T>>(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data!;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // 错误处理
  private handleError(error: any): Error {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    if (error.message) {
      return new Error(error.message);
    }
    return new Error('网络请求失败');
  }

  // 设置认证token
  async setAuthToken(token: string): Promise<void> {
    await AsyncStorage.setItem('auth_token', token);
    this.axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
  }

  // 清除认证token
  async clearAuthToken(): Promise<void> {
    await AsyncStorage.removeItem('auth_token');
    delete this.axiosInstance.defaults.headers.common.Authorization;
  }

  // 检查网络连接
  async checkConnection(): Promise<boolean> {
    try {
      await this.axiosInstance.get('/health');
      return true;
    } catch (error) {
      return false;
    }
  }

  async localGet(key: string): Promise<any> {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  async localSet(key: string, value: any): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  }
  
  async getAllWords(): Promise<Word[]> {
    const wordsJson = await this.localGet(WORD_STORAGE_KEY);
    return wordsJson || [];
  }

  async saveWord(word: Word): Promise<void> {
    const words = await this.getAllWords();
    const existingIndex = words.findIndex(w => w.id === word.id);
    if (existingIndex > -1) {
      words[existingIndex] = word;
    } else {
      words.push(word);
    }
    await this.localSet(WORD_STORAGE_KEY, words);
  }

  async getWord(wordId: string): Promise<Word | null> {
    const words = await this.getAllWords();
    return words.find(w => w.id === wordId) || null;
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(WORD_STORAGE_KEY);
  }
}

export const apiClient = new ApiClient();
export default apiClient; 