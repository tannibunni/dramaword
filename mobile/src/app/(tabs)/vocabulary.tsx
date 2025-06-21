import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity, Dimensions, Animated, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import WordCard from '@/components/WordCard';
import AchievementBadge from '@/components/AchievementBadge';
import { wordService } from '@/services/wordService';
import { IWord } from '@/types/word';

const { width, height } = Dimensions.get('window');
const MAX_WORDS = 100; // 用户可以保存的最大单词数

// 定义徽章里程碑
const MILESTONES = [
  { count: 10, level: 0 },
  { count: 20, level: 1 },
  { count: 50, level: 2 },
  { count: 100, level: 3 },
  { count: 200, level: 4 },
  { count: 500, level: 5 },
];

export default function VocabularyScreen() {
  const [words, setWords] = useState<IWord[]>([]);
  const [selectedWord, setSelectedWord] = useState<IWord | null>(null);
  const [isCardVisible, setIsCardVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const insets = useSafeAreaInsets();
  
  const slideAnim = useState(new Animated.Value(height))[0];
  const overlayOpacity = useState(new Animated.Value(0))[0];

  useFocusEffect(
    React.useCallback(() => {
      console.log('📱 Vocabulary screen focused, reloading data...');
      loadVocabulary();
    }, [])
  );

  const loadVocabulary = async () => {
    try {
      setIsLoading(true);
      console.log('📚 Loading vocabulary from storage...');
      
      const allWords = await wordService.getAllWords();
      
      if (Array.isArray(allWords)) {
        const validWords = allWords.filter(word => word && word._id && word.word);
        console.log(`📊 Loaded ${validWords.length} valid words from storage`);
        setWords(validWords);
      } else {
        console.warn('loadVocabulary: wordService.getAllWords() did not return an array.');
        setWords([]);
      }
    } catch (error) {
      console.error('Load vocabulary error:', error);
      setWords([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWordPress = (word: IWord) => {
    setSelectedWord(word);
    setIsCardVisible(true);
    
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(overlayOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const handleCloseCard = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: height, duration: 250, useNativeDriver: true }),
      Animated.timing(overlayOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setIsCardVisible(false);
      setSelectedWord(null);
    });
  };

  const handleWordSaved = (savedWord: IWord) => {
    console.log(`🔄 Vocabulary list received save event for: ${savedWord.word}`);
    loadVocabulary();
    handleCloseCard();
  };

  const renderProgressSection = () => {
    const currentCount = words.length;
    const nextMilestone = MILESTONES.find(m => currentCount < m.count) || MILESTONES[MILESTONES.length - 1];
    const prevMilestoneCount = MILESTONES.slice().reverse().find(m => currentCount >= m.count)?.count || 0;
    const progressTowardNext = nextMilestone.count - prevMilestoneCount;
    const userProgress = currentCount - prevMilestoneCount;
    const progressPercentage = progressTowardNext > 0 ? Math.min((userProgress / progressTowardNext) * 100, 100) : (currentCount >= nextMilestone.count ? 100 : 0);

    return (
      <View style={styles.progressSection}>
        <Text style={styles.progressTitle}>学习进度</Text>
        <View style={styles.progressDisplay}>
          <View style={styles.progressCount}>
            <Text style={styles.currentCount}>{currentCount}</Text>
            <Text style={styles.maxCount}>/ {nextMilestone.count}</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarTrack}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${progressPercentage}%` }
                ]} 
              />
            </View>
          </View>
        </View>
        
        <View style={styles.achievementsSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.achievementsScroll}>
            {MILESTONES.map((milestone) => (
              <AchievementBadge
                key={milestone.level}
                level={milestone.level}
                count={milestone.count}
                achieved={words.length >= milestone.count}
                size={75}
              />
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  const renderWordItem = ({ item }: { item: IWord }) => (
    <TouchableOpacity
      style={styles.wordItem}
      onPress={() => handleWordPress(item)}
      activeOpacity={0.6}
    >
      <View style={styles.wordContent}>
        <View style={styles.wordInfo}>
          <Text style={styles.wordText}>{item.word}</Text>
          <Text style={styles.translationText} numberOfLines={1}>
            {item.meanings && item.meanings.length > 0 
              ? item.meanings.map(m => m.definitionCn).filter(Boolean).join(' · ')
              : '暂无释义'
            }
          </Text>
        </View>
        
        <View style={styles.wordMeta}>
          {item.audioUrl && (
            <View style={styles.audioIndicator}>
              <Feather name="volume-2" size={14} color="#666666" />
            </View>
          )}
          
          <View style={styles.difficultyIndicator}>
            <Text style={styles.difficultyText}>
              {item.difficulty || 1}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyCard}>
        <View style={styles.emptyIcon}>
          <Feather name="book-open" size={32} color="#CCCCCC" />
        </View>
        
        <Text style={styles.emptyTitle}>单词表为空</Text>
        <Text style={styles.emptySubtitle}>
          在查词页面搜索单词并保存到单词表
        </Text>
        
        <View style={styles.emptyHint}>
          <Feather name="search" size={16} color="#999999" />
          <Text style={styles.emptyHintText}>去查词页面添加单词</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {renderProgressSection()}

      {/* 单词列表 */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      ) : words.length > 0 ? (
        <FlatList
          data={words}
          renderItem={renderWordItem}
          keyExtractor={(item) => item._id}
          style={styles.wordsList}
          contentContainerStyle={[
            styles.wordsListContent,
            { paddingBottom: Math.max(insets.bottom + 140, 160) }
          ]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          scrollEnabled={!isCardVisible} // 当卡片显示时禁用滚动
          // 🔥 添加刷新控制
          extraData={words.length} // 确保列表在数据变化时重新渲染
        />
      ) : (
        renderEmptyState()
      )}

      {/* 悬浮单词卡片 */}
      {isCardVisible && (
        <>
          {/* 半透明背景遮罩 */}
          <Animated.View 
            style={[
              styles.overlay,
              {
                opacity: overlayOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.3],
                }),
              }
            ]}
          >
            <TouchableOpacity 
              style={styles.overlayTouchable}
              onPress={handleCloseCard}
              activeOpacity={1}
            />
          </Animated.View>

          {/* 悬浮单词卡片容器 */}
          <Animated.View 
            style={[
              styles.floatingCardContainer,
              {
                opacity: overlayOpacity,
                transform: [{ 
                  translateY: slideAnim.interpolate({
                    inputRange: [0, height],
                    outputRange: [0, height],
                  })
                }],
                top: insets.top + 80,
              }
            ]}
          >
            {/* 单词卡片 */}
            <View style={styles.floatingCardContent}>
              {selectedWord && (
                <WordCard
                  word={selectedWord}
                  showAnswer={true} // 直接显示背面内容
                  onWordSaved={handleWordSaved}
                />
              )}
            </View>
          </Animated.View>

          {/* 关闭按钮 */}
          <Animated.View 
            style={[
              styles.closeButtonContainer,
              {
                opacity: overlayOpacity,
                top: insets.top + 40,
              }
            ]}
          >
            <TouchableOpacity
              onPress={handleCloseCard}
              style={styles.closeButton}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Feather name="x" size={24} color="#666666" />
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  
  achievementsSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderColor: '#F3F4F6',
    paddingTop: 16,
  },
  achievementsScroll: {
    paddingHorizontal: 4,
  },

  // 进度条样式
  progressSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 16,
  },
  progressDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
  },
  progressCount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginRight: 12,
  },
  currentCount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -1,
  },
  maxCount: {
    fontSize: 18,
    fontWeight: '500',
    color: '#9CA3AF',
    marginLeft: 4,
    marginBottom: 2,
  },
  progressBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  wordsList: {
    flex: 1,
  },
  wordsListContent: {
    paddingVertical: 16,
  },
  wordItem: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  wordContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 72,
  },
  wordInfo: {
    flex: 1,
    marginRight: 16,
  },
  wordText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  translationText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '400',
    lineHeight: 20,
  },
  wordMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  audioIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  difficultyIndicator: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  difficultyText: {
    fontSize: 11,
    color: '#0369A1',
    fontWeight: '600',
  },
  separator: {
    height: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyHintText: {
    fontSize: 12,
    color: '#999999',
    marginLeft: 6,
    fontWeight: '500',
  },

  // 覆盖层样式
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 1)',
    zIndex: 1000,
  },
  overlayTouchable: {
    flex: 1,
  },

  // 悬浮卡片容器样式
  floatingCardContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1001,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  
  // 悬浮卡片内容样式
  floatingCardContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    maxHeight: height * 0.75,
    overflow: 'hidden',
  },
  
  // 关闭按钮
  closeButtonContainer: {
    position: 'absolute',
    right: 24,
    zIndex: 1002,
  },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
});