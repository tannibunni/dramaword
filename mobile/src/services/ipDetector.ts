import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL_KEY = 'dramaword_api_base_url';

export interface IPDetectionResult {
  success: boolean;
  ip?: string;
  url?: string;
  error?: string;
}

class IPDetector {
  // 常见的本地IP地址范围
  private static readonly COMMON_IPS = [
    // 192.168.x.x 范围
    '192.168.1.100', '192.168.1.101', '192.168.1.102', '192.168.1.103',
    '192.168.0.100', '192.168.0.101', '192.168.0.102', '192.168.0.103',
    '192.168.2.59', '192.168.2.100', '192.168.2.101', '192.168.2.102', '192.168.2.103',
    // 10.x.x.x 范围
    '10.0.0.100', '10.0.0.101', '10.0.0.102', '10.0.0.103',
    '10.0.1.100', '10.0.1.101', '10.0.1.102', '10.0.1.103',
    '10.3.104.115', '10.3.104.116', '10.3.104.117', '10.3.104.118',
    // 172.x.x.x 范围
    '172.16.0.100', '172.16.0.101', '172.16.0.102', '172.16.0.103',
    '172.20.0.100', '172.20.0.101', '172.20.0.102', '172.20.0.103',
  ];

  // 检测单个IP地址
  private static async testIP(ip: string, timeout: number = 2000): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(`http://${ip}:3000/health`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // 并行检测多个IP地址
  private static async testIPs(ips: string[]): Promise<string | null> {
    const promises = ips.map(async (ip) => {
      const isReachable = await this.testIP(ip);
      return isReachable ? ip : null;
    });

    const results = await Promise.all(promises);
    return results.find(result => result !== null) || null;
  }

  // 智能IP检测
  public static async detectIP(): Promise<IPDetectionResult> {
    try {
      console.log('🔍 Starting IP detection...');
      
      // 首先尝试缓存的IP
      const cachedURL = await AsyncStorage.getItem(API_BASE_URL_KEY);
      if (cachedURL) {
        const cachedIP = cachedURL.replace('http://', '').replace('/api', '');
        console.log(`🔍 Testing cached IP: ${cachedIP}`);
        
        if (await this.testIP(cachedIP)) {
          console.log(`✅ Cached IP is still valid: ${cachedIP}`);
          return {
            success: true,
            ip: cachedIP,
            url: cachedURL
          };
        }
      }

      // 并行检测所有常见IP
      console.log('🔍 Testing common IP addresses...');
      const foundIP = await this.testIPs(this.COMMON_IPS);
      
      if (foundIP) {
        const apiURL = `http://${foundIP}/api`;
        console.log(`✅ Found backend at: ${foundIP}`);
        
        // 缓存新的IP
        await AsyncStorage.setItem(API_BASE_URL_KEY, apiURL);
        
        return {
          success: true,
          ip: foundIP,
          url: apiURL
        };
      }

      // 如果都失败了，返回错误
      console.log('❌ No valid IP found');
      return {
        success: false,
        error: '无法检测到有效的后端服务器IP地址'
      };
      
    } catch (error) {
      console.error('❌ IP detection failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  // 手动刷新IP
  public static async refreshIP(): Promise<IPDetectionResult> {
    console.log('🔄 Manually refreshing IP...');
    
    // 清除缓存
    await AsyncStorage.removeItem(API_BASE_URL_KEY);
    
    // 重新检测
    return await this.detectIP();
  }

  // 获取当前缓存的IP
  public static async getCurrentIP(): Promise<string | null> {
    try {
      const cachedURL = await AsyncStorage.getItem(API_BASE_URL_KEY);
      if (cachedURL) {
        return cachedURL.replace('http://', '').replace('/api', '');
      }
      return null;
    } catch (error) {
      console.error('Get current IP error:', error);
      return null;
    }
  }

  // 验证IP是否仍然有效
  public static async validateIP(ip: string): Promise<boolean> {
    return await this.testIP(ip);
  }
}

export default IPDetector; 