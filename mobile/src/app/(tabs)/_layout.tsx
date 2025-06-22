import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { height } = Dimensions.get('window');

  // 🔥 增加底部安全区域，确保足够的空间
  const bottomPadding = Math.max(insets.bottom, Platform.select({
    ios: 24,      // 🔥 从 20 增加到 24
    android: 20,  // 🔥 从 16 增加到 20
    default: 20,  // 🔥 从 16 增加到 20
  }));

  // 🔥 增加标签栏总高度
  const tabBarHeight = Platform.select({
    ios: 90 + bottomPadding,      // 🔥 从 85 增加到 90
    android: 80 + bottomPadding,  // 🔥 从 75 增加到 80
    web: 80 + bottomPadding,      // 🔥 从 75 增加到 80
    default: 80 + bottomPadding,  // 🔥 从 75 增加到 80
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#111111',
        tabBarInactiveTintColor: '#999999',
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          paddingTop: 20,           // 🔥 从 16 增加到 20
          paddingBottom: bottomPadding,
          paddingHorizontal: 20,
          height: tabBarHeight,
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 }, // 🔥 增强阴影
          shadowOpacity: 0.08,     // 🔥 从 0.05 增加到 0.08
          shadowRadius: 24,        // 🔥 从 20 增加到 24
          zIndex: 1000,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 10,           // 🔥 从 8 增加到 10
          marginBottom: 0,
          letterSpacing: 0.2,
        },
        tabBarIconStyle: {
          marginTop: 10,           // 🔥 从 8 增加到 10
          marginBottom: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 10,     // 🔥 从 8 增加到 10
          minHeight: 65,           // 🔥 从 60 增加到 65
          borderRadius: 12,
          marginHorizontal: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '查词',
          tabBarIcon: ({ size, color, focused }) => (
            <Feather 
              name="search"
              size={focused ? 22 : 20} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="vocabulary"
        options={{
          title: '单词表',
          tabBarIcon: ({ size, color, focused }) => (
            <Feather 
              name="book-open"
              size={focused ? 22 : 20} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="review"
        options={{
          title: '复习',
          tabBarIcon: ({ size, color, focused }) => (
            <Feather 
              name="rotate-ccw"
              size={focused ? 22 : 20} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: '统计',
          tabBarIcon: ({ size, color, focused }) => (
            <Feather 
              name="bar-chart-2"
              size={focused ? 22 : 20} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="drama"
        options={{
          title: '剧单',
          tabBarIcon: ({ size, color, focused }) => (
            <Feather 
              name="play"
              size={focused ? 22 : 20} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}