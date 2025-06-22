import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IWord } from '@/types/word';
import IPDetector, { IPDetectionResult } from './ipDetector';

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
const API_BASE_URL_KEY = 'dramaword_api_base_url';

class ApiClient {
  private axiosInstance!: AxiosInstance;
  private baseURL: string = '';

  constructor() {
    this.initializeClient();
  }

  // 初始化客户端
  private async initializeClient() {
    // 优先使用环境变量
    if (process.env.EXPO_PUBLIC_API_URL) {
      this.baseURL = process.env.EXPO_PUBLIC_API_URL;
      console.log(`🚀 Using environment API URL: ${this.baseURL}`);
    } else {
      // 使用IP检测器
      const result = await IPDetector.detectIP();
      if (result.success && result.url) {
        this.baseURL = result.url;
        console.log(`🚀 Using detected API URL: ${this.baseURL}`);
      } else {
        // 回退到默认IP
        this.baseURL = 'http://192.168.0.233:3000/api';
        console.log(`⚠️ Using fallback API URL: ${this.baseURL}`);
      }
    }

    this.createAxiosInstance();
  }

  // 创建axios实例
  private createAxiosInstance() {
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  // 设置拦截器
  private setupInterceptors() {
    // 请求拦截器
    this.axiosInstance.interceptors.request.use(
      (config) => {
        console.log(`🔍 Making ${config.method?.toUpperCase()} request to: ${config.baseURL}${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ Request error:', error);
        return Promise.reject(error);
      }
    );

    // 认证拦截器
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
        
        // 如果是网络错误，尝试重新检测IP
        if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
          console.log('🔄 Network error detected, trying to detect new IP...');
          await this.retryWithNewIP();
        }
        
        // 处理401未授权
        if (error.response?.status === 401) {
          await AsyncStorage.removeItem('auth_token');
        }
        
        return Promise.reject(error);
      }
    );
  }

  // 使用新IP重试
  private async retryWithNewIP() {
    try {
      const result = await IPDetector.refreshIP();
      if (result.success && result.url && result.url !== this.baseURL) {
        console.log(`🔄 Updating API URL from ${this.baseURL} to ${result.url}`);
        this.baseURL = result.url;
        this.createAxiosInstance();
      }
    } catch (error) {
      console.error('❌ Failed to update IP:', error);
    }
  }

  // 手动刷新IP
  public async refreshIP(): Promise<IPDetectionResult> {
    console.log('🔄 Manually refreshing IP...');
    const result = await IPDetector.refreshIP();
    
    if (result.success && result.url) {
      this.baseURL = result.url;
      this.createAxiosInstance();
    }
    
    return result;
  }

  // 获取当前IP信息
  public async getCurrentIP(): Promise<string | null> {
    return await IPDetector.getCurrentIP();
  }

  // 通用GET请求
  public async get<T>(url: string, params?: any): Promise<T | null> {
    try {
      console.log(`🔍 Making GET request to: ${this.axiosInstance.defaults.baseURL}${url}`);
      const response = await this.axiosInstance.get(url, { params });
      
      console.log(`✅ GET response received:`, response.status, response.data);
      
      // 检查响应格式：如果是包装格式 {success: true, data: {...}}
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        return response.data.data ?? null;
      }
      
      // 直接返回数据对象
      return response.data ?? null;
    } catch (error) {
      console.error(`❌ GET request failed for ${url}:`, error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
      }
      this.handleError(error);
      throw error;
    }
  }

  // 通用POST请求
  async post<T>(url: string, data?: any): Promise<T> {
    try {
      console.log(`🔍 Making POST request to: ${this.axiosInstance.defaults.baseURL}${url}`);
      const response = await this.axiosInstance.post<ApiResponse<T>>(url, data);
      
      console.log(`✅ POST response received:`, response.status, response.data);
      
      // 检查响应格式
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        return response.data.data!;
      }
      
      // 直接返回数据
      return response.data as T;
    } catch (error) {
      console.error(`❌ POST request failed for ${url}:`, error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
      }
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
  
  async getAllWords(): Promise<IWord[]> {
    const wordsJson = await this.localGet(WORD_STORAGE_KEY);
    return wordsJson || [];
  }

  async saveWord(word: IWord): Promise<void> {
    const words = await this.getAllWords();
    const existingIndex = words.findIndex(w => w._id === word._id);
    if (existingIndex > -1) {
      words[existingIndex] = word;
    } else {
      words.push(word);
    }
    await this.localSet(WORD_STORAGE_KEY, words);
  }

  async getWord(wordId: string): Promise<IWord | null> {
    const words = await this.getAllWords();
    return words.find(w => w._id === wordId) || null;
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(WORD_STORAGE_KEY);
  }

  // 测试音频URL是否可用
  async testAudioUrl(audioUrl: string): Promise<boolean> {
    try {
      console.log(`🔊 Testing audio URL: ${audioUrl}`);
      const response = await this.axiosInstance.head(audioUrl.replace(this.axiosInstance.defaults.baseURL || '', ''));
      console.log(`🔊 Audio URL test result: ${response.status}`);
      return response.status === 200;
    } catch (error) {
      console.error(`🔊 Audio URL test failed:`, error);
      return false;
    }
  }

  // 获取音频URL（用于调试）
  getAudioUrl(word: string): string {
    const baseURL = this.axiosInstance.defaults.baseURL?.replace('/api', '') || 'http://localhost:3000';
    return `${baseURL}/api/words/${word}/audio`;
  }
}

export const apiClient = new ApiClient();
export default apiClient; 