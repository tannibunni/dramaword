import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

interface CelebrationModalProps {
  visible: boolean;
  onClose: () => void;
  milestone: {
    count: number;
    title: string;
    description: string;
    icon: 'trophy' | 'star' | 'book' | 'target';
    color: string;
    isSpecial?: boolean;
  };
  stats: {
    totalWords: number;
    improvement: number;
    streak: number;
  };
}

const { width, height } = Dimensions.get('window');

export default function CelebrationModal({ visible, onClose, milestone, stats }: CelebrationModalProps) {
  const [confettiAnimation] = useState(new Animated.Value(0));
  const [scaleAnimation] = useState(new Animated.Value(0));
  const [slideAnimation] = useState(new Animated.Value(height));

  useEffect(() => {
    if (visible) {
      // 启动庆祝动画序列
      Animated.sequence([
        // 1. 弹窗滑入
        Animated.timing(slideAnimation, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        // 2. 图标缩放
        Animated.spring(scaleAnimation, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        // 3. 彩带动画
        Animated.timing(confettiAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // 重置动画
      confettiAnimation.setValue(0);
      scaleAnimation.setValue(0);
      slideAnimation.setValue(height);
    }
  }, [visible]);

  const getIcon = () => {
    const iconProps = { size: 64, color: '#FFFFFF', strokeWidth: 2 };
    switch (milestone.icon) {
      case 'trophy': return <Feather name="trophy" {...iconProps} />;
      case 'star': return <Feather name="star" {...iconProps} />;
      case 'book': return <Feather name="book" {...iconProps} />;
      case 'target': return <Feather name="target" {...iconProps} />;
      default: return <Feather name="trophy" {...iconProps} />;
    }
  };

  const getCelebrationMessage = () => {
    const messages = [
      "太棒了！词汇量又上新台阶！",
      "坚持学习，收获满满！",
      "你的努力正在开花结果！",
      "词汇大师之路，稳步前进！",
      "每个单词都是进步的见证！"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const handleShare = () => {
    // 分享功能实现
    console.log('分享成就');
  };

  // 彩带粒子组件
  const ConfettiParticle = ({ delay, color }: { delay: number; color: string }) => {
    const particleAnimation = useState(new Animated.Value(0))[0];
    
    useEffect(() => {
      if (visible) {
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(particleAnimation, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    }, [visible]);

    return (
      <Animated.View
        style={[
          styles.confettiParticle,
          {
            backgroundColor: color,
            transform: [
              {
                translateY: particleAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, height + 50],
                }),
              },
              {
                rotate: particleAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
            opacity: particleAnimation.interpolate({
              inputRange: [0, 0.1, 0.9, 1],
              outputRange: [0, 1, 1, 0],
            }),
          },
        ]}
      />
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* 彩带动画 */}
        {visible && (
          <View style={styles.confettiContainer}>
            {Array.from({ length: 20 }).map((_, index) => (
              <ConfettiParticle
                key={index}
                delay={index * 100}
                color={['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][index % 5]}
              />
            ))}
          </View>
        )}

        {/* 主要庆祝弹窗 */}
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnimation }],
            },
          ]}
        >
          <LinearGradient
            colors={milestone.isSpecial 
              ? ['#FF6B6B', '#FF8E53', '#FF6B9D'] 
              : [milestone.color, '#667eea', '#764ba2']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBackground}
          >
            {/* 关闭按钮 */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Feather name="x" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* 庆祝标题 */}
            <View style={styles.header}>
              <Text style={styles.celebrationTitle}>🎉 恭喜达成里程碑！</Text>
              <Text style={styles.celebrationSubtitle}>{getCelebrationMessage()}</Text>
            </View>

            {/* 成就图标 */}
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  transform: [{ scale: scaleAnimation }],
                },
              ]}
            >
              <View style={styles.iconBackground}>
                {getIcon()}
                {milestone.isSpecial && (
                  <View style={styles.sparkleContainer}>
                    <Feather name="star" size={20} color="#FFD700" style={styles.sparkle1} />
                    <Feather name="star" size={16} color="#FFD700" style={styles.sparkle2} />
                    <Feather name="star" size={18} color="#FFD700" style={styles.sparkle3} />
                  </View>
                )}
              </View>
            </Animated.View>

            {/* 里程碑信息 */}
            <View style={styles.milestoneInfo}>
              <Text style={styles.milestoneTitle}>{milestone.title}</Text>
              <Text style={styles.milestoneDescription}>{milestone.description}</Text>
              <Text style={styles.milestoneCount}>已收录 {milestone.count} 个单词！</Text>
            </View>

            {/* 统计信息 */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.totalWords}</Text>
                <Text style={styles.statLabel}>总词汇</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>+{stats.improvement}%</Text>
                <Text style={styles.statLabel}>提升</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.streak}</Text>
                <Text style={styles.statLabel}>连续天数</Text>
              </View>
            </View>

            {/* 激励文案 */}
            <View style={styles.encouragementContainer}>
              <Text style={styles.encouragementText}>
                {milestone.count < 50 ? "继续加油，下一个里程碑等着你！" :
                 milestone.count < 100 ? "你已经是词汇达人了！" :
                 milestone.count < 500 ? "词汇大师级别，令人敬佩！" :
                 "传奇级词汇收藏家，太厉害了！"}
              </Text>
            </View>

            {/* 操作按钮 */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.continueButton} onPress={onClose}>
                <Text style={styles.continueButtonText}>继续学习</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <Feather name="share" size={18} color="#FFFFFF" />
                <Text style={styles.shareButtonText}>分享成就</Text>
              </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  confettiParticle: {
    position: 'absolute',
    width: 8,
    height: 8,
    left: Math.random() * width,
    top: -50,
  },
  modalContainer: {
    width: width - 40,
    maxWidth: 400,
    borderRadius: 24,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  celebrationTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  celebrationSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  iconContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  sparkleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sparkle1: {
    position: 'absolute',
    top: 10,
    right: 15,
  },
  sparkle2: {
    position: 'absolute',
    bottom: 15,
    left: 10,
  },
  sparkle3: {
    position: 'absolute',
    top: 30,
    left: 20,
  },
  milestoneInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  milestoneTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  milestoneDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 12,
  },
  milestoneCount: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
    paddingVertical: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  encouragementContainer: {
    marginBottom: 32,
  },
  encouragementText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  continueButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 16,
    borderRadius: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  shareButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    borderRadius: 12,
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});