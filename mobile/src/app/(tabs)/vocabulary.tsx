import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import WordCard from '@/components/WordCard';
import { wordService } from '@/services/wordService';
import { Word } from '@/types/word';

const { width, height } = Dimensions.get('window');
const MAX_WORDS = 100; // 用户可以保存的最大单词数

export default function VocabularyScreen() {
  const [words, setWords] = useState<Word[]>([]);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [isCardVisible, setIsCardVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [nextMilestone, setNextMilestone] = useState<{
    count: number;
    remaining: number;
    progress: number;
  } | null>(null);
  
  const insets = useSafeAreaInsets();
  
  // 动画值
  const slideAnim = useState(new Animated.Value(height))[0];
  const overlayOpacity = useState(new Animated.Value(0))[0];

  // 🔥 使用 useFocusEffect 确保每次进入页面都重新加载数据
  useFocusEffect(
    React.useCallback(() => {
      console.log('📱 Vocabulary screen focused, reloading data...');
      loadVocabulary();
      loadNextMilestone();
    }, [])
  );

  const loadVocabulary = async () => {
    try {
      setIsLoading(true);
      console.log('📚 Loading vocabulary from storage...');
      
      const allWords = await wordService.getAllWords();
      console.log(`📊 Loaded ${allWords.length} words from storage`);
      
      setWords(allWords);
    } catch (error) {
      console.error('Load vocabulary error:', error);
      setWords([]); // 确保在错误时清空列表
    } finally {
      setIsLoading(false);
    }
  };

  const loadNextMilestone = async () => {
    try {
      const milestoneInfo = await wordService.getNextMilestoneInfo();
      setNextMilestone(milestoneInfo);
    } catch (error) {
      console.error('Load next milestone error:', error);
    }
  };

  const handleWordPress = (word: Word) => {
    setSelectedWord(word);
    setIsCardVisible(true);
    
    // 执行进入动画
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleCloseCard = () => {
    // 执行退出动画
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsCardVisible(false);
      setSelectedWord(null);
    });
  };

  // 计算进度
  const currentCount = words.length;
  const progressPercentage = Math.min((currentCount / MAX_WORDS) * 100, 100);
  const isNearLimit = currentCount >= MAX_WORDS * 0.8; // 80% 时显示警告
  const isAtLimit = currentCount >= MAX_WORDS;

  const renderProgressSection = () => (
    <View style={styles.progressSection}>
      <View style={styles.progressHeader}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressTitle}>学习进度</Text>
          <View style={styles.progressCount}>
            <Text style={[
              styles.currentCount, 
              isAtLimit && styles.currentCountLimit
            ]}>
              {currentCount}
            </Text>
            <Text style={styles.maxCount}>/{MAX_WORDS}</Text>
          </View>
        </View>
        
        <View style={styles.progressIcon}>
          {isAtLimit ? (
            <Feather name="award" size={20} color="#F59E0B" />
          ) : (
            <Feather name="target" size={20} color="#3B82F6" />
          )}
        </View>
      </View>

      {/* 进度条 */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarTrack}>
          <View 
            style={[
              styles.progressBarFill, 
              { 
                width: `${progressPercentage}%`,
                backgroundColor: isAtLimit ? '#F59E0B' : 
                                isNearLimit ? '#F97316' : '#3B82F6'
              }
            ]} 
          />
        </View>
        <Text style={[
          styles.progressPercentage,
          isAtLimit && styles.progressPercentageLimit
        ]}>
          {Math.round(progressPercentage)}%
        </Text>
      </View>

      {/* 🎯 下一个里程碑提示 */}
      {nextMilestone && (
        <View style={styles.milestoneHint}>
          <View style={styles.milestoneHintContent}>
            <Feather name="award" size={16} color="#F59E0B" />
            <Text style={styles.milestoneHintText}>
              再收录 {nextMilestone.remaining} 个单词达成下一里程碑！
            </Text>
          </View>
          <View style={styles.milestoneProgress}>
            <View style={styles.milestoneProgressTrack}>
              <View 
                style={[
                  styles.milestoneProgressFill,
                  { width: `${nextMilestone.progress}%` }
                ]}
              />
            </View>
            <Text style={styles.milestoneProgressText}>
              {nextMilestone.count} 词目标
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderWordItem = ({ item }: { item: Word }) => (
    <TouchableOpacity
      style={styles.wordItem}
      onPress={() => handleWordPress(item)}
      activeOpacity={0.6}
    >
      <View style={styles.wordContent}>
        <View style={styles.wordInfo}>
          <Text style={styles.wordText}>{item.word}</Text>
          <Text style={styles.translationText} numberOfLines={1}>
            {item.chineseTranslations.join(' · ')}
          </Text>
        </View>
        
        <View style={styles.wordMeta}>
          {item.audioUrl && (
            <View style={styles.audioIndicator}>
              <Feather name="volume-2" size={14} color="#666666" />
            </View>
          )}
          
          <View style={[
            styles.difficultyBadge,
            item.difficulty >= 4 && styles.difficultyBadgeHard
          ]}>
            <Text style={[
              styles.difficultyText,
              item.difficulty >= 4 && styles.difficultyTextHard
            ]}>
              {item.difficulty === 1 ? '基础' : 
               item.difficulty === 2 ? '简单' :
               item.difficulty === 3 ? '中等' :
               item.difficulty === 4 ? '困难' : '高级'}
            </Text>
          </View>
          
          <Feather name="chevron-right" size={16} color="#CCCCCC" />
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
      {/* 进度条区域 */}
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
          keyExtractor={(item) => item.id}
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
                  onWordSaved={() => {
                    // 单词已在列表中，不需要额外操作
                  }}
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
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 8,
  },
  progressCount: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currentCount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#3B82F6',
    letterSpacing: -1,
  },
  currentCountLimit: {
    color: '#F59E0B',
  },
  maxCount: {
    fontSize: 18,
    fontWeight: '500',
    color: '#999999',
    marginLeft: 2,
  },
  progressIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    minWidth: 40,
    textAlign: 'right',
  },
  progressPercentageLimit: {
    color: '#F59E0B',
  },

  // 🎯 里程碑提示样式
  milestoneHint: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  milestoneHintContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  milestoneHintText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  milestoneProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  milestoneProgressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#FDE68A',
    borderRadius: 3,
    marginRight: 12,
    overflow: 'hidden',
  },
  milestoneProgressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  milestoneProgressText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
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
  difficultyBadge: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  difficultyBadgeHard: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  difficultyText: {
    fontSize: 11,
    color: '#0369A1',
    fontWeight: '600',
  },
  difficultyTextHard: {
    color: '#D97706',
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