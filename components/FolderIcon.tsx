import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius } from '@/constants/theme';
import { hashToGradient } from '@/utils/formatters';

interface FolderIconProps {
  folderName: string;
  size?: number;
  trackCount?: number;
}

function FolderIconComponent({ folderName, size = 48, trackCount }: FolderIconProps) {
  const gradientColors = useMemo(() => hashToGradient(folderName), [folderName]);

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: BorderRadius.sm }]}>
      <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
        <Ionicons name="folder" size={size * 0.45} color="rgba(255, 255, 255, 0.9)" />
        {trackCount !== undefined && trackCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{trackCount > 999 ? '999+' : trackCount}</Text>
          </View>
        )}
      </LinearGradient>
      <View style={styles.shine} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  gradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});

export const FolderIcon = React.memo(FolderIconComponent);
export default FolderIcon;
