import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';

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
  console.log('🔊🔊🔊 AudioPlayer COMPONENT RENDERED 🔊🔊🔊');
  console.log('🔊🔊🔊 audioUrl =', audioUrl);
  console.log('🔊🔊🔊 size =', size);
  console.log('🔊🔊🔊 color =', color);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // Add render-time logging
  console.log('🎵 AudioPlayer: rendering with audioUrl =', audioUrl, 'isPlaying =', isPlaying);

  const playAudio = async () => {
    console.log('🎵 AudioPlayer: playAudio called');
    console.log('🎵 AudioPlayer: audioUrl =', audioUrl);
    console.log('🎵 AudioPlayer: isPlaying =', isPlaying);
    
    if (onPress) {
      console.log('🎵 AudioPlayer: calling onPress callback');
      onPress();
    }
    
    if (isPlaying) {
      console.log('🎵 AudioPlayer: already playing, returning');
      return;
    }

    if (!audioUrl) {
      console.log('🎵 AudioPlayer: no audioUrl, showing alert');
      Alert.alert('提示', '该单词暂无发音');
      return;
    }

    try {
      console.log('🎵 AudioPlayer: starting audio playback');
      setIsPlaying(true);

      // Stop any existing sound
      if (sound) {
        console.log('🎵 AudioPlayer: unloading existing sound');
        await sound.unloadAsync();
      }

      // Configure audio session only for native platforms
      if (Platform.OS !== 'web') {
        console.log('🎵 AudioPlayer: setting audio mode');
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          playThroughEarpieceAndroid: false,
        });
      }

      // Load and play sound
      console.log('🎵 AudioPlayer: creating sound from URL:', audioUrl);
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );

      console.log('🎵 AudioPlayer: sound created successfully');
      setSound(newSound);

      // Set up playback status listener
      newSound.setOnPlaybackStatusUpdate((status) => {
        console.log('🎵 AudioPlayer: playback status update:', status);
        if (status.isLoaded && status.didJustFinish) {
          console.log('🎵 AudioPlayer: playback finished');
          setIsPlaying(false);
        }
        // Check if status has error property (for AVPlaybackStatusError)
        if ('error' in status && status.error) {
          console.error('🎵 AudioPlayer: playback status error:', status.error);
        }
      });

    } catch (error) {
      console.error('🎵 AudioPlayer: playback error:', error);
      console.error('🎵 AudioPlayer: error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      
      // Try to provide more specific error messages
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('no supported source was found')) {
        Alert.alert('播放失败', '音频格式不支持或URL无效，请检查网络连接');
      } else if (errorMessage.includes('network')) {
        Alert.alert('播放失败', '网络连接错误，请检查网络设置');
      } else {
        Alert.alert('播放失败', `无法播放该音频: ${errorMessage}`);
      }
      
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

  const handlePress = () => {
    console.log('🎵 AudioPlayer: TouchableOpacity pressed');
    playAudio();
  };

  return (
    <TouchableOpacity 
      style={[styles.button, style]} 
      onPress={handlePress}
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