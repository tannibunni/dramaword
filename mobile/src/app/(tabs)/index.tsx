import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Text, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import SearchBar from '@/components/SearchBar';
import WordCard from '@/components/WordCard';
import CelebrationModal from '@/components/CelebrationModal';
import { wordService } from '@/services/wordService';
import { Word } from '@/types/word';

export default function SearchScreen() {
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 🎉 庆祝相关状态
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{
    milestone: any;
    stats: any;
  } | null>(null);
  
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      setCurrentWord(null);
      setError(null);
    }, [])
  );

  const handleWordSearch = async (word: string) => {
    if (!word.trim()) return;

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Searching for word:', word);
      const wordData = await wordService.fetchWordFullData(word.trim());
      
      if (wordData && wordData.word) {
        setCurrentWord(wordData);
        console.log('✅ Word found:', wordData.word);
        
        // 🎉 检查是否需要庆祝
        const celebrationResult = await wordService.checkAndTriggerCelebration();
        if (celebrationResult.shouldCelebrate) {
          setCelebrationData({
            milestone: celebrationResult.milestone,
            stats: celebrationResult.stats,
          });
          setShowCelebration(true);
        }
      } else {
        setError(`抱歉，未找到单词 "${word}" 的详细释义`);
        setCurrentWord(null);
      }
    } catch (error) {
      console.error('❌ Word search error:', error);
      setError('搜索失败，请检查网络连接后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAudioPlay = () => {
    // Audio will be handled by the AudioPlayer component within WordCard
  };

  const handleCelebrationClose = () => {
    setShowCelebration(false);
    setCelebrationData(null);
  };

  return (
    <View style={styles.container}>
      {/* 极简头部 */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>词汇查询</Text>
            <Text style={styles.subtitle}>智能 · 多源 · 精准</Text>
          </View>
          
          <View style={styles.statusIndicator}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>在线</Text>
          </View>
        </View>
      </View>

      {/* 搜索区域 */}
      <View style={styles.searchSection}>
        <SearchBar onWordSelect={handleWordSearch} />
      </View>

      {/* 内容区域 */}
      <ScrollView 
        style={styles.contentContainer}
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingBottom: Math.max(insets.bottom + 140, 160) }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#111111" />
              <Text style={styles.loadingTitle}>正在查询</Text>
              <Text style={styles.loadingSubtext}>
                多源数据聚合中...
              </Text>
              
              <View style={styles.sourceIndicators}>
                <View style={styles.sourceItem}>
                  <Feather name="database" size={14} color="#666666" />
                  <Text style={styles.sourceText}>有道词典</Text>
                </View>
                <View style={styles.sourceItem}>
                  <Feather name="search" size={14} color="#666666" />
                  <Text style={styles.sourceText}>Free Dictionary</Text>
                </View>
                <View style={styles.sourceItem}>
                  <Feather name="cpu" size={14} color="#666666" />
                  <Text style={styles.sourceText}>AI 补全</Text>
                </View>
              </View>
            </View>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>查询失败</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          </View>
        ) : currentWord ? (
          <View style={styles.wordContainer}>
            <WordCard 
              word={currentWord} 
              onAudioPlay={handleAudioPlay}
            />
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Feather name="star" size={32} color="#CCCCCC" />
              </View>
              
              <Text style={styles.emptyTitle}>开始探索</Text>
              <Text style={styles.emptySubtitle}>
                输入英文单词或中文释义
              </Text>
              
              <View style={styles.featureGrid}>
                <View style={styles.featureItem}>
                  <Feather name="database" size={16} color="#999999" />
                  <Text style={styles.featureText}>多源聚合</Text>
                </View>
                <View style={styles.featureItem}>
                  <Feather name="cpu" size={16} color="#999999" />
                  <Text style={styles.featureText}>AI 增强</Text>
                </View>
                <View style={styles.featureItem}>
                  <Feather name="search" size={16} color="#999999" />
                  <Text style={styles.featureText}>智能搜索</Text>
                </View>
                <View style={styles.featureItem}>
                  <Feather name="star" size={16} color="#999999" />
                  <Text style={styles.featureText}>结构化</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 🎉 庆祝弹窗 */}
      {showCelebration && celebrationData && (
        <CelebrationModal
          visible={showCelebration}
          onClose={handleCelebrationClose}
          milestone={celebrationData.milestone}
          stats={celebrationData.stats}
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
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  searchSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 24,
    minHeight: 400,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111111',
    marginTop: 16,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  sourceIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  sourceItem: {
    alignItems: 'center',
  },
  sourceText: {
    fontSize: 11,
    color: '#999999',
    marginTop: 6,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  wordContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
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
    marginBottom: 32,
    lineHeight: 20,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  featureItem: {
    alignItems: 'center',
    width: '48%',
    marginBottom: 16,
  },
  featureText: {
    fontSize: 12,
    color: '#999999',
    marginTop: 8,
    fontWeight: '500',
  },
});