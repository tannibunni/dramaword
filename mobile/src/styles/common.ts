import { Platform } from 'react-native';

type ShadowProps = {
  elevation: number;
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
};

/**
 * Generates platform-specific shadow styles.
 * @param elevation - The elevation level (1-5). Higher means more shadow.
 * @param color - The shadow color.
 * @returns Platform-specific style object for shadow.
 */
export const generateShadow = (elevation: number = 3, color: string = '#000'): ShadowProps => {
  if (elevation === 0) {
    return { elevation: 0 };
  }

  const shadowOpacity = 0.08 + (elevation * 0.02);
  const shadowRadius = 2 + elevation * 2;
  const shadowOffset = {
    width: 0,
    height: 1 + elevation,
  };

  if (Platform.OS === 'web') {
    return {
      elevation,
      shadowColor: color,
      shadowOffset,
      shadowOpacity,
      shadowRadius,
      // Using a more direct boxShadow for web
      boxShadow: `${shadowOffset.width}px ${shadowOffset.height}px ${shadowRadius}px rgba(0,0,0,${shadowOpacity})`,
    } as any;
  }

  return {
    elevation,
    shadowColor: color,
    shadowOffset,
    shadowOpacity,
    shadowRadius,
  };
}; 