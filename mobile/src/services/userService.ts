// 模拟的用户服务
class UserService {
  private user: any = null;

  /**
   * 获取当前用户
   */
  async getCurrentUser(): Promise<any> {
    console.warn('mock: getCurrentUser');
    // 模拟已登录用户
    this.user = {
      name: 'Tanny',
      email: 'tanny@example.com',
      avatar: 'https://i.pravatar.cc/150?u=tanny',
    };
    return this.user;
  }

  /**
   * 获取用户统计数据
   */
  async getUserStats(): Promise<{ streak: number; totalDays: number }> {
    console.warn('mock: getUserStats');
    return {
      streak: 5, // 连续学习5天
      totalDays: 20, // 总学习天数
    };
  }

  /**
   * 退出登录
   */
  async logout(): Promise<void> {
    console.warn('mock: logout');
    this.user = null;
    return Promise.resolve();
  }
}

export const userService = new UserService(); 