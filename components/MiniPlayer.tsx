import { BorderRadius, Layout, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { usePlaybackPosition, usePlaybackMetadata, usePlaybackControls } from '@/contexts/PlayerContext';
import { calculateProgress } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { memo, useCallback, useRef } from 'react';
import { PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { OptimizedArtwork } from './OptimizedArtwork';

function MiniPlayerComponent() {
  const { currentTrack, isPlaying } = usePlaybackMetadata();
  const { position, duration } = usePlaybackPosition();
  const controls = usePlaybackControls();
  const { theme } = useTheme();
  const c = theme.colors;

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const swipeHandled = useRef(false);

  const SWIPE_H_THRESHOLD = 60;
  const SWIPE_V_THRESHOLD = 40;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) =>
        (Math.abs(gs.dx) > 10 && Math.abs(gs.dx) > Math.abs(gs.dy)) ||
        (gs.dy < -10 && Math.abs(gs.dy) > Math.abs(gs.dx)),
      onPanResponderGrant: () => {
        swipeHandled.current = false;
      },
      onPanResponderMove: (_, gs) => {
        if (Math.abs(gs.dx) > Math.abs(gs.dy)) {
          translateX.value = gs.dx;
        } else if (gs.dy < 0) {
          translateY.value = gs.dy;
        }

        if (!swipeHandled.current) {
          if (gs.dy < -SWIPE_V_THRESHOLD && Math.abs(gs.dy) > Math.abs(gs.dx)) {
            swipeHandled.current = true;
            router.push('/modal');
          } else if (gs.dx < -SWIPE_H_THRESHOLD) {
            swipeHandled.current = true;
            controls.next();
          } else if (gs.dx > SWIPE_H_THRESHOLD) {
            swipeHandled.current = true;
            controls.previous();
          }
        }
      },
      onPanResponderRelease: () => {
        translateX.value = withSpring(0, { damping: 15, stiffness: 200 });
        translateY.value = withSpring(0, { damping: 15, stiffness: 200 });
      },
      onPanResponderTerminate: () => {
        translateX.value = withSpring(0, { damping: 15, stiffness: 200 });
        translateY.value = withSpring(0, { damping: 15, stiffness: 200 });
      },
    }),
  ).current;

  const swipeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value * 0.3 }, { translateY: Math.min(0, translateY.value * 0.3) }],
    opacity: 1 - Math.abs(translateX.value) / 300,
  }));

  const handlePress = useCallback(() => {
    router.push('/modal');
  }, []);
  const handlePlayPause = useCallback(() => {
    controls.togglePlayPause();
  }, [controls]);
  const handleNext = useCallback(() => {
    controls.next();
  }, [controls]);

  if (!currentTrack) return null;

  const progress = calculateProgress(position, duration);

  const innerContent = (
    <>
      <View style={[styles.progressContainer, { backgroundColor: c.progressBar }]}>
        <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: c.primary }]} />
      </View>
      <View style={styles.content}>
        <View style={styles.artworkContainer}>
          <OptimizedArtwork
            uri={currentTrack.artwork}
            trackUri={currentTrack.uri}
            trackId={currentTrack.id}
            size={48}
            borderRadius={BorderRadius.sm}
          />
        </View>
        <View style={styles.trackInfo}>
          <Text style={[styles.title, { color: c.textPrimary }]} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={[styles.artist, { color: c.textSecondary }]} numberOfLines={1}>
            {currentTrack.artist}
          </Text>
        </View>
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handlePlayPause}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color={c.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleNext}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="play-forward" size={24} color={c.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  return (
    <Animated.View style={[styles.container, { ...Shadows.lg }, swipeAnimatedStyle]} {...panResponder.panHandlers}>
      <TouchableOpacity style={styles.touchable} onPress={handlePress} activeOpacity={0.95}>
        <LinearGradient
          colors={[c.backgroundHighlight, c.backgroundElevated]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.background}
        >
          {innerContent}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: Spacing.sm,
    right: Spacing.sm,
    height: Layout.miniPlayerHeight,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  background: { flex: 1 },
  progressContainer: { height: 2 },
  progressBar: { height: '100%' },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  artworkContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    marginRight: Spacing.md,
  },
  trackInfo: { flex: 1, justifyContent: 'center' },
  title: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: 2,
  },
  artist: { fontSize: Typography.fontSize.sm },
  controls: { flexDirection: 'row', alignItems: 'center' },
  controlButton: { padding: Spacing.sm },
  touchable: { flex: 1 },
});

export const MiniPlayer = memo(MiniPlayerComponent);
export default MiniPlayer;
