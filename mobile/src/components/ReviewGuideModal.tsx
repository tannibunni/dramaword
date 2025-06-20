import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

interface ReviewGuideModalProps {
  visible: boolean;
  onClose: () => void;
  onStartReview: () => void;
  guideData: {
    type: 'first_milestone' | 'daily_reminder' | 'streak_bonus';
    title: string;
    message: string;
    wordCount: number;
    reviewCount: number;
    streak?: number;
  };
}

const { width, height } = Dimensions.get('window');

export default function ReviewGuideModal({ visible, onClose, onStartReview, guideData }: ReviewGuideModalProps) {
  const [slideAnimation] = useState(new Animated.Value(height));
  const [scaleAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(slideAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnimation, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnimation.setValue(height);
      scaleAnimation.setValue(0);
    }
  }, [visible]);

  const getGuideIcon = () => {
    switch (guideData.type) {
      case 'first_milestone':
        return <Feather name="award" size={48} color="white" />;
      case 'daily_reminder':
        return <Feather name="book" size={48} color="white" />;
      case 'streak_bonus':
        return <Feather name="fire" size={48} color="white" />;
      default:
        return <Feather name="book" size={48} color="white" />;
    }
  };

  const getGradientColors = () => {
    switch (guideData.type) {
      case 'first_milestone':
        return ['#F59E0B', '#D97706', '#B45309'];
      case 'daily_reminder':
        return ['#3B82F6', '#1D4ED8', '#1E40AF'];
      case 'streak_bonus':
        return ['#8B5CF6', '#7C3AED', '#6D28D9'];
      default:
        return ['#22C55E', '#16A34A', '#15803D'];
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnimation }],
            },
          ]}
        >
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBackground}
          >
            {/* 关闭按钮 */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Feather name="x" size={20} color="white" />
            </TouchableOpacity>

            {/* 图标 */}
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  transform: [{ scale: scaleAnimation }],
                },
              ]}
            >
              <View style={styles.iconBackground}>
                {getGuideIcon()}
              </View>
            </Animated.View>

            {/* 标题和消息 */}
            <View style={styles.contentContainer}>
              <Text style={styles.title}>{guideData.title}</Text>
              <Text style={styles.message}>{guideData.message}</Text>
            </View>

            {/* 统计信息 */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{guideData.wordCount}</Text>
                <Text style={styles.statLabel}>个单词</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{guideData.reviewCount}</Text>
                <Text style={styles.statLabel}>待复习</Text>
              </View>
              {guideData.streak && (
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{guideData.streak}</Text>
                  <Text style={styles.statLabel}>连续天</Text>
                </View>
              )}
            </View>

            {/* 操作按钮 */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.laterButton} onPress={onClose}>
                <Text style={styles.laterButtonText}>以后再说</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.startButton} onPress={onStartReview}>
                <Text style={styles.startButtonText}>立即复习</Text>
                <Feather name="arrow-right" size={18} color="white" />
              </TouchableOpacity>
            </View>

            {/* 提示文案 */}
            <View style={styles.hintContainer}>
              <Text style={styles.hintText}>
                {guideData.type === 'first_milestone' 
                  ? '🎯 你现在已经有一个迷你词库啦，要不要来复习一下？'
                  : guideData.type === 'daily_reminder'
                  ? '📚 今天学了新词，花1分钟复习一下吧！'
                  : '🔥 你太棒了！来挑战一下记忆小测验？'
                }
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width - 40,
    maxWidth: 380,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  gradientBackground: {
    padding: 32,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconBackground: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  contentContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  laterButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 14,
    borderRadius: 10,
    marginRight: 8,
    alignItems: 'center',
  },
  laterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  startButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 14,
    borderRadius: 10,
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginRight: 6,
  },
  hintContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    width: '100%',
  },
  hintText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
});