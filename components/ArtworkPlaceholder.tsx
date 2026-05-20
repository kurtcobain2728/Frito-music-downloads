import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { hashToGradient } from '@/utils/formatters';

interface ArtworkPlaceholderProps {
  trackId: string;
  size: number;
  iconSize?: number;
  borderRadius?: number;
}

function ArtworkPlaceholderComponent({ trackId, size, iconSize, borderRadius = 0 }: ArtworkPlaceholderProps) {
  const gradientColors = useMemo(() => hashToGradient(trackId), [trackId]);

  const calculatedIconSize = iconSize || size * 0.38;

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius }]}>
      <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
        <Ionicons name="musical-notes" size={calculatedIconSize} color="rgba(255, 255, 255, 0.55)" />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  gradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const ArtworkPlaceholder = React.memo(ArtworkPlaceholderComponent);
export default ArtworkPlaceholder;
