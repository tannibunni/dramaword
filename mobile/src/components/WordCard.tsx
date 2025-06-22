import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Alert, ViewStyle } from 'react-native';
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
  perspective: 1000 as any, 
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

  const [isFlipped, setIsFlipped] = useState(showAnswer);
  const [isSaved, setIsSaved] = useState(false);
  const flipValue = useSharedValue(showAnswer ? 1 : 0);

  const handleFlip = () => {
    const newFlipped = !isFlipped;
    
    flipValue.value = withTiming(newFlipped ? 1 : 0, { duration: 600 }, () => {
      setIsFlipped(newFlipped);
    });
    
    if (onFlip) {
      onFlip();
    }
  };

  const saveWordToVocabulary = async () => {
    console.log('💾 ===== SAVE FUNCTION START =====');
    
    // 防止重复保存
    if (isSaved) {
      console.log('💾 Word already being saved, skipping');
      return;
    }

    // 设置保存状态
    setIsSaved(true);

    try {
      console.log('💾 Starting to save word:', word.word);

      // 验证单词数据
      if (!word || !word.word) {
        throw new Error('Invalid word data');
      }

      // 真正保存到后端
      const savedWord = await wordService.saveWord(word);
      console.log('💾 Word saved to backend:', savedWord);

      // 显示成功消息
      Alert.alert('保存成功', `单词 "${word.word}" 已添加到您的单词表中`, [
        {
          text: '确定',
          onPress: () => {
            console.log('💾 Word saved successfully, staying on current page');
          }
        }
      ]);
      
      console.log('💾 ===== SAVE FUNCTION SUCCESS =====');
      
    } catch (error) {
      console.error('💾 ===== SAVE FUNCTION ERROR =====');
      console.error('💾 Save word error:', error);
      
      // 显示错误信息
      Alert.alert('保存失败', '请稍后重试');
      
      console.log('💾 ===== SAVE FUNCTION ERROR END =====');
    } finally {
      // 延迟重置保存状态
      setTimeout(() => {
        setIsSaved(false);
      }, 2000);
    }
  };

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipValue.value, [0, 1], [0, 180]);
    const frontOpacity = flipValue.value < 0.5 ? 1 : 0;
    return {
      transform: [{ rotateY: `${rotateY}deg` }],
      opacity: frontOpacity,
      zIndex: flipValue.value < 0.5 ? 2 : 1,
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
      zIndex: flipValue.value >= 0.5 ? 2 : 1,
    };
  });

  return (
    <View style={cardContainerStyle}>
      <TouchableOpacity onPress={handleFlip} style={styles.cardTouchable} activeOpacity={0.95}>
        {/* 卡片正面 */}
        <Animated.View style={[styles.card, styles.cardFront, frontAnimatedStyle]}>
          <View style={styles.frontGradient}>
            <View style={styles.wordSection}>
              <Text style={styles.word}>{word.word}</Text>
              {word.pronunciation && (
                <View style={styles.phoneticRow}>
                  <Text style={styles.phonetic}>[{word.pronunciation}]</Text>
                  {word.audioUrl && (
                    <AudioPlayer
                      audioUrl={word.audioUrl}
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
              {word.meanings?.length > 0 ? (
                word.meanings.slice(0, 5).map((meaning, index) => (
                  <View key={index} style={styles.translationItem}>
                    <View style={styles.translationNumber}>
                      <Text style={styles.translationNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={[styles.partOfSpeech, styles.frontPartOfSpeech]}>{meaning.partOfSpeech}</Text>
                    <Text style={styles.translation} numberOfLines={2}>{meaning.definitionCn}</Text>
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
          <View style={styles.backGradient}>
            <ScrollView 
              style={styles.backScrollView}
              contentContainerStyle={styles.backContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.backHeader}>
                <Text style={styles.backWord}>{word.word}</Text>
                {/* 🔥 修改：背面也使用音标和发音图标的行布局 */}
                {word.pronunciation && (
                  <View style={styles.backPhoneticRow}>
                    <Text style={styles.backPhonetic}>{word.pronunciation}</Text>
                    {word.audioUrl && (
                      <AudioPlayer
                        audioUrl={word.audioUrl}
                        size={20}
                        color="#666666"
                        style={styles.backPhoneticAudioIcon}
                        onPress={onAudioPlay}
                      />
                    )}
                  </View>
                )}
              </View>

              <View style={styles.meaningsContainer}>
                {word.meanings && word.meanings.length > 0 ? (
                  word.meanings.slice(0, 3).map((meaning, index) => (
                    <View key={index} style={styles.meaningItem}>
                      <View style={styles.definitionRow}>
                        <Text style={styles.partOfSpeech}>{meaning.partOfSpeech}</Text>
                        <Text style={styles.definitionCn}>{meaning.definitionCn}</Text>
                      </View>
                      
                      {/* 例句和例句翻译 */}
                      {(meaning.example || meaning.exampleCn) && (
                        <View style={styles.exampleContainer}>
                          {meaning.example && (
                            <View style={[styles.exampleRow, !meaning.exampleCn && styles.lastExampleRow]}>
                              <Feather name="anchor" size={12} color="#4A90E2" style={styles.exampleIcon} />
                              <Text style={styles.example}>{meaning.example}</Text>
                            </View>
                          )}
                          {meaning.exampleCn && (
                            <View style={[styles.exampleRow, styles.lastExampleRow]}>
                              <Feather name="chevrons-right" size={12} color="#555555" style={styles.exampleIcon} />
                              <Text style={styles.exampleTranslation}>{meaning.exampleCn}</Text>
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
                {word.spellingSuggestions && word.spellingSuggestions.length > 0 && (
                  <View style={styles.spellingSuggestionsContainer}>
                    <View style={styles.suggestionsHeader}>
                      <Feather name="search" size={16} color="#4A90E2" />
                      <Text style={styles.suggestionsTitle}>拼写建议</Text>
                    </View>
                    <View style={styles.suggestionsList}>
                      {word.spellingSuggestions.map((suggestion, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.suggestionItem}
                          onPress={() => {
                            // 这里需要通知父组件进行新的搜索
                            if (onWordSaved) {
                              // 临时使用onWordSaved回调来传递建议单词
                              onWordSaved({ ...word, word: suggestion });
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

              <View style={styles.backFlipHint}>
                <Feather name="refresh-cw" color="#999999" size={14} />
                <Text style={styles.backFlipHintText}>轻触返回正面</Text>
              </View>
            </ScrollView>

            {/* 收集单词按钮 - 移到ScrollView外部 */}
            <TouchableOpacity 
              style={[styles.collectButton, isSaved && styles.collectButtonSaved]} 
              onPress={saveWordToVocabulary}
              disabled={isSaved}
              activeOpacity={0.8}
            >
              <Feather 
                name={isSaved ? "check" : "bookmark"} 
                color="#FFFFFF" 
                size={16} 
              />
              <Text style={styles.collectButtonText}>
                {isSaved ? '已收集' : '收集单词'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>
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
    backfaceVisibility: 'hidden',
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
  collectButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 100,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  collectButtonSaved: {
    backgroundColor: '#10B981',
  },
  collectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
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
});