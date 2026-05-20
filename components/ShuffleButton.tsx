import React, { useEffect } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface ShuffleButtonProps {
  isActive: boolean;
  onPress: () => void;
  size?: number;
}

function ShuffleButtonComponent({ isActive, onPress, size = 22 }: ShuffleButtonProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      scale.value = withSequence(
        withSpring(1.3, { damping: 10, stiffness: 200 }),
        withSpring(1, { damping: 10, stiffness: 200 }),
      );
      rotation.value = withSpring(360, { damping: 15, stiffness: 100 });
    } else {
      scale.value = withSpring(1, { damping: 12 });
      rotation.value = withSpring(0, { damping: 15 });
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
    backgroundColor: isActive ? `${c.primary}25` : 'transparent',
  }));

  return (
    <TouchableOpacity onPress={onPress} style={styles.container} activeOpacity={0.7}>
      <Animated.View style={[styles.iconContainer, animatedStyle]}>
        <Ionicons name="shuffle" size={size} color={isActive ? c.primary : c.textSecondary} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const ShuffleButton = React.memo(ShuffleButtonComponent);
export default ShuffleButton;
