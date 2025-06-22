import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Switch, Alert, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '@/services/apiClient';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

interface AppSettings {
  soundEnabled: boolean;
  notificationEnabled: boolean;
  darkMode: boolean;
  autoSync: boolean;
  offlineMode: boolean;
  cacheSize: string;
}

export default function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<AppSettings>({
    soundEnabled: true,
    notificationEnabled: true,
    darkMode: false,
    autoSync: true,
    offlineMode: false,
    cacheSize: '0 MB',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshingIP, setIsRefreshingIP] = useState(false);

  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible]);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('app_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      }
      
      // 计算缓存大小
      const cacheSize = await calculateCacheSize();
      setSettings(prev => ({ ...prev, cacheSize }));
    } catch (error) {
      console.error('Load settings error:', error);
    }
  };

  const saveSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      
      // 保存到本地存储（排除 cacheSize）
      const { cacheSize, ...settingsToSave } = updatedSettings;
      await AsyncStorage.setItem('app_settings', JSON.stringify(settingsToSave));
    } catch (error) {
      console.error('Save settings error:', error);
    }
  };

  const calculateCacheSize = async (): Promise<string> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;
      
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += new Blob([value]).size;
        }
      }
      
      const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
      return `${sizeInMB} MB`;
    } catch (error) {
      console.error('Calculate cache size error:', error);
      return '0 MB';
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      '清除缓存',
      '这将清除所有应用缓存数据，但不会影响您的学习记录。确定要继续吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              
              // 获取需要保留的关键数据
              const keysToKeep = [
                'user_data',
                'vocabulary_words',
                'celebration_data',
                'review_schedule',
                'app_settings',
              ];
              
              const allKeys = await AsyncStorage.getAllKeys();
              const keysToRemove = allKeys.filter(key => !keysToKeep.includes(key));
              
              if (keysToRemove.length > 0) {
                await AsyncStorage.multiRemove(keysToRemove);
              }
              
              // 重新计算缓存大小
              const newCacheSize = await calculateCacheSize();
              setSettings(prev => ({ ...prev, cacheSize: newCacheSize }));
              
              Alert.alert('清除成功', '缓存已清除');
            } catch (error) {
              console.error('Clear cache error:', error);
              Alert.alert('清除失败', '请稍后重试');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRefreshIP = async () => {
    try {
      setIsRefreshingIP(true);
      await apiClient.refreshIP();
      Alert.alert('刷新成功', 'IP地址已更新，请重试连接');
    } catch (error) {
      console.error('Refresh IP error:', error);
      Alert.alert('刷新失败', '无法检测到新的IP地址，请检查网络连接');
    } finally {
      setIsRefreshingIP(false);
    }
  };

  const SettingItem = ({ 
    icon: Icon, 
    iconName,
    title, 
    subtitle, 
    value, 
    onValueChange, 
    type = 'switch',
    onPress,
    color = '#666666'
  }: {
    icon: any;
    iconName: string;
    title: string;
    subtitle?: string;
    value?: boolean | string;
    onValueChange?: (value: boolean) => void;
    type?: 'switch' | 'button' | 'info';
    onPress?: () => void;
    color?: string;
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={type === 'button' ? onPress : undefined}
      disabled={type !== 'button'}
      activeOpacity={type === 'button' ? 0.6 : 1}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, { backgroundColor: color + '20' }]}>
          <Icon name={iconName} color={color} size={18} strokeWidth={2} />
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && (
            <Text style={styles.settingSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      
      <View style={styles.settingRight}>
        {type === 'switch' && (
          <Switch
            value={value as boolean}
            onValueChange={onValueChange}
            trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
            thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
          />
        )}
        {type === 'info' && (
          <Text style={styles.settingValue}>{value as string}</Text>
        )}
        {type === 'button' && (
          <Text style={[styles.settingValue, { color }]}>{value as string}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* 头部 */}
          <View style={styles.header}>
            <Text style={styles.title}>设置</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Feather name="x" size={24} color="#666666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* 通用设置 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>通用设置</Text>
              <View style={styles.settingsContainer}>
                <SettingItem
                  icon={Feather}
                  iconName="sound"
                  title="音效"
                  subtitle="开启应用音效和发音"
                  value={settings.soundEnabled}
                  onValueChange={(value) => saveSettings({ soundEnabled: value })}
                  color="#22C55E"
                />
                
                <SettingItem
                  icon={Feather}
                  iconName="bell"
                  title="通知"
                  subtitle="学习提醒和复习通知"
                  value={settings.notificationEnabled}
                  onValueChange={(value) => saveSettings({ notificationEnabled: value })}
                  color="#F59E0B"
                />
                
                <SettingItem
                  icon={Feather}
                  iconName="moon"
                  title="深色模式"
                  subtitle="跟随系统或手动设置"
                  value={settings.darkMode}
                  onValueChange={(value) => saveSettings({ darkMode: value })}
                  color="#8B5CF6"
                />
              </View>
            </View>

            {/* 数据同步 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>数据同步</Text>
              <View style={styles.settingsContainer}>
                <SettingItem
                  icon={Feather}
                  iconName="sync"
                  title="自动同步"
                  subtitle="在WiFi环境下自动同步数据"
                  value={settings.autoSync}
                  onValueChange={(value) => saveSettings({ autoSync: value })}
                  color="#3B82F6"
                />
                
                <SettingItem
                  icon={Feather}
                  iconName="download"
                  title="离线模式"
                  subtitle="优先使用本地数据"
                  value={settings.offlineMode}
                  onValueChange={(value) => saveSettings({ offlineMode: value })}
                  color="#6B7280"
                />
              </View>
            </View>

            {/* 存储管理 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>存储管理</Text>
              <View style={styles.settingsContainer}>
                <SettingItem
                  icon={Feather}
                  iconName="hard-drive"
                  title="缓存大小"
                  subtitle="应用占用的存储空间"
                  value={settings.cacheSize}
                  type="info"
                  color="#10B981"
                />
                
                <SettingItem
                  icon={Feather}
                  iconName="trash"
                  title="清除缓存"
                  subtitle="清除临时文件和缓存数据"
                  value={isLoading ? "清除中..." : "立即清除"}
                  type="button"
                  onPress={handleClearCache}
                  color="#EF4444"
                />
              </View>
            </View>

            {/* 应用信息 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>应用信息</Text>
              <View style={styles.settingsContainer}>
                <SettingItem
                  icon={Feather}
                  iconName="info"
                  title="应用版本"
                  value="1.0.0"
                  type="info"
                  color="#6B7280"
                />
              </View>
            </View>

            {/* 网络连接 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>网络连接</Text>
              <View style={styles.settingsContainer}>
                <SettingItem
                  icon={Feather}
                  iconName="refresh-cw"
                  title="刷新IP地址"
                  subtitle="自动检测并更新后端服务器IP"
                  value={isRefreshingIP ? "检测中..." : "立即刷新"}
                  type="button"
                  onPress={handleRefreshIP}
                  color="#3B82F6"
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111111',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingBottom: 40,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  settingsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111111',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#666666',
  },
  settingRight: {
    alignItems: 'flex-end',
  },
  settingValue: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
});