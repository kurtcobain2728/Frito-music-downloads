import { BorderRadius, Layout, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import type { Track } from '@/types/audio';
import { formatDuration } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { OptimizedArtwork } from './OptimizedArtwork';

interface TrackItemProps {
  track: Track;
  isPlaying?: boolean;
  isCurrent?: boolean;
  index?: number;
  showIndex?: boolean;
  showHeart?: boolean;
  onPress: (track: Track) => void;
  onOptionsPress?: (track: Track) => void;
}

const isLosslessFormat = (format: string): boolean =>
  ['flac', 'wav', 'aiff', 'ape', 'dff', 'dsf'].includes(format.toLowerCase());

const getDisplayFormat = (track: Track): string => {
  if (track.format && track.format !== 'unknown') return track.format.toUpperCase();
  return (track.filename.split('.').pop()?.toLowerCase() || '').toUpperCase();
};

function TrackItemComponent({
  track,
  isPlaying = false,
  isCurrent = false,
  index,
  showIndex = false,
  showHeart = false,
  onPress,
  onOptionsPress,
}: TrackItemProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(track.id);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = useCallback(() => onPress(track), [onPress, track]);
  const handleOptionsPress = useCallback(() => onOptionsPress?.(track), [onOptionsPress, track]);
  const handleHeartPress = useCallback(() => toggleFavorite(track), [toggleFavorite, track]);
  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, { damping: 20, stiffness: 400 });
  }, []);
  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 20, stiffness: 400 });
  }, []);

  const displayFormat = getDisplayFormat(track);
  const isLossless = isLosslessFormat(track.format);

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={[
          styles.container,
          isCurrent && {
            backgroundColor: c.backgroundHighlight,
            marginHorizontal: Spacing.xs,
            borderRadius: BorderRadius.sm,
          },
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.leftSection}>
          {showIndex && index !== undefined ? (
            <View style={styles.indexContainer}>
              {isPlaying ? (
                <Ionicons name="musical-notes" size={16} color={c.primary} />
              ) : (
                <Text
                  style={[
                    styles.indexText,
                    isCurrent && { color: c.primary },
                    !isCurrent && { color: c.textSecondary },
                  ]}
                >
                  {index + 1}
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.artworkContainer}>
              <OptimizedArtwork
                uri={track.artwork}
                trackUri={track.uri}
                trackId={track.id}
                size={48}
                borderRadius={BorderRadius.sm}
              />
              {isPlaying && (
                <View style={styles.playingOverlay}>
                  <Ionicons name="volume-high" size={16} color={c.primary} />
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: isCurrent ? c.primary : c.textPrimary }]} numberOfLines={1}>
              {track.title}
            </Text>
            {displayFormat && (
              <View style={[styles.formatBadge, { backgroundColor: isLossless ? c.primary : c.backgroundHighlight }]}>
                <Text style={[styles.formatText, { color: isLossless ? '#000' : c.textSecondary }]}>
                  {displayFormat}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.artist, { color: c.textSecondary }]} numberOfLines={1}>
            {track.artist}
          </Text>
        </View>

        <View style={styles.rightSection}>
          {showHeart && (
            <Pressable
              style={styles.heartButton}
              onPress={handleHeartPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={favorite ? 'heart' : 'heart-outline'}
                size={20}
                color={favorite ? '#FF6B6B' : c.textMuted}
              />
            </Pressable>
          )}
          <Text style={[styles.duration, { color: c.textMuted }]}>{formatDuration(track.duration)}</Text>
          {onOptionsPress && (
            <Pressable
              style={styles.optionsButton}
              onPress={handleOptionsPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="ellipsis-horizontal" size={18} color={c.textMuted} />
            </Pressable>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: Layout.trackItemHeight,
    paddingHorizontal: Spacing.base,
    backgroundColor: 'transparent',
  },
  leftSection: { marginRight: Spacing.md },
  indexContainer: { width: 32, alignItems: 'center', justifyContent: 'center' },
  indexText: { fontSize: Typography.fontSize.base },
  artworkContainer: { width: 48, height: 48, borderRadius: BorderRadius.sm, overflow: 'hidden' },
  playingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: { flex: 1, justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.medium, marginBottom: 2, flex: 1 },
  artist: { fontSize: Typography.fontSize.sm },
  formatBadge: { marginLeft: Spacing.xs, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 },
  formatText: { fontSize: 9, fontWeight: '700' },
  rightSection: { flexDirection: 'row', alignItems: 'center' },
  heartButton: { padding: Spacing.xs, marginRight: Spacing.xs },
  duration: { fontSize: Typography.fontSize.sm, marginRight: Spacing.xs, minWidth: 36, textAlign: 'right' },
  optionsButton: { padding: Spacing.xs },
});

export const TrackItem = memo(TrackItemComponent);
export default TrackItem;
