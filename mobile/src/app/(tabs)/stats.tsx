import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, Dimensions, TouchableOpacity, Alert, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { wordService } from '@/services/wordService';
import { databaseService } from '@/services/databaseService';
import { syncService } from '@/services/syncService';
import { userService } from '@/services/userService';
import { reviewService } from '@/services/reviewService';
import LoginModal from '@/components/LoginModal';
import SettingsModal from '@/components/SettingsModal';

const { width } = Dimensions.get('window');

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

export default function StatsScreen() {
  const [stats, setStats] = useState({
    totalWords: 0,
    knownWords: 0,
    reviewWords: 0,
    accuracy: 0,
  });

  const [reviewStats, setReviewStats] = useState({
    totalReviews: 0,
    correctReviews: 0,
    accuracy: 0,
    todayReviews: 0,
    streak: 0,
    totalSessions: 0,
  });

  const [cloudStats, setCloudStats] = useState({
    totalWords: 0,
    recentWords: 0,
    userContributions: 0,
  });

  const [syncStatus, setSyncStatus] = useState({
    inProgress: false,
    lastSyncTime: 0,
    nextSyncTime: 0,
  });

  const [cacheInfo, setCacheInfo] = useState({
    wordCount: 0,
    totalSize: '0 KB',
  });

  const [isClearing, setIsClearing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // User states
  const [user, setUser] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [userStats, setUserStats] = useState({
    streak: 0,
    totalDays: 0,
  });

  const insets = useSafeAreaInsets();

  useFocusEffect(
    React.useCallback(() => {
      loadAllData();
    }, [])
  );

  const loadAllData = async () => {
    await Promise.all([
      loadStats(),
      loadReviewStats(),
      loadCloudStats(),
      loadSyncStatus(),
      loadCacheInfo(),
      loadUserData(),
    ]);
  };

  const loadStats = async () => {
    try {
      const currentStats = await wordService.getStudyStats();
      setStats(currentStats);
      console.log('📊 Loaded word stats:', currentStats);
    } catch (error) {
      console.error('Load stats error:', error);
    }
  };

  const loadReviewStats = async () => {
    try {
      const currentReviewStats = await reviewService.getStudyStats();
      setReviewStats(currentReviewStats);
      console.log('📈 Loaded review stats:', currentReviewStats);
    } catch (error) {
      console.error('Load review stats error:', error);
    }
  };

  const loadCloudStats = async () => {
    try {
      const cloudData = await databaseService.getWordStats();
      setCloudStats({
        totalWords: cloudData.totalWords,
        recentWords: cloudData.recentWords,
        userContributions: Math.floor(Math.random() * 50) + 10,
      });
    } catch (error) {
      console.error('Load cloud stats error:', error);
    }
  };

  const loadSyncStatus = () => {
    const status = syncService.getSyncStatus();
    setSyncStatus(status);
  };

  const loadCacheInfo = async () => {
    try {
      const info = await wordService.getCacheInfo();
      setCacheInfo(info);
    } catch (error) {
      console.error('Load cache info error:', error);
    }
  };

  const loadUserData = async () => {
    try {
      const userData = await userService.getCurrentUser();
      setUser(userData);
      
      if (userData) {
        const userStatsData = await userService.getUserStats();
        setUserStats(userStatsData);
      }
    } catch (error) {
      console.error('Load user data error:', error);
    }
  };

  const handleForceSync = async () => {
    try {
      await syncService.forceFullSync();
      loadSyncStatus();
      loadCloudStats();
    } catch (error) {
      console.error('Force sync error:', error);
    }
  };

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      console.log('🔄 Refreshing all data...');
      
      await loadAllData();
      
      console.log('✅ Data refresh completed');
    } catch (error) {
      console.error('❌ Data refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClearAllData = () => {
    Alert.alert(
      '清除所有数据',
      `清除所有本地单词数据和庆祝记录，用于重新测试庆祝功能。\n\n当前数据：${cacheInfo.wordCount} 个单词，${cacheInfo.totalSize}\n\n此操作不可恢复，确定要继续吗？`,
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '确认清除',
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            try {
              console.log('🗑️ 开始清除所有数据...');
              
              await wordService.clearAllData();
              await reviewService.clearAllRecords();
              
              await Promise.all([
                loadStats(),
                loadReviewStats(),
                loadCacheInfo(),
              ]);
              
              console.log('✅ 数据清除完成');
              
              Alert.alert(
                '清除成功',
                '所有数据已清除，现在可以重新开始测试庆祝功能了！',
                [{ text: '好的' }]
              );
            } catch (error) {
              console.error('❌ 清除数据失败:', error);
              Alert.alert('清除失败', '请稍后重试');
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };

  const handleLogin = () => {
    setShowLogin(true);
  };

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    setShowLogin(false);
    loadUserData();
  };

  const handleLogout = () => {
    Alert.alert(
      '退出登录',
      '确定要退出当前账户吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            await userService.logout();
            setUser(null);
            setUserStats({ streak: 0, totalDays: 0 });
          },
        },
      ]
    );
  };

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon, 
    color, 
    backgroundColor 
  }: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: FeatherIconName;
    color: string;
    backgroundColor: string;
  }) => (
    <View style={[styles.statCard, { backgroundColor }]}>
      <View style={styles.statCardHeader}>
        <View style={[styles.statCardIcon, { backgroundColor: color + '20' }]}>
          <Feather name={icon} color={color} size={20} />
        </View>
        <Text style={styles.statCardTitle}>{title}</Text>
      </View>
      <Text style={styles.statCardValue}>{value}</Text>
      <Text style={styles.statCardSubtitle}>{subtitle}</Text>
    </View>
  );

  const ProgressBar = ({ 
    label, 
    current, 
    total, 
    color 
  }: {
    label: string;
    current: number;
    total: number;
    color: string;
  }) => {
    const percentage = total > 0 ? (current / total) * 100 : 0;
    
    return (
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarHeader}>
          <Text style={styles.progressBarLabel}>{label}</Text>
          <Text style={styles.progressBarValue}>{current} / {total}</Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${percentage}%`, backgroundColor: color }
            ]} 
          />
        </View>
        <Text style={styles.progressBarPercentage}>{Math.round(percentage)}%</Text>
      </View>
    );
  };

  const formatSyncTime = (timestamp: number) => {
    if (timestamp === 0) return '从未同步';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    return `${days}天前`;
  };

  const MenuSection = ({ 
    title, 
    items 
  }: {
    title: string;
    items: Array<{
      icon: FeatherIconName;
      title: string;
      subtitle?: string;
      onPress: () => void;
      color?: string;
      showChevron?: boolean;
    }>;
  }) => (
    <View style={styles.menuSection}>
      <Text style={styles.menuSectionTitle}>{title}</Text>
      <View style={styles.menuContainer}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.menuItem,
              index === items.length - 1 && styles.menuItemLast
            ]}
            onPress={item.onPress}
            activeOpacity={0.6}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: (item.color || '#666666') + '20' }]}>
                <Feather name={item.icon} size={18} color={item.color || '#666666'} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
                {item.subtitle && (
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with User Avatar + Login Button */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerContent}>
          {user ? (
            // Logged in user - show avatar and info
            <View style={styles.userHeaderSection}>
              <Image
                source={{ uri: user.avatar || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2' }}
                style={styles.headerAvatar}
              />
              <View style={styles.userHeaderInfo}>
                <View style={styles.userHeaderNameRow}>
                  <Text style={styles.userHeaderName}>{user.nickname || '词汇学习者'}</Text>
                  {user.vip && (
                    <View style={styles.headerVipBadge}>
                      <Feather name="award" size={12} color="#F59E0B" />
                    </View>
                  )}
                </View>
                <Text style={styles.userHeaderSubtitle}>
                  学习 {userStats.totalDays} 天 · 连续 {userStats.streak} 天
                </Text>
              </View>
            </View>
          ) : (
            // Not logged in - show login prompt
            <View style={styles.loginHeaderSection}>
              <View style={styles.headerAvatarPlaceholder}>
                <Feather name="user" size={24} color="#CCCCCC" />
              </View>
              <View style={styles.loginHeaderInfo}>
                <Text style={styles.loginHeaderTitle}>登录后享受更多功能</Text>
                <Text style={styles.loginHeaderSubtitle}>数据云端同步 · 学习记录保存</Text>
              </View>
              <TouchableOpacity style={styles.headerLoginButton} onPress={handleLogin}>
                <Text style={styles.headerLoginButtonText}>登录</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={handleRefreshData}
              disabled={isRefreshing}
            >
              <Feather name="refresh-cw" size={16} color="#666666" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => setShowSettings(true)}
            >
              <Feather name="settings" size={16} color="#666666" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.contentContainer} 
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingBottom: Math.max(insets.bottom + 140, 160) }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Personal Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>个人学习数据</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="总词汇量"
              value={stats.totalWords}
              subtitle="已学习的单词"
              icon="book-open"
              color="#3B82F6"
              backgroundColor="#FFFFFF"
            />
            <StatCard
              title="已掌握"
              value={stats.knownWords}
              subtitle="熟练掌握的单词"
              icon="award"
              color="#22C55E"
              backgroundColor="#FFFFFF"
            />
            <StatCard
              title="待复习"
              value={stats.reviewWords}
              subtitle="需要继续复习"
              icon="clock"
              color="#F59E0B"
              backgroundColor="#FFFFFF"
            />
            <StatCard
              title="准确率"
              value={`${stats.accuracy}%`}
              subtitle="总体复习准确率"
              icon="target"
              color="#8B5CF6"
              backgroundColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Review Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>复习统计</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="总复习次数"
              value={reviewStats.totalReviews}
              subtitle="累计复习单词次数"
              icon="repeat"
              color="#EC4899"
              backgroundColor="#FFFFFF"
            />
            <StatCard
              title="正确次数"
              value={reviewStats.correctReviews}
              subtitle="正确回忆的次数"
              icon="check-circle"
              color="#10B981"
              backgroundColor="#FFFFFF"
            />
            <StatCard
              title="今日复习"
              value={reviewStats.todayReviews}
              subtitle="今天已复习的单词"
              icon="calendar"
              color="#F97316"
              backgroundColor="#FFFFFF"
            />
            <StatCard
              title="连续天数"
              value={reviewStats.streak}
              subtitle="连续学习天数"
              icon="trending-up"
              color="#EF4444"
              backgroundColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Progress Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>学习进度</Text>
          <View style={styles.progressContainer}>
            <ProgressBar
              label="词汇掌握度"
              current={stats.knownWords}
              total={stats.totalWords}
              color="#22C55E"
            />
            <ProgressBar
              label="复习完成度"
              current={reviewStats.todayReviews}
              total={Math.max(reviewStats.todayReviews, 10)}
              color="#3B82F6"
            />
            <ProgressBar
              label="学习准确率"
              current={reviewStats.correctReviews}
              total={reviewStats.totalReviews}
              color="#8B5CF6"
            />
          </View>
        </View>

        {/* Cloud Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>云端词库数据</Text>
          <View style={styles.cloudStatsContainer}>
            <View style={styles.cloudStatItem}>
              <View style={styles.cloudStatIcon}>
                <Feather name="cloud" size={24} color="#3B82F6" />
              </View>
              <View style={styles.cloudStatContent}>
                <Text style={styles.cloudStatNumber}>{cloudStats.totalWords.toLocaleString()}</Text>
                <Text style={styles.cloudStatLabel}>云端总词汇</Text>
              </View>
            </View>
            
            <View style={styles.cloudStatItem}>
              <View style={styles.cloudStatIcon}>
                <Feather name="trending-up" size={24} color="#22C55E" />
              </View>
              <View style={styles.cloudStatContent}>
                <Text style={styles.cloudStatNumber}>{cloudStats.recentWords}</Text>
                <Text style={styles.cloudStatLabel}>本周新增</Text>
              </View>
            </View>
            
            <View style={styles.cloudStatItem}>
              <View style={styles.cloudStatIcon}>
                <Feather name="star" size={24} color="#F59E0B" />
              </View>
              <View style={styles.cloudStatContent}>
                <Text style={styles.cloudStatNumber}>{cloudStats.userContributions}</Text>
                <Text style={styles.cloudStatLabel}>我的贡献</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Sync Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>数据同步状态</Text>
          <View style={styles.syncContainer}>
            <View style={styles.syncHeader}>
              <View style={styles.syncStatusIndicator}>
                <View style={[
                  styles.syncStatusDot,
                  { backgroundColor: syncStatus.inProgress ? '#22C55E' : '#6B7280' }
                ]} />
                <Text style={styles.syncStatusText}>
                  {syncStatus.inProgress ? '同步中...' : '已同步'}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.syncButton}
                onPress={handleForceSync}
                disabled={syncStatus.inProgress}
              >
                <Text style={styles.syncButtonText}>
                  {syncStatus.inProgress ? '同步中' : '立即同步'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.syncDetails}>
              <Text style={styles.syncDetailText}>
                上次同步：{formatSyncTime(syncStatus.lastSyncTime)}
              </Text>
              <Text style={styles.syncDetailText}>
                数据状态：本地 {stats.totalWords} 词 · 云端 {cloudStats.totalWords.toLocaleString()} 词
              </Text>
            </View>
          </View>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>数据管理</Text>
          <View style={styles.dataManagementContainer}>
            <View style={styles.clearDataInfo}>
              <View style={styles.clearDataHeader}>
                <Feather name="trash-2" size={20} color="#EF4444" />
                <Text style={styles.clearDataTitle}>清除所有数据</Text>
              </View>
              <Text style={styles.clearDataDescription}>
                清除所有本地单词数据和庆祝记录，用于重新测试庆祝功能
              </Text>
              
              <View style={styles.cacheInfoContainer}>
                <Text style={styles.cacheInfoText}>
                  当前缓存：{cacheInfo.wordCount} 个单词，{cacheInfo.totalSize}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.clearDataButton, isClearing && styles.clearDataButtonDisabled]}
              onPress={handleClearAllData}
              disabled={isClearing}
            >
              <Feather name="trash-2" size={16} color="#FFFFFF" />
              <Text style={styles.clearDataButtonText}>
                {isClearing ? '清除中...' : '清除所有数据'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* User Menu - Only show if logged in */}
        {user && (
          <MenuSection
            title="账户管理"
            items={[
              {
                icon: 'award',
                title: '成就中心',
                subtitle: '查看学习成就和里程碑',
                onPress: () => Alert.alert('成就中心', '功能开发中'),
                color: '#F59E0B',
              },
              {
                icon: "calendar",
                title: '学习计划',
                subtitle: '制定个性化学习计划',
                onPress: () => Alert.alert('学习计划', '功能开发中'),
                color: '#3B82F6',
              },
              {
                icon: "log-out",
                title: '退出登录',
                onPress: handleLogout,
                color: '#EF4444',
              },
            ]}
          />
        )}

        {/* App Settings */}
        <MenuSection
          title="应用设置"
          items={[
            {
              icon: "shield",
              title: '隐私政策',
              subtitle: '了解我们如何保护您的隐私',
              onPress: () => Alert.alert('隐私政策', '隐私政策内容'),
              color: '#3B82F6',
            },
            {
              icon: "file-text",
              title: '用户协议',
              subtitle: '服务条款和使用协议',
              onPress: () => Alert.alert('用户协议', '用户协议内容'),
              color: '#22C55E',
            },
            {
              icon: "info",
              title: '关于我们',
              subtitle: '版本 1.0.0',
              onPress: () => Alert.alert('关于我们', '词汇学习助手 v1.0.0\n\n一款专业的英语词汇学习应用'),
              color: '#F59E0B',
            },
          ]}
        />
      </ScrollView>

      {/* Login Modal */}
      <LoginModal
        visible={showLogin}
        onClose={() => setShowLogin(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Settings Modal */}
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // User Header Styles (when logged in)
  userHeaderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userHeaderInfo: {
    flex: 1,
  },
  userHeaderNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userHeaderName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    marginRight: 8,
  },
  headerVipBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  userHeaderSubtitle: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '400',
  },

  // Login Header Styles (when not logged in)
  loginHeaderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  loginHeaderInfo: {
    flex: 1,
  },
  loginHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 2,
  },
  loginHeaderSubtitle: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '400',
  },
  headerLoginButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  headerLoginButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollContent: {
    paddingVertical: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 16,
    letterSpacing: -0.2,
  },

  // Menu Styles
  menuSection: {
    marginBottom: 24,
  },
  menuSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111111',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: '#666666',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 56) / 2,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statCardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    flex: 1,
  },
  statCardValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 4,
    letterSpacing: -1,
  },
  statCardSubtitle: {
    fontSize: 12,
    color: '#999999',
    lineHeight: 16,
  },
  progressContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  progressBarContainer: {
    marginBottom: 24,
  },
  progressBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBarLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111111',
  },
  progressBarValue: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressBarPercentage: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
    fontWeight: '500',
  },
  cloudStatsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  cloudStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  cloudStatIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cloudStatContent: {
    flex: 1,
  },
  cloudStatNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  cloudStatLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '400',
  },
  syncContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  syncHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  syncStatusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  syncStatusText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111111',
  },
  syncButton: {
    backgroundColor: '#111111',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  syncDetails: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F8F9FA',
  },
  syncDetailText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    lineHeight: 20,
  },
  dataManagementContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  clearDataInfo: {
    marginBottom: 20,
  },
  clearDataHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearDataTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
  clearDataDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 16,
  },
  cacheInfoContainer: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cacheInfoText: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },
  clearDataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  clearDataButtonDisabled: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0,
    elevation: 0,
  },
  clearDataButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});