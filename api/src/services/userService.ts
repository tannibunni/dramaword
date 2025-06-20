import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  nickname: string;
  avatar: string;
  phone?: string;
  email?: string;
  wechatId?: string;
  vip: boolean;
  joinDate: string;
  lastLoginDate: string;
}

interface UserStats {
  streak: number;
  totalDays: number;
  lastStudyDate: string;
}

class UserService {
  private readonly USER_KEY = 'user_data';
  private readonly USER_STATS_KEY = 'user_stats';

  // 获取当前用户
  async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // 微信登录
  async loginWithWechat(): Promise<User> {
    try {
      // 模拟微信登录流程
      console.log('🔐 Starting WeChat login...');
      
      // 在实际应用中，这里会调用微信SDK
      // const wechatResponse = await WeChat.login();
      
      // 模拟微信返回的用户信息
      const mockWechatUser = {
        openid: 'mock_openid_' + Date.now(),
        nickname: '微信用户' + Math.floor(Math.random() * 1000),
        headimgurl: 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
        unionid: 'mock_unionid_' + Date.now(),
      };

      // 创建用户对象
      const user: User = {
        id: mockWechatUser.openid,
        nickname: mockWechatUser.nickname,
        avatar: mockWechatUser.headimgurl,
        wechatId: mockWechatUser.openid,
        vip: false,
        joinDate: new Date().toISOString().split('T')[0],
        lastLoginDate: new Date().toISOString().split('T')[0],
      };

      // 保存用户信息
      await this.saveUser(user);
      
      // 初始化用户统计
      await this.initUserStats();

      console.log('✅ WeChat login successful:', user.nickname);
      return user;
    } catch (error) {
      console.error('❌ WeChat login failed:', error);
      throw new Error('微信登录失败，请重试');
    }
  }

  // 手机号登录
  async loginWithPhone(phone: string, code: string): Promise<User> {
    try {
      console.log('🔐 Starting phone login...');
      
      // 模拟验证码验证
      if (code !== '123456') {
        throw new Error('验证码错误');
      }

      // 模拟用户信息
      const user: User = {
        id: 'phone_' + phone,
        nickname: '用户' + phone.slice(-4),
        avatar: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
        phone: phone,
        vip: false,
        joinDate: new Date().toISOString().split('T')[0],
        lastLoginDate: new Date().toISOString().split('T')[0],
      };

      await this.saveUser(user);
      await this.initUserStats();

      console.log('✅ Phone login successful:', user.nickname);
      return user;
    } catch (error) {
      console.error('❌ Phone login failed:', error);
      throw error;
    }
  }

  // 游客登录
  async loginAsGuest(): Promise<User> {
    try {
      console.log('🔐 Starting guest login...');
      
      const user: User = {
        id: 'guest_' + Date.now(),
        nickname: '游客用户',
        avatar: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
        vip: false,
        joinDate: new Date().toISOString().split('T')[0],
        lastLoginDate: new Date().toISOString().split('T')[0],
      };

      await this.saveUser(user);
      await this.initUserStats();

      console.log('✅ Guest login successful');
      return user;
    } catch (error) {
      console.error('❌ Guest login failed:', error);
      throw new Error('游客登录失败');
    }
  }

  // 退出登录
  async logout(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([this.USER_KEY, this.USER_STATS_KEY]);
      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('❌ Logout failed:', error);
    }
  }

  // 更新用户信息
  async updateUser(updates: Partial<User>): Promise<void> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) return;

      const updatedUser = { ...currentUser, ...updates };
      await this.saveUser(updatedUser);
    } catch (error) {
      console.error('Update user error:', error);
    }
  }

  // 获取用户统计
  async getUserStats(): Promise<UserStats> {
    try {
      const statsData = await AsyncStorage.getItem(this.USER_STATS_KEY);
      if (statsData) {
        return JSON.parse(statsData);
      }
    } catch (error) {
      console.error('Get user stats error:', error);
    }

    return {
      streak: 0,
      totalDays: 0,
      lastStudyDate: '',
    };
  }

  // 更新学习统计
  async updateStudyStats(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const stats = await this.getUserStats();
      
      if (stats.lastStudyDate === today) {
        // 今天已经学习过了
        return;
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (stats.lastStudyDate === yesterdayStr) {
        // 连续学习
        stats.streak++;
      } else if (stats.lastStudyDate === '') {
        // 第一次学习
        stats.streak = 1;
      } else {
        // 中断了，重新开始
        stats.streak = 1;
      }

      stats.totalDays++;
      stats.lastStudyDate = today;

      await AsyncStorage.setItem(this.USER_STATS_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('Update study stats error:', error);
    }
  }

  // 发送验证码
  async sendVerificationCode(phone: string): Promise<void> {
    try {
      console.log('📱 Sending verification code to:', phone);
      
      // 模拟发送验证码
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('✅ Verification code sent successfully');
    } catch (error) {
      console.error('❌ Send verification code failed:', error);
      throw new Error('发送验证码失败，请重试');
    }
  }

  // 私有方法
  private async saveUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Save user error:', error);
      throw error;
    }
  }

  private async initUserStats(): Promise<void> {
    try {
      const existingStats = await this.getUserStats();
      if (existingStats.totalDays === 0) {
        const initialStats: UserStats = {
          streak: 0,
          totalDays: 0,
          lastStudyDate: '',
        };
        await AsyncStorage.setItem(this.USER_STATS_KEY, JSON.stringify(initialStats));
      }
    } catch (error) {
      console.error('Init user stats error:', error);
    }
  }
}

export const userService = new UserService();