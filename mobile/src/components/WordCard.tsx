import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Alert, ViewStyle, Platform, Pressable } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  interpolate,
  runOnJS
} from 'react-native-reanimated';
import { IWord } from '../types/word';
import { wordService } from '@/services/wordService';
import AudioPlayer from '@/components/AudioPlayer';
import { Feather } from '@expo/vector-icons';

interface WordCardProps {
  word: IWord;
  onAudioPlay?: () => void;
  showAnswer?: boolean;
  onFlip?: () => void;
  onWordSaved?: (word: IWord) => void;
}

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - 48;
const CARD_HEIGHT = Math.min(height * 0.65, 450);

const cardContainerStyle: ViewStyle = {
  width: CARD_WIDTH,
  height: CARD_HEIGHT,
  alignSelf: 'center',
  marginVertical: 20,
  zIndex: 1,
};

export default function WordCard({ word, onAudioPlay, showAnswer = false, onFlip, onWordSaved }: WordCardProps) {
  console.log('🎴 WordCard: Component rendered with word:', word?.word);
  
  // 添加组件生命周期日志
  useEffect(() => {
    console.log('🎴 WordCard: Component mounted');
    return () => {
      console.log('🎴 WordCard: Component unmounting');
    };
  }, []);

  // 安全地获取单词数据
  const safeWord = word || {};
  const safeMeanings = safeWord.meanings || [];
  const safePronunciation = safeWord.pronunciation || '';
  const safeAudioUrl = safeWord.audioUrl || '';
  const safeSpellingSuggestions = safeWord.spellingSuggestions || [];

  const [isFlipped, setIsFlipped] = useState(showAnswer);
  const [isSaved, setIsSaved] = useState(false);
  const flipValue = useSharedValue(showAnswer ? 1 : 0);

  // 保证showAnswer、isFlipped、flipValue同步
  useEffect(() => {
    setIsFlipped(showAnswer);
    flipValue.value = showAnswer ? 1 : 0;
  }, [showAnswer]);

  useEffect(() => {
    // 检查单词是否已收藏
    const checkSaved = async () => {
      try {
        const allWords = await wordService.getAllWords();
        setIsSaved(!!allWords.find(w => w.word === word.word));
      } catch (e) {
        setIsSaved(false);
      }
    };
    if (word && word.word) checkSaved();
  }, [word]);

  const handleFlip = () => {
    try {
      const newFlipped = !isFlipped;
      
      flipValue.value = withTiming(newFlipped ? 1 : 0, { duration: 600 }, () => {
        runOnJS(setIsFlipped)(newFlipped);
      });
      
      if (onFlip) {
        onFlip();
      }
    } catch (error) {
      console.error('Flip error:', error);
    }
  };

  const toggleSaveWord = async () => {
    if (!word || !word.word) return;
    if (isSaved) {
      // 取消收藏
      try {
        const allWords = await wordService.getAllWords();
        const real = allWords.find(w => w.word === word.word);
        const deleteId = real?._id && !real._id.startsWith('temp_') ? real._id : word.word;
        await wordService.deleteWord(deleteId);
        setIsSaved(false);
      } catch (e) {
        Alert.alert('取消收藏失败', '请稍后重试');
      }
    } else {
      // 收藏
      try {
        await wordService.saveWord(word);
        setIsSaved(true);
      } catch (e) {
        Alert.alert('收藏失败', '请稍后重试');
      }
    }
  };

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipValue.value, [0, 1], [0, 180]);
    const frontOpacity = flipValue.value < 0.5 ? 1 : 0;
    return {
      transform: [{ rotateY: `${rotateY}deg` }],
      opacity: frontOpacity,
      zIndex: Platform.OS === 'ios' ? (flipValue.value < 0.5 ? 2 : 1) : undefined,
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipValue.value, [0, 1], [180, 360]);
    const backOpacity = flipValue.value >= 0.5 ? 1 : 0;
    return {
      transform: [
        { rotateY: `${rotateY}deg` },
      ],
      opacity: backOpacity,
      zIndex: Platform.OS === 'ios' ? (flipValue.value >= 0.5 ? 2 : 1) : undefined,
    };
  });

  return (
    <View style={cardContainerStyle}>
      {/* 卡片正面 */}
      <Animated.View style={[styles.card, styles.cardFront, frontAnimatedStyle]}>
        {/* 透明层始终在最上层，保证可点击 */}
        <Pressable style={[StyleSheet.absoluteFill, {zIndex: 10}]} onPress={handleFlip} />
        <View style={styles.frontGradient} pointerEvents="box-none">
          <View style={styles.wordSection}>
            <Text style={styles.word}>{safeWord.word || '未知单词'}</Text>
            {safePronunciation && (
              <View style={styles.phoneticRow}>
                <Text style={styles.phonetic}>[{safePronunciation}]</Text>
                {safeAudioUrl && (
                  <AudioPlayer
                    audioUrl={safeAudioUrl}
                    size={18}
                    color="#666666"
                    style={styles.phoneticAudioIcon}
                    onPress={onAudioPlay}
                  />
                )}
              </View>
            )}
          </View>
          <ScrollView 
            style={styles.translationsContainer} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {safeMeanings.length > 0 ? (
              safeMeanings.slice(0, 5).map((meaning, index) => (
                <View key={`front-${index}`} style={styles.translationItem}>
                  <View style={styles.translationNumber}>
                    <Text style={styles.translationNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={[styles.partOfSpeech, styles.frontPartOfSpeech]}>
                    {meaning.partOfSpeech || '未知'}
                  </Text>
                  <Text style={styles.translation} numberOfLines={2}>
                    {meaning.definitionCn || '暂无释义'}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.noTranslation}>
                <Text style={styles.noTranslationText}>暂无释义</Text>
              </View>
            )}
          </ScrollView>
          <View style={styles.flipIndicator}>
            <Feather name="refresh-cw" size={14} color="#999999" />
            <Text style={styles.flipIndicatorText}>轻触查看详情</Text>
          </View>
        </View>
      </Animated.View>
      {/* 卡片背面 */}
      <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
        <View style={styles.backGradient} pointerEvents="box-none">
          {/* 顶部信息：单词、音标、收藏按钮 */}
          <View style={styles.backHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.backWord}>{safeWord.word || '未知单词'}</Text>
              {safePronunciation ? (
                <View style={styles.backPhoneticRow}>
                  <Text style={styles.backPhonetic}>{safePronunciation}</Text>
                  {safeAudioUrl && (
                    <AudioPlayer
                      audioUrl={safeAudioUrl}
                      size={20}
                      color="#666666"
                      style={styles.backPhoneticAudioIcon}
                      onPress={onAudioPlay}
                    />
                  )}
                </View>
              ) : null}
            </View>
            <TouchableOpacity 
              style={styles.heartButton}
              onPress={toggleSaveWord}
              activeOpacity={0.7}
            >
              <Feather
                name="heart"
                size={26}
                color={isSaved ? '#EF4444' : '#BDBDBD'}
                solid={isSaved}
              />
            </TouchableOpacity>
          </View>
          {/* 释义内容滚动区域 */}
          <ScrollView
            style={styles.meaningsScrollView}
            contentContainerStyle={styles.meaningsScrollContent}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.meaningsContainer}>
              {safeMeanings && safeMeanings.length > 0 ? (
                safeMeanings.map((meaning, index) => (
                  <View key={`back-${index}`} style={styles.meaningItem}>
                    <View style={styles.definitionRow}>
                      <Text style={styles.partOfSpeech}>
                        {meaning.partOfSpeech || '未知'}
                      </Text>
                      <Text style={styles.definitionCn}>
                        {meaning.definitionCn || '暂无释义'}
                      </Text>
                    </View>
                    {/* 例句和例句翻译 */}
                    {((meaning.example && meaning.example.trim()) || (meaning.exampleCn && meaning.exampleCn.trim())) && (
                      <View style={styles.exampleContainer}>
                        {meaning.example && meaning.example.trim() && (
                          <View style={[styles.exampleRow, !(meaning.exampleCn && meaning.exampleCn.trim()) && styles.lastExampleRow]}>
                            <Feather name="anchor" size={12} color="#4A90E2" style={styles.exampleIcon} />
                            <Text style={styles.example}>{meaning.example.trim()}</Text>
                          </View>
                        )}
                        {meaning.exampleCn && meaning.exampleCn.trim() && (
                          <View style={[styles.exampleRow, styles.lastExampleRow]}>
                            <Feather name="chevrons-right" size={12} color="#555555" style={styles.exampleIcon} />
                            <Text style={styles.exampleTranslation}>{meaning.exampleCn.trim()}</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                ))
              ) : (
                <View style={styles.noMeaningContainer}>
                  <Text style={styles.noMeaningText}>暂无详细释义</Text>
                </View>
              )}
              {/* 拼写建议区域 */}
              {safeSpellingSuggestions.length > 0 && (
                <View style={styles.spellingSuggestionsContainer}>
                  <View style={styles.suggestionsHeader}>
                    <Feather name="search" size={16} color="#4A90E2" />
                    <Text style={styles.suggestionsTitle}>拼写建议</Text>
                  </View>
                  <View style={styles.suggestionsList}>
                    {safeSpellingSuggestions.map((suggestion, index) => (
                      <TouchableOpacity
                        key={`suggestion-${index}`}
                        style={styles.suggestionItem}
                        onPress={() => {
                          if (onWordSaved) {
                            onWordSaved({ ...safeWord, word: suggestion });
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.suggestionText}>{suggestion}</Text>
                        <Feather name="arrow-right" size={14} color="#999999" />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
          {/* 底部提示区域可点返回正面 */}
          <TouchableOpacity style={styles.backFlipHint} onPress={handleFlip} activeOpacity={0.7}>
            <Feather name="refresh-cw" color="#999999" size={14} />
            <Text style={styles.backFlipHintText}>轻触返回正面</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardTouchable: {
    width: '100%',
    height: '100%',
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    backfaceVisibility: Platform.OS === 'ios' ? 'hidden' : undefined,
    zIndex: 1,
  },
  cardFront: {
    backgroundColor: '#FFFFFF',
  },
  cardBack: {
    backgroundColor: '#FFFFFF',
  },
  frontGradient: {
    flex: 1,
    borderRadius: 24,
    justifyContent: 'flex-start',
  },
  backGradient: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 0,
    flexDirection: 'column',
  },
  cardHeader: {
    marginBottom: 32,
  },
  wordSection: {
    padding: 24,
    paddingBottom: 16,
    width: '100%',
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  word: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 8,
  },
  phoneticRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  phonetic: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'monospace',
  },
  phoneticAudioIcon: {
    marginLeft: 12,
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F8F9FA',
  },
  translationsContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  translationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  translationNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  translationNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999999',
  },
  translation: {
    flex: 1,
    fontSize: 15,
    color: '#333333',
    lineHeight: 22,
  },
  frontPartOfSpeech: {
    backgroundColor: '#E0E7FF',
    color: '#4338CA',
  },
  flipIndicator: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipIndicatorText: {
    marginLeft: 8,
    color: '#999999',
    fontSize: 12,
    fontWeight: '500',
  },
  backScrollView: {
    flex: 1,
  },
  backContent: {
    padding: 24,
    paddingBottom: 40,
  },
  backHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  backWord: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: -0.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  // 🔥 新增：背面音标和发音图标的行布局
  backPhoneticRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPhonetic: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '400',
    textAlign: 'center',
  },
  backPhoneticAudioIcon: {
    marginLeft: 12,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  meaningsContainer: {
    marginBottom: 24,
  },
  meaningItem: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  partOfSpeech: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden', // for iOS
  },
  definitionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  definitionCn: {
    fontSize: 15,
    color: '#333333',
    lineHeight: 22,
    flex: 1,
  },
  exampleContainer: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  lastExampleRow: {
    marginBottom: 0,
  },
  exampleIcon: {
    marginRight: 8,
    marginTop: 3,
  },
  example: {
    fontSize: 14,
    color: '#111111',
    fontStyle: 'italic',
    lineHeight: 20,
    flex: 1,
  },
  exampleTranslation: {
    fontSize: 14,
    color: '#555555',
    lineHeight: 20,
    flex: 1,
  },
  backFlipHint: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F8F9FA',
  },
  backFlipHintText: {
    color: '#999999',
    fontSize: 11,
    marginTop: 6,
    marginBottom: 4,
    fontWeight: '500',
  },
  noTranslation: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noTranslationText: {
    fontSize: 16,
    color: '#999999',
  },
  noMeaningContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noMeaningText: {
    color: '#999999',
    fontSize: 14,
    fontWeight: '500',
  },
  heartButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 100,
    backgroundColor: 'transparent',
    padding: 4,
  },
  spellingSuggestionsContainer: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
    marginLeft: 8,
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: '#111111',
    marginRight: 8,
  },
  backHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
    minHeight: 60,
  },
  meaningsScrollView: {
    flex: 1,
    marginHorizontal: 12,
    borderRadius: 12,
  },
  meaningsScrollContent: {
    paddingBottom: 16,
  },
});