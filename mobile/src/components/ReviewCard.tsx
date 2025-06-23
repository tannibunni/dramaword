import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  useAnimatedGestureHandler,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const SWIPE_THRESHOLD = screenWidth * 0.25;

interface ReviewCardProps {
  word: {
    id: string;
    word: string;
    translation: string;
    example?: string;
    phonetic?: string;
  };
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isActive: boolean;
}

export default function ReviewCard({ word, onSwipeLeft, onSwipeRight, isActive }: ReviewCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  // 当word变化时重置动画值和状态
  React.useEffect(() => {
    translateX.value = 0;
    translateY.value = 0;
    scale.value = 1;
    rotate.value = 0;
    setIsRevealed(false); // 重置为初始状态
  }, [word.id]);

  const handleCardPress = () => {
    setIsRevealed(true);
  };

  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onStart: () => {
      scale.value = withSpring(1.05);
    },
    onActive: (event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      rotate.value = interpolate(
        event.translationX,
        [-screenWidth / 2, 0, screenWidth / 2],
        [-15, 0, 15],
        Extrapolate.CLAMP
      );
    },
    onEnd: (event) => {
      const shouldSwipeLeft = event.translationX < -SWIPE_THRESHOLD;
      const shouldSwipeRight = event.translationX > SWIPE_THRESHOLD;

      if (shouldSwipeLeft) {
        translateX.value = withSpring(-screenWidth * 1.5, {}, (finished) => {
          if (finished) {
            runOnJS(onSwipeLeft)();
          }
        });
      } else if (shouldSwipeRight) {
        translateX.value = withSpring(screenWidth * 1.5, {}, (finished) => {
          if (finished) {
            runOnJS(onSwipeRight)();
          }
        });
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotate.value = withSpring(0);
      }
      scale.value = withSpring(1);
    },
  });

  const cardStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { rotate: `${rotate.value}deg` },
      ],
    };
  });

  const leftIndicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-screenWidth / 2, 0],
      [1, 0],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  const rightIndicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, screenWidth / 2],
      [0, 1],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  return (
    <View style={styles.container}>
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.card, cardStyle]}>
          {/* 左滑指示器 */}
          <Animated.View style={[styles.indicator, styles.leftIndicator, leftIndicatorStyle]}>
            <Feather name="x" size={40} color="#EF4444" />
            <Text style={[styles.indicatorText, { color: '#EF4444' }]}>忘记</Text>
          </Animated.View>

          {/* 右滑指示器 */}
          <Animated.View style={[styles.indicator, styles.rightIndicator, rightIndicatorStyle]}>
            <Feather name="check" size={40} color="#22C55E" />
            <Text style={[styles.indicatorText, { color: '#22C55E' }]}>记得</Text>
          </Animated.View>

          {/* 卡片内容 */}
          <TouchableOpacity 
            style={styles.cardContent} 
            onPress={handleCardPress}
            activeOpacity={0.9}
          >
            {!isRevealed ? (
              // 状态1：只显示单词
              <View style={styles.wordOnlyContainer}>
                <Text style={styles.wordOnly}>{word.word}</Text>
                {word.phonetic && (
                  <Text style={styles.phoneticOnly}>[{word.phonetic}]</Text>
                )}
                <View style={styles.tapHint}>
                  <Feather name="eye" size={20} color="#6B7280" />
                  <Text style={styles.tapHintText}>点击查看释义</Text>
                </View>
              </View>
            ) : (
              // 状态2：显示完整信息
              <>
                {/* 单词 */}
                <View style={styles.wordSection}>
                  <Text style={styles.word}>{word.word}</Text>
                  {word.phonetic && (
                    <Text style={styles.phonetic}>[{word.phonetic}]</Text>
                  )}
                </View>

                {/* 释义 */}
                <View style={styles.translationSection}>
                  <Text style={styles.translationLabel}>释义</Text>
                  <Text style={styles.translation}>{word.translation}</Text>
                </View>

                {/* 例句 */}
                {word.example && (
                  <View style={styles.exampleSection}>
                    <Text style={styles.exampleLabel}>例句</Text>
                    <Text style={styles.example}>{word.example}</Text>
                  </View>
                )}

                {/* 操作提示 */}
                <View style={styles.hintSection}>
                  <View style={styles.hintItem}>
                    <Feather name="arrow-left" size={16} color="#EF4444" />
                    <Text style={[styles.hintText, { color: '#EF4444' }]}>左滑忘记</Text>
                  </View>
                  <View style={styles.hintItem}>
                    <Feather name="arrow-right" size={16} color="#22C55E" />
                    <Text style={[styles.hintText, { color: '#22C55E' }]}>右滑记得</Text>
                  </View>
                </View>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: screenWidth - 40,
    height: screenHeight * 0.6,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
  },
  cardContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  wordSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  word: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  phonetic: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  translationSection: {
    marginBottom: 20,
  },
  translationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  translation: {
    fontSize: 18,
    color: '#374151',
    lineHeight: 26,
  },
  exampleSection: {
    marginBottom: 20,
  },
  exampleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  example: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  hintSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  hintItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hintText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  indicator: {
    position: 'absolute',
    top: 50,
    padding: 20,
    borderRadius: 12,
    borderWidth: 4,
    zIndex: 1,
  },
  leftIndicator: {
    left: 20,
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  rightIndicator: {
    right: 20,
    borderColor: '#22C55E',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  indicatorText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  wordOnlyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  wordOnly: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  phoneticOnly: {
    fontSize: 18,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 24,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tapHintText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 8,
  },
});