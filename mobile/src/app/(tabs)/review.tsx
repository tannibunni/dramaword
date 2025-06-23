import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import ReviewCard from '@/components/ReviewCard';
import { wordService } from '@/services/wordService';
import { reviewService } from '@/services/reviewService';
import { IWord } from '@/types/word';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const REVIEW_SESSION_KEY = 'review_session_state';

const saveSessionState = async (state: any) => {
  try {
    await AsyncStorage.setItem(REVIEW_SESSION_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save review session:', e);
  }
};

const loadSessionState = async () => {
  try {
    const data = await AsyncStorage.getItem(REVIEW_SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Failed to load review session:', e);
    return null;
  }
};

const clearSessionState = async () => {
  try {
    await AsyncStorage.removeItem(REVIEW_SESSION_KEY);
  } catch (e) {
    console.error('Failed to clear review session:', e);
  }
};

export default function ReviewScreen() {
  const [reviewWords, setReviewWords] = useState<IWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    remembered: 0,
    forgotten: 0,
    total: 0,
  });
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      loadReviewData();
    }, [])
  );

  const loadReviewData = async () => {
    try {
      setIsLoading(true);
      // 优先尝试恢复本地进度
      const saved = await loadSessionState();
      if (saved && Array.isArray(saved.reviewWords) && saved.reviewWords.length > 0) {
        setReviewWords(saved.reviewWords);
        setCurrentIndex(saved.currentIndex);
        setSessionStats(saved.sessionStats);
        setIsSessionComplete(saved.isSessionComplete);
        setIsLoading(false);
        return;
      }
      // 否则初始化新会话
      await reviewService.startStudySession();
      const words = await wordService.getAllWords();
      setReviewWords(words);
      setCurrentIndex(0);
      setSessionStats({ remembered: 0, forgotten: 0, total: 0 });
      setIsSessionComplete(false);
      // 保存初始状态
      await saveSessionState({
        reviewWords: words,
        currentIndex: 0,
        sessionStats: { remembered: 0, forgotten: 0, total: 0 },
        isSessionComplete: false,
      });
    } catch (error) {
      console.error('Load review data error:', error);
      Alert.alert('加载失败', '无法加载复习数据');
    } finally {
      setIsLoading(false);
    }
  };

  // 保存当前进度
  const persistSession = async (
    nextIndex = currentIndex,
    nextStats = sessionStats,
    nextComplete = isSessionComplete,
    nextWords = reviewWords
  ) => {
    await saveSessionState({
      reviewWords: nextWords,
      currentIndex: nextIndex,
      sessionStats: nextStats,
      isSessionComplete: nextComplete,
    });
  };

  const handleSwipeRight = async () => {
    // 右滑 - 记得
    const currentWord = reviewWords[currentIndex];
    await handleWordReview(currentWord, true);
  };

  const handleSwipeLeft = async () => {
    // 左滑 - 忘记
    const currentWord = reviewWords[currentIndex];
    await handleWordReview(currentWord, false);
  };

  const handleWordReview = async (word: IWord, remembered: boolean) => {
    try {
      console.log('Reviewing:', word.word, 'remembered:', remembered, 'index:', currentIndex, '-> nextindex:', currentIndex + 1, 'total:', reviewWords.length);
      
      // 调用复习服务记录结果
      await reviewService.recordWordReview(word._id, remembered);
    
    // 更新会话统计
      setSessionStats(prev => {
        const newStats = {
          remembered: prev.remembered + (remembered ? 1 : 0),
          forgotten: prev.forgotten + (remembered ? 0 : 1),
      total: prev.total + 1,
        };
        // 先保存新统计
        persistSession(currentIndex + 1, newStats, currentIndex + 1 >= reviewWords.length, reviewWords);
        return newStats;
      });

      // 简化：直接更新索引
      const nextIndex = currentIndex + 1;
      
      if (nextIndex < reviewWords.length) {
        console.log('Force Update:', nextIndex, '| Current Index:', currentIndex);
        console.log('Current Word:', reviewWords[nextIndex]?.word);
        setCurrentIndex(nextIndex);
    } else {
        setIsSessionComplete(true);
        await clearSessionState(); // 复习完成后清除
      }
    } catch (error) {
      console.error('Record word review error:', error);
      Alert.alert('记录失败', '无法保存复习结果');
    }
  };

  const handleRestartSession = () => {
    clearSessionState();
    loadReviewData();
  };

  const handleSkipWord = () => {
    if (currentIndex < reviewWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
      persistSession(currentIndex + 1, sessionStats, isSessionComplete, reviewWords);
    }
  };

  // 每次currentIndex/sessionStats变化时自动保存
  useEffect(() => {
    if (!isSessionComplete && reviewWords.length > 0) {
      persistSession(currentIndex, sessionStats, isSessionComplete, reviewWords);
    }
  }, [currentIndex, sessionStats, isSessionComplete, reviewWords]);

  // 当复习完成时结束会话
  useEffect(() => {
    if (isSessionComplete) {
      const endSession = async () => {
        try {
          const session = await reviewService.endStudySession();
          if (session) {
            console.log('📊 Session completed:', {
              totalWords: session.totalWords,
              correctWords: session.correctWords,
              accuracy: session.accuracy,
            });
          }
        } catch (error) {
          console.error('End session error:', error);
        }
      };
      endSession();
    }
  }, [isSessionComplete]);

  // 加载状态
  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Feather name="loader" size={32} color="#6B7280" />
          <Text style={styles.loadingText}>加载复习内容...</Text>
        </View>
      </View>
    );
  }

  // 复习完成界面
  if (isSessionComplete) {
    const accuracy = sessionStats.total > 0 
      ? Math.round((sessionStats.remembered / sessionStats.total) * 100) 
      : 0;

    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.completeContainer}>
          <View style={styles.completeContent}>
            <View style={styles.completeIcon}>
              <Feather name="check-circle" color="#22C55E" size={80} />
            </View>
            
            <Text style={styles.completeTitle}>复习完成！</Text>
            <Text style={styles.completeSubtitle}>
              {accuracy >= 80 ? "表现出色！" : 
               accuracy >= 60 ? "继续努力！" : "需要加强练习"}
            </Text>

            <View style={styles.sessionStatsContainer}>
              <View style={styles.sessionStatItem}>
                <Text style={styles.sessionStatNumber}>{sessionStats.total}</Text>
                <Text style={styles.sessionStatLabel}>总计</Text>
              </View>
              <View style={styles.sessionStatItem}>
                <Text style={[styles.sessionStatNumber, { color: '#22C55E' }]}>
                  {sessionStats.remembered}
                </Text>
                <Text style={styles.sessionStatLabel}>记得</Text>
              </View>
              <View style={styles.sessionStatItem}>
                <Text style={[styles.sessionStatNumber, { color: '#EF4444' }]}>
                  {sessionStats.forgotten}
                </Text>
                <Text style={styles.sessionStatLabel}>忘记</Text>
              </View>
            </View>

            <View style={styles.completeActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleRestartSession}>
                <Feather name="rotate-ccw" color="#FFFFFF" size={20} />
                <Text style={styles.actionButtonText}>再来一轮</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // 无复习内容界面
  if (reviewWords.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
            <Text style={styles.headerTitle}>词汇复习</Text>
          <Text style={styles.headerSubtitle}>滑动卡片，巩固记忆</Text>
        </View>

        <View style={styles.emptyContainer}>
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Feather name="book-open" color="#CCCCCC" size={48} />
            </View>
            
            <Text style={styles.emptyTitle}>还没有单词可复习</Text>
            <Text style={styles.emptySubtitle}>
              先去查词页面添加一些单词吧！
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const currentWord = reviewWords[currentIndex];
  const progress = ((currentIndex + 1) / reviewWords.length) * 100;

  // 调试信息
  console.log('Rendering ReviewCard:', {
    currentIndex,
    currentWord: currentWord?.word,
    totalWords: reviewWords.length,
    progress
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 头部 */}
      <View style={styles.header}>
          <Text style={styles.headerTitle}>词汇复习</Text>
          <Text style={styles.headerSubtitle}>
          {currentIndex + 1} / {reviewWords.length}
          </Text>
      </View>

      {/* 进度条 */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>

      {/* 统计信息 */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Feather name="check" size={16} color="#22C55E" />
          <Text style={[styles.statText, { color: '#22C55E' }]}>
            {sessionStats.remembered}
          </Text>
            </View>
        <View style={styles.statItem}>
          <Feather name="x" size={16} color="#EF4444" />
          <Text style={[styles.statText, { color: '#EF4444' }]}>
            {sessionStats.forgotten}
          </Text>
        </View>
      </View>

      {/* 滑动卡片 */}
      <View style={styles.cardContainer}>
        <ReviewCard
          key={`${currentWord._id}-${currentIndex}`}
          word={{
            id: currentWord._id,
            word: currentWord.word,
            translation: currentWord.meanings.map(m => m.definitionCn).filter(Boolean).join('；'),
            example: currentWord.meanings[0]?.example,
            phonetic: currentWord.pronunciation,
          }}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          isActive={true}
        />
      </View>

      {/* 底部操作按钮 */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkipWord}>
          <Feather name="skip-forward" size={20} color="#6B7280" />
          <Text style={styles.skipButtonText}>跳过</Text>
        </TouchableOpacity>
        
        {/* 测试按钮 */}
        <TouchableOpacity 
          style={styles.testButton} 
          onPress={() => {
            if (currentIndex < reviewWords.length - 1) {
              setCurrentIndex(currentIndex + 1);
            }
          }}
        >
          <Text style={styles.testButtonText}>测试下一张</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  statText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  bottomActions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  testButtonText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  completeContent: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  completeIcon: {
    marginBottom: 24,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  completeSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  sessionStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 32,
  },
  sessionStatItem: {
    alignItems: 'center',
  },
  sessionStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  sessionStatLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  completeActions: {
    width: '100%',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  emptyIcon: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});