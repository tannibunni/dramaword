import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import ReviewCard from '@/components/ReviewCard';
import ReviewGuideModal from '@/components/ReviewGuideModal';
import { wordService } from '@/services/wordService';
import { reviewService } from '@/services/reviewService';
import { Word } from '@/types/word';

const { width } = Dimensions.get('window');

export default function ReviewScreen() {
  const [reviewWords, setReviewWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    total: 0,
  });
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [guideData, setGuideData] = useState<any>(null);
  const [todayReviewCount, setTodayReviewCount] = useState(0);
  const [totalWords, setTotalWords] = useState(0);
  
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      loadReviewData();
      checkReviewGuide();
    }, [])
  );

  const loadReviewData = async () => {
    try {
      const words = await reviewService.getTodayReviewWords();
      const stats = await wordService.getStudyStats();
      const todayCount = await reviewService.getTodayReviewCount();
      
      setReviewWords(words);
      setTotalWords(stats.totalWords);
      setTodayReviewCount(todayCount);
      setCurrentIndex(0);
      setSessionStats({ correct: 0, incorrect: 0, total: 0 });
      setIsSessionComplete(false);
    } catch (error) {
      console.error('Load review data error:', error);
    }
  };

  const checkReviewGuide = async () => {
    try {
      const guide = await reviewService.checkReviewGuide();
      if (guide.shouldShow) {
        setGuideData(guide);
        setShowGuide(true);
      }
    } catch (error) {
      console.error('Check review guide error:', error);
    }
  };

  const handleAnswer = async (correct: boolean) => {
    const currentWord = reviewWords[currentIndex];
    
    // 更新单词复习进度
    await reviewService.updateWordReview(currentWord.id, correct);
    
    // 更新会话统计
    setSessionStats(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      incorrect: prev.incorrect + (correct ? 0 : 1),
      total: prev.total + 1,
    }));

    // 移动到下一个单词或完成会话
    if (currentIndex < reviewWords.length - 1) {
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
      }, 500);
    } else {
      setTimeout(() => {
        setIsSessionComplete(true);
        reviewService.recordReviewSession(sessionStats.correct + (correct ? 1 : 0), sessionStats.total + 1);
      }, 500);
    }
  };

  const handleRestartSession = () => {
    loadReviewData();
  };

  const handleStartReview = () => {
    setShowGuide(false);
    if (reviewWords.length === 0) {
      loadReviewData();
    }
  };

  const currentWord = reviewWords[currentIndex];
  const accuracy = sessionStats.total > 0 
    ? Math.round((sessionStats.correct / sessionStats.total) * 100) 
    : 0;

  // 复习完成界面
  if (isSessionComplete) {
    return (
      <View style={styles.container}>
        <View style={[
          styles.completeContainer, 
          { 
            paddingTop: insets.top + 40, 
            paddingBottom: Math.max(insets.bottom + 140, 160) 
          }
        ]}>
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
                  {sessionStats.correct}
                </Text>
                <Text style={styles.sessionStatLabel}>正确</Text>
              </View>
              <View style={styles.sessionStatItem}>
                <Text style={[styles.sessionStatNumber, { color: accuracy >= 70 ? '#22C55E' : '#F59E0B' }]}>
                  {accuracy}%
                </Text>
                <Text style={styles.sessionStatLabel}>准确率</Text>
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
      <View style={styles.container}>
        {/* 头部 */}
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>词汇复习</Text>
            <Text style={styles.headerSubtitle}>巩固记忆，温故知新</Text>
          </View>
        </View>

        {/* 今日复习横幅 */}
        {todayReviewCount > 0 && (
          <View style={styles.todayBanner}>
            <View style={styles.bannerContent}>
              <Feather name="award" color="#F59E0B" size={20} />
              <Text style={styles.bannerText}>
                今天已复习 {todayReviewCount} 个单词
              </Text>
            </View>
          </View>
        )}

        <View style={[
          styles.emptyContainer, 
          { paddingBottom: Math.max(insets.bottom + 140, 160) }
        ]}>
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Feather name="star" color="#CCCCCC" size={48} />
            </View>
            
            <Text style={styles.emptyTitle}>
              {totalWords === 0 ? '还没有单词可复习' : '今日复习已完成'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {totalWords === 0 
                ? '先去查词页面添加一些单词吧！' 
                : '所有单词都已复习完毕\n明天再来继续学习吧！'
              }
            </Text>
            
            <TouchableOpacity style={styles.refreshButton} onPress={loadReviewData}>
              <Feather name="rotate-ccw" color="#FFFFFF" size={20} />
              <Text style={styles.refreshButtonText}>刷新列表</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 复习引导弹窗 */}
        {showGuide && guideData && (
          <ReviewGuideModal
            visible={showGuide}
            onClose={() => setShowGuide(false)}
            onStartReview={handleStartReview}
            guideData={guideData}
          />
        )}
      </View>
    );
  }

  // 主复习界面
  return (
    <View style={styles.container}>
      {/* 头部进度 */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>词汇复习</Text>
          <Text style={styles.headerSubtitle}>
            第 {currentIndex + 1} / {reviewWords.length} 个
          </Text>
          
          <View style={styles.sessionProgressContainer}>
            <View style={styles.sessionProgressBar}>
              <View 
                style={[
                  styles.sessionProgressFill, 
                  { width: `${((currentIndex + 1) / reviewWords.length) * 100}%` }
                ]} 
              />
            </View>
          </View>

          <View style={styles.quickStatsContainer}>
            <View style={styles.quickStatItem}>
              <Feather name="check-circle" color="#22C55E" size={16} />
              <Text style={styles.quickStatText}>{sessionStats.correct}</Text>
            </View>
            <View style={styles.quickStatItem}>
              <Feather name="clock" color="#666666" size={16} />
              <Text style={styles.quickStatText}>{reviewWords.length}</Text>
            </View>
            <View style={styles.quickStatItem}>
              <Feather name="target" color="#3B82F6" size={16} />
              <Text style={styles.quickStatText}>{accuracy}%</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 复习卡片区域 */}
      <View style={[
        styles.reviewContainer, 
        { paddingBottom: Math.max(insets.bottom + 140, 160) }
      ]}>
        <ReviewCard
          word={currentWord}
          onAnswer={handleAnswer}
        />
      </View>

      {/* 复习引导弹窗 */}
      {showGuide && guideData && (
        <ReviewGuideModal
          visible={showGuide}
          onClose={() => setShowGuide(false)}
          onStartReview={handleStartReview}
          guideData={guideData}
        />
      )}
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
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 20,
    fontWeight: '400',
  },
  sessionProgressContainer: {
    width: '100%',
    marginBottom: 16,
  },
  sessionProgressBar: {
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  sessionProgressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  quickStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  quickStatText: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  todayBanner: {
    backgroundColor: '#FEF3C7',
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
    marginLeft: 8,
  },
  reviewContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111111',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  completeContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 40,
    width: width - 48,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  completeIcon: {
    marginBottom: 24,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 8,
    textAlign: 'center',
  },
  completeSubtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 32,
    textAlign: 'center',
  },
  sessionStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 32,
    paddingVertical: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  sessionStatItem: {
    alignItems: 'center',
  },
  sessionStatNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 4,
  },
  sessionStatLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
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
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});