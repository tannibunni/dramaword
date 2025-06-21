import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Svg, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';

interface BadgeProps {
  level: number;
  count: number;
  achieved: boolean;
  size?: number;
}

const levels = [
  { color: '#C084FC', name: '入门' }, // 10
  { color: '#A3E635', name: '新手' }, // 20
  { color: '#60A5FA', name: '学徒' }, // 50
  { color: '#FBBF24', name: '达人' }, // 100
  { color: '#F472B6', name: '专家' }, // 200
  { color: '#4ADE80', name: '大师' }, // 500
];

const hexagonPath = "M 50 2.5 L 95.5 27.5 L 95.5 77.5 L 50 102.5 L 4.5 77.5 L 4.5 27.5 Z";

export default function AchievementBadge({ level, count, achieved, size = 90 }: BadgeProps) {
  const badgeStyle = levels[level] || levels[0];
  const gradientId = `grad-${level}-${achieved}`;

  return (
    <View style={[styles.container, { width: size, height: size * 1.05 }]}>
      <Svg width={size} height={size * 1.05} viewBox="0 0 100 105">
        <Defs>
          {achieved ? (
            <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={badgeStyle.color} stopOpacity="1" />
              <Stop offset="100%" stopColor={badgeStyle.color} stopOpacity="0.8" />
            </LinearGradient>
          ) : (
            <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#E5E7EB" />
              <Stop offset="100%" stopColor="#D1D5DB" />
            </LinearGradient>
          )}
        </Defs>

        <Path
          d={hexagonPath}
          fill={`url(#${gradientId})`}
          stroke={achieved ? badgeStyle.color : '#F3F4F6'}
          strokeWidth="5"
          strokeLinejoin="round"
        />
      </Svg>

      <View style={styles.content}>
        {achieved ? (
          <Feather name="award" size={size * 0.2} color="#FFFFFF" style={styles.icon} />
        ) : (
          <Feather name="lock" size={size * 0.2} color="#9CA3AF" style={styles.icon} />
        )}
        <Text style={[styles.count, { color: achieved ? '#FFFFFF' : '#9CA3AF' }]}>
          {count}
        </Text>
        <Text style={[styles.label, { color: achieved ? 'rgba(255,255,255,0.8)' : '#A1A1AA' }]}>
          单词
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  content: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    marginBottom: 4,
  },
  count: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    marginTop: -2,
  },
}); 