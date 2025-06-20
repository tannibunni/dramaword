import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Alert, ViewStyle } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  interpolate,
  runOnJS,
  useAnimatedGestureHandler,
  withSpring
} from 'react-native-reanimated';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { Word } from '@/types/word';
import { wordService } from '@/services/wordService';
import AudioPlayer from '@/components/AudioPlayer';
import { Feather } from '@expo/vector-icons';

interface WordCardProps {
  word: Word;
  onAudioPlay?: () => void;
  showAnswer?: boolean;
  onFlip?: () => void;
  onWordSaved?: (word: Word) => void;
}

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - 48;
const CARD_HEIGHT = Math.min(height * 0.65, 450);
const SWIPE_THRESHOLD = 80;

type ContextType = {
  translateX: number;
};

const cardContainerStyle: ViewStyle = {
  width: CARD_WIDTH,
  height: CARD_HEIGHT,
  alignSelf: 'center',
  marginVertical: 20,
  perspective: 1000 as any, 
  zIndex: 1,
};

export default function WordCard({ word, onAudioPlay, showAnswer = false, onFlip, onWordSaved }: WordCardProps) {
  const [isFlipped, setIsFlipped] = useState(showAnswer);
  const [isSaved, setIsSaved] = useState(false);
  const flipValue = useSharedValue(showAnswer ? 1 : 0);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handleFlip = () => {
    const newFlipped = !isFlipped;
    
    flipValue.value = withTiming(newFlipped ? 1 : 0, { duration: 600 }, () => {
      runOnJS(setIsFlipped)(newFlipped);
    });
    
    if (onFlip) {
      onFlip();
    }
  };

  const saveWordToVocabulary = async () => {
    try {
      setIsSaved(true);
      
      if (onWordSaved) {
        onWordSaved(word);
      }

      Alert.alert('保存成功', `单词 "${word.word}" 已添加到您的单词表中`);
      
      setTimeout(() => {
        setIsSaved(false);
      }, 2000);
    } catch (error) {
      console.error('Save word error:', error);
      Alert.alert('保存失败', '请稍后重试');
    }
  };

  // 右滑手势处理器 - 只在卡片背面生效
  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, ContextType>({
    onStart: (_, context) => {
      context.translateX = translateX.value;
    },
    onActive: (event, context) => {
      // 只在翻转到背面时允许滑动
      if (flipValue.value < 0.5) return;
      
      // 只允许向右滑动
      const newTranslateX = Math.max(0, context.translateX + event.translationX);
      translateX.value = newTranslateX;
      
      // 根据滑动进度调整卡片样式
      const progress = Math.min(newTranslateX / SWIPE_THRESHOLD, 1);
      scale.value = interpolate(progress, [0, 1], [1, 1.05]);
      opacity.value = interpolate(progress, [0, 1], [1, 0.9]);
    },
    onEnd: (event) => {
      // 只在翻转到背面时处理滑动结束
      if (flipValue.value < 0.5) return;
      
      const shouldSave = event.translationX > SWIPE_THRESHOLD;
      
      if (shouldSave) {
        // 执行保存动画
        translateX.value = withTiming(CARD_WIDTH, { duration: 300 });
        scale.value = withTiming(0.8, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 });
        
        // 保存单词
        setTimeout(() => {
          runOnJS(saveWordToVocabulary)();
          
          // 重置动画状态
          translateX.value = withSpring(0);
          scale.value = withSpring(1);
          opacity.value = withSpring(1);
        }, 300);
      } else {
        // 弹回原位
        translateX.value = withSpring(0);
        scale.value = withSpring(1);
        opacity.value = withSpring(1);
      }
    },
  });

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
        { translateX: translateX.value },
        { scale: scale.value }
      ],
      opacity: backOpacity * opacity.value,
      zIndex: flipValue.value >= 0.5 ? 2 : 1,
    };
  });

  // 右滑指示器动画
  const swipeIndicatorStyle = useAnimatedStyle(() => {
    const progress = translateX.value / SWIPE_THRESHOLD;
    const indicatorOpacity = Math.min(progress, 1);
    return {
      opacity: indicatorOpacity,
      transform: [{ scale: interpolate(progress, [0, 1], [0.8, 1.2]) }],
    };
  });

  const WordChip = ({ text, color = '#F8F9FA' }: { text: string; color?: string }) => (
    <View style={[styles.chip, { backgroundColor: color }]}>
      <Text style={styles.chipText}>{text}</Text>
    </View>
  );

  return (
    <View style={cardContainerStyle}>
      <TouchableOpacity onPress={handleFlip} style={styles.cardTouchable} activeOpacity={0.95}>
        {/* 卡片正面 */}
        <Animated.View style={[styles.card, styles.cardFront, frontAnimatedStyle]}>
          <View style={styles.frontGradient}>
            <View style={styles.cardHeader}>
              <View style={styles.wordSection}>
                <Text style={styles.word}>{word.word}</Text>
                {/* 🔥 修改：音标和发音图标放在一行 */}
                {word.phonetic && (
                  <View style={styles.phoneticRow}>
                    <Text style={styles.phonetic}>{word.phonetic}</Text>
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
            </View>

            <View style={styles.translationsContainer}>
              {(word.chineseTranslations || []).slice(0, 3).map((translation, index) => (
                <View key={index} style={styles.translationItem}>
                  <View style={styles.translationNumber}>
                    <Text style={styles.translationNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.translation}>{translation}</Text>
                </View>
              ))}
            </View>

            <View style={styles.flipHint}>
              <Feather name="refresh-cw" color="#999999" size={14} />
              <Text style={styles.flipHintText}>轻触查看详情</Text>
              <Feather name="arrow-right" color="#999999" size={14} />
            </View>
          </View>
        </Animated.View>

        {/* 卡片背面 - 支持右滑保存 */}
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
            <View style={styles.backGradient}>
              {/* 右滑保存指示器 */}
              <Animated.View style={[styles.swipeIndicator, swipeIndicatorStyle]}>
                <Feather name="bookmark" color="#FFFFFF" size={20} />
                <Text style={styles.swipeIndicatorText}>保存</Text>
              </Animated.View>

              <ScrollView 
                style={styles.backScrollView}
                contentContainerStyle={styles.backContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.backHeader}>
                  <Text style={styles.backWord}>{word.word}</Text>
                  {/* 🔥 修改：背面也使用音标和发音图标的行布局 */}
                  {word.phonetic && (
                    <View style={styles.backPhoneticRow}>
                      <Text style={styles.backPhonetic}>{word.phonetic}</Text>
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
                  {word.meanings.slice(0, 2).map((meaning, index) => (
                    <View key={index} style={styles.meaningItem}>
                      <View style={styles.partOfSpeechContainer}>
                        <Feather name="book-open" color="#666666" size={12} />
                        <Text style={styles.partOfSpeech}>{meaning.partOfSpeech}</Text>
                      </View>
                      
                      <Text style={styles.definition}>{meaning.definition}</Text>
                      
                      {meaning.exampleEn && (
                        <View style={styles.exampleContainer}>
                          <Text style={styles.exampleEn}>"{meaning.exampleEn}"</Text>
                          {meaning.exampleCn && (
                            <Text style={styles.exampleCn}>{meaning.exampleCn}</Text>
                          )}
                        </View>
                      )}
                    </View>
                  ))}
                </View>

                {word.synonyms.length > 0 && (
                  <View style={styles.chipsSection}>
                    <View style={styles.chipHeader}>
                      <Feather name="users" color="#999999" size={12} />
                      <Text style={styles.chipSectionTitle}>近义词</Text>
                    </View>
                    <View style={styles.chipsContainer}>
                      {word.synonyms.slice(0, 3).map((synonym, index) => (
                        <WordChip key={index} text={synonym} color="#F0F9FF" />
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.backFlipHint}>
                  <Feather name="refresh-cw" color="#CCCCCC" size={12} />
                  <Text style={styles.backFlipHintText}>轻触返回</Text>
                  <Text style={styles.swipeHintText}>右滑保存到单词表</Text>
                </View>
              </ScrollView>
            </View>
          </Animated.View>
        </PanGestureHandler>
      </TouchableOpacity>

      {/* 保存成功指示器 */}
      {isSaved && (
        <View style={styles.successIndicator}>
          <Feather name="check" color="#FFFFFF" size={16} />
          <Text style={styles.successText}>已保存</Text>
        </View>
      )}
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
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    backfaceVisibility: 'hidden',
    zIndex: 1,
  },
  cardFront: {},
  cardBack: {},
  frontGradient: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  backGradient: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 0,
  },
  // 右滑保存指示器样式
  swipeIndicator: {
    position: 'absolute',
    top: '50%',
    right: 20,
    zIndex: 10,
    alignItems: 'center',
    backgroundColor: '#22C55E',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    transform: [{ translateY: -25 }],
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  swipeIndicatorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  cardHeader: {
    marginBottom: 32,
  },
  wordSection: {
    flex: 1,
  },
  word: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  // 🔥 新增：音标和发音图标的行布局
  phoneticRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phonetic: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '400',
  },
  phoneticAudioIcon: {
    marginLeft: 12,
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F8F9FA',
  },
  translationsContainer: {
    marginBottom: 40,
  },
  translationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    color: '#666666',
  },
  translation: {
    fontSize: 16,
    color: '#111111',
    fontWeight: '500',
    flex: 1,
  },
  flipHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F8F9FA',
  },
  flipHintText: {
    color: '#999999',
    fontSize: 12,
    marginHorizontal: 8,
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
  partOfSpeechContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  partOfSpeech: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  definition: {
    fontSize: 15,
    color: '#111111',
    lineHeight: 22,
    marginBottom: 16,
    fontWeight: '400',
  },
  exampleContainer: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#E5E7EB',
  },
  exampleEn: {
    fontSize: 14,
    color: '#111111',
    fontStyle: 'italic',
    marginBottom: 8,
    lineHeight: 20,
  },
  exampleCn: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  chipsSection: {
    marginBottom: 20,
  },
  chipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  chipSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  chipText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  backFlipHint: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F8F9FA',
  },
  backFlipHintText: {
    color: '#CCCCCC',
    fontSize: 11,
    marginTop: 6,
    marginBottom: 4,
    fontWeight: '500',
  },
  swipeHintText: {
    color: '#22C55E',
    fontSize: 11,
    fontWeight: '600',
  },
  // 保存成功指示器样式
  successIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    zIndex: 100,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  successText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});