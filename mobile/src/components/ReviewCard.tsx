import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  runOnJS,
  useAnimatedGestureHandler,
  interpolate
} from 'react-native-reanimated';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { Word } from '@/types/word';
import AudioPlayer from '@/components/AudioPlayer';
import { Feather } from '@expo/vector-icons';

interface ReviewCardProps {
  word: Word;
  onAnswer: (correct: boolean) => void;
  onAudioPlay?: () => void;
}

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - 48;
const SWIPE_THRESHOLD = width * 0.25;

type ContextType = {
  translateX: number;
};

export default function ReviewCard({ word, onAnswer, onAudioPlay }: ReviewCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const flipValue = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, ContextType>({
    onStart: (_, context) => {
      context.translateX = translateX.value;
    },
    onActive: (event, context) => {
      // 只在翻转到背面时允许滑动
      if (flipValue.value < 0.5) return;
      
      translateX.value = context.translateX + event.translationX;
      translateY.value = event.translationY * 0.1;
      
      const progress = Math.abs(event.translationX) / SWIPE_THRESHOLD;
      rotate.value = interpolate(event.translationX, [-SWIPE_THRESHOLD, SWIPE_THRESHOLD], [-10, 10]);
      scale.value = interpolate(progress, [0, 1], [1, 0.95]);
      opacity.value = interpolate(progress, [0, 1], [1, 0.8]);
    },
    onEnd: (event) => {
      // 只在翻转到背面时处理滑动结束
      if (flipValue.value < 0.5) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotate.value = withSpring(0);
        scale.value = withSpring(1);
        opacity.value = withSpring(1);
        return;
      }
      
      const shouldAnswer = Math.abs(event.translationX) > SWIPE_THRESHOLD;
      
      if (shouldAnswer) {
        const isCorrect = event.translationX > 0;
        
        // 动画卡片离开屏幕
        translateX.value = withTiming(event.translationX > 0 ? width : -width, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 });
        
        // 调用答案回调
        setTimeout(() => runOnJS(onAnswer)(isCorrect), 300);
      } else {
        // 弹回原位
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotate.value = withSpring(0);
        scale.value = withSpring(1);
        opacity.value = withSpring(1);
      }
    },
  });

  const handleFlip = () => {
    const newFlipped = !isFlipped;
    
    flipValue.value = withTiming(newFlipped ? 1 : 0, { duration: 600 }, () => {
      runOnJS(setIsFlipped)(newFlipped);
    });
  };

  const handleAnswer = (correct: boolean) => {
    translateX.value = withTiming(correct ? width : -width, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 });
    setTimeout(() => onAnswer(correct), 300);
  };

  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate.value}deg` },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
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
      transform: [{ rotateY: `${rotateY}deg` }],
      opacity: backOpacity,
      zIndex: flipValue.value >= 0.5 ? 2 : 1,
    };
  });

  // 滑动指示器动画
  const leftIndicatorStyle = useAnimatedStyle(() => {
    const progress = Math.max(0, -translateX.value / SWIPE_THRESHOLD);
    return {
      opacity: Math.min(progress, 1),
      transform: [{ scale: interpolate(progress, [0, 1], [0.8, 1.2]) }],
    };
  });

  const rightIndicatorStyle = useAnimatedStyle(() => {
    const progress = Math.max(0, translateX.value / SWIPE_THRESHOLD);
    return {
      opacity: Math.min(progress, 1),
      transform: [{ scale: interpolate(progress, [0, 1], [0.8, 1.2]) }],
    };
  });

  return (
    <View style={styles.container}>
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.cardContainer, cardAnimatedStyle]}>
          {/* 滑动指示器 */}
          <Animated.View style={[styles.swipeIndicator, styles.leftIndicator, leftIndicatorStyle]}>
            <Feather name="x" color="#FFFFFF" size={32} />
            <Text style={styles.indicatorText}>还没记住</Text>
          </Animated.View>
          
          <Animated.View style={[styles.swipeIndicator, styles.rightIndicator, rightIndicatorStyle]}>
            <Feather name="check-circle" color="#FFFFFF" size={32} />
            <Text style={styles.indicatorText}>记住了</Text>
          </Animated.View>

          {/* 卡片正面 */}
          <Animated.View style={[styles.card, styles.cardFront, frontAnimatedStyle]}>
            <TouchableOpacity onPress={handleFlip} style={styles.cardContent} activeOpacity={0.95}>
              <View style={styles.frontContent}>
                <View style={styles.wordSection}>
                  <Text style={styles.word}>{word.word}</Text>
                  {word.phonetic && (
                    <View style={styles.phoneticRow}>
                      <Text style={styles.phonetic}>{word.phonetic}</Text>
                      {word.audioUrl && (
                        <AudioPlayer
                          audioUrl={word.audioUrl}
                          size={20}
                          color="#FFFFFF"
                          style={styles.audioButton}
                          onPress={onAudioPlay}
                        />
                      )}
                    </View>
                  )}
                </View>

                <View style={styles.flipHint}>
                  <Feather name="rotate-ccw" color="rgba(255, 255, 255, 0.8)" size={16} />
                  <Text style={styles.flipHintText}>轻触查看释义</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* 卡片背面 */}
          <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
            <TouchableOpacity onPress={handleFlip} style={styles.cardContent} activeOpacity={0.95}>
              <View style={styles.backContent}>
                <View style={styles.backHeader}>
                  <Text style={styles.backWord}>{word.word}</Text>
                  {word.phonetic && (
                    <View style={styles.backPhoneticRow}>
                      <Text style={styles.backPhonetic}>{word.phonetic}</Text>
                      {word.audioUrl && (
                        <AudioPlayer
                          audioUrl={word.audioUrl}
                          size={18}
                          color="#666666"
                          style={styles.backAudioButton}
                          onPress={onAudioPlay}
                        />
                      )}
                    </View>
                  )}
                </View>

                <View style={styles.translationsContainer}>
                  {word.chineseTranslations.slice(0, 3).map((translation, index) => (
                    <View key={index} style={styles.translationItem}>
                      <View style={styles.translationNumber}>
                        <Text style={styles.translationNumberText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.translation}>{translation}</Text>
                    </View>
                  ))}
                </View>

                {word.meanings.length > 0 && word.meanings[0].exampleEn && (
                  <View style={styles.exampleContainer}>
                    <Text style={styles.exampleLabel}>例句</Text>
                    <Text style={styles.exampleEn}>"{word.meanings[0].exampleEn}"</Text>
                    {word.meanings[0].exampleCn && (
                      <Text style={styles.exampleCn}>{word.meanings[0].exampleCn}</Text>
                    )}
                  </View>
                )}

                <View style={styles.swipeHint}>
                  <View style={styles.swipeHintItem}>
                    <Feather name="arrow-left" color="#EF4444" size={16} />
                    <Text style={[styles.swipeHintText, { color: '#EF4444' }]}>还没记住</Text>
                  </View>
                  <View style={styles.swipeHintItem}>
                    <Text style={[styles.swipeHintText, { color: '#22C55E' }]}>记住了</Text>
                    <Feather name="arrow-right" color="#22C55E" size={16} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </PanGestureHandler>

      {/* 底部按钮（仅在背面显示） */}
      {isFlipped && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.incorrectButton]}
            onPress={() => handleAnswer(false)}
          >
            <Feather name="x" color="#FFFFFF" size={20} />
            <Text style={styles.actionButtonText}>还没记住</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.correctButton]}
            onPress={() => handleAnswer(true)}
          >
            <Feather name="check-circle" color="#FFFFFF" size={20} />
            <Text style={styles.actionButtonText}>记住了</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: 400,
    position: 'relative',
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    backfaceVisibility: 'hidden',
  },
  cardFront: {
    backgroundColor: '#3B82F6',
  },
  cardBack: {
    backgroundColor: '#FFFFFF',
  },
  cardContent: {
    flex: 1,
    borderRadius: 20,
  },
  swipeIndicator: {
    position: 'absolute',
    top: '50%',
    zIndex: 10,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    transform: [{ translateY: -40 }],
  },
  leftIndicator: {
    left: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
  },
  rightIndicator: {
    right: 20,
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
  },
  indicatorText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  frontContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  wordSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  word: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  phoneticRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phonetic: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    fontStyle: 'italic',
  },
  audioButton: {
    marginLeft: 12,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  flipHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  flipHintText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  backContent: {
    flex: 1,
    padding: 24,
  },
  backHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backWord: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  backPhoneticRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backPhonetic: {
    fontSize: 16,
    color: '#666666',
    fontStyle: 'italic',
  },
  backAudioButton: {
    marginLeft: 8,
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F8F9FA',
  },
  translationsContainer: {
    marginBottom: 24,
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
  exampleContainer: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  exampleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exampleEn: {
    fontSize: 14,
    color: '#111111',
    fontStyle: 'italic',
    marginBottom: 6,
    lineHeight: 20,
  },
  exampleCn: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  swipeHint: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  swipeHintItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swipeHintText: {
    fontSize: 12,
    fontWeight: '500',
    marginHorizontal: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: CARD_WIDTH,
    marginTop: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0.48,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  correctButton: {
    backgroundColor: '#22C55E',
  },
  incorrectButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});