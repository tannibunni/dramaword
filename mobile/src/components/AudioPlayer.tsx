import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';

interface AudioPlayerProps {
  audioUrl?: string;
  size?: number;
  color?: string;
  style?: any;
  onPress?: () => void;
}

export default function AudioPlayer({ 
  audioUrl, 
  size = 18, 
  color = '#666666', 
  style,
  onPress 
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const playAudio = async () => {
    if (onPress) {
      onPress();
      return;
    }

    if (!audioUrl) {
      Alert.alert('提示', '该单词暂无发音');
      return;
    }

    try {
      setIsPlaying(true);

      // Stop any existing sound
      if (sound) {
        await sound.unloadAsync();
      }

      // Configure audio session only for native platforms
      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
          playThroughEarpieceAndroid: false,
        });
      }

      // Load and play sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );

      setSound(newSound);

      // Set up playback status listener
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });

    } catch (error) {
      console.error('Audio playback error:', error);
      Alert.alert('播放失败', '无法播放该音频，请检查网络连接');
      setIsPlaying(false);
    }
  };

  // Cleanup sound when component unmounts
  React.useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  return (
    <TouchableOpacity 
      style={[styles.button, style]} 
      onPress={playAudio}
      disabled={isPlaying}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      {isPlaying ? (
        <Feather name="volume-x" color={color} size={size} />
      ) : (
        <Feather name="volume-2" color={color} size={size} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
});