import React, { memo, useRef, useCallback } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { usePlayer } from '@/contexts/PlayerContext';
import type { Track } from '@/types/audio';
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated';

interface QueueModalProps {
  visible: boolean;
  onClose: () => void;
}

interface QueueItemProps {
  track: Track;
  index: number;
  isCurrentTrack: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['theme']['colors'];
}

function QueueItem({ track, index, isCurrentTrack, onPress, colors }: QueueItemProps) {
  return (
    <Animated.View entering={FadeInRight.delay(Math.min(index * 20, 500)).duration(200)}>
      <TouchableOpacity
        style={[styles.queueItem, isCurrentTrack && { backgroundColor: colors.primary + '15' }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.indexContainer}>
          {isCurrentTrack ? (
            <Ionicons name="musical-notes" size={18} color={colors.primary} />
          ) : (
            <Text style={[styles.indexText, { color: colors.textMuted }]}>{index + 1}</Text>
          )}
        </View>

        <View style={styles.trackInfo}>
          <Text
            style={[styles.trackTitle, { color: colors.textPrimary }, isCurrentTrack && { color: colors.primary }]}
            numberOfLines={1}
          >
            {track.title}
          </Text>
          <Text style={[styles.trackArtist, { color: colors.textSecondary }]} numberOfLines={1}>
            {track.artist}
          </Text>
        </View>

        {isCurrentTrack && (
          <View style={[styles.nowPlayingBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.nowPlayingText, { color: colors.background }]}>Reproduciendo</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

function QueueModalComponent({ visible, onClose }: QueueModalProps) {
  const { state, controls } = usePlayer();
  const { theme } = useTheme();
  const c = theme.colors;
  const { queue, currentIndex, currentTrack } = state;
  const listRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  const handleTrackPress = useCallback(
    (track: Track) => {
      controls.playTrack(track, queue);
      onClose();
    },
    [controls, queue, onClose],
  );

  const handleScrollToIndexFailed = useCallback(
    (info: { index: number; highestMeasuredFrameIndex: number; averageItemLength: number }) => {
      setTimeout(() => {
        listRef.current?.scrollToIndex({ index: info.index, animated: false });
      }, 100);
    },
    [],
  );

  const renderQueueItem = ({ item, index }: { item: Track; index: number }) => (
    <QueueItem
      track={item}
      index={index}
      isCurrentTrack={currentTrack?.id === item.id}
      onPress={() => handleTrackPress(item)}
      colors={c}
    />
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <Animated.View
          entering={FadeIn.duration(200)}
          style={[styles.container, { backgroundColor: c.backgroundElevated, paddingBottom: insets.bottom + 20 }]}
        >
          <View style={[styles.handle, { backgroundColor: c.surfaceBorder }]} />

          <View style={[styles.header, { borderBottomColor: c.surfaceBorder }]}>
            <Text style={[styles.title, { color: c.textPrimary }]}>Cola de reproducción</Text>
            <Text style={[styles.subtitle, { color: c.textSecondary }]}>
              {queue.length} cancion{queue.length !== 1 ? 'es' : ''}
            </Text>
          </View>

          {queue.length > 0 ? (
            <FlatList
              ref={listRef}
              data={queue}
              renderItem={renderQueueItem}
              keyExtractor={item => item.id}
              style={styles.list}
              showsVerticalScrollIndicator={false}
              initialScrollIndex={Math.max(0, currentIndex - 2)}
              getItemLayout={(_data, index) => ({
                length: 64,
                offset: 64 * index,
                index,
              })}
              onScrollToIndexFailed={handleScrollToIndexFailed}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="list-outline" size={48} color={c.textMuted} />
              <Text style={[styles.emptyText, { color: c.textSecondary }]}>La cola está vacía</Text>
              <Text style={[styles.emptySubtext, { color: c.textMuted }]}>Selecciona una canción para empezar</Text>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  container: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.base,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.base,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
  },
  list: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  indexContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  indexText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: 2,
  },
  trackArtist: {
    fontSize: Typography.fontSize.sm,
  },
  nowPlayingBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  nowPlayingText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    marginTop: Spacing.base,
  },
  emptySubtext: {
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing.xs,
  },
});

export const QueueModal = memo(QueueModalComponent);
export default QueueModal;
