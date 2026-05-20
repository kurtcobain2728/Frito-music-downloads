import React, { memo, useCallback, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, FlatList, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import type { Track, Playlist } from '@/types/audio';

interface AddToPlaylistModalProps {
  visible: boolean;
  track: Track | null;
  onClose: () => void;
}

interface PlaylistItemProps {
  playlist: Playlist;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['theme']['colors'];
}

function PlaylistItem({ playlist, onPress, colors }: PlaylistItemProps) {
  return (
    <TouchableOpacity style={styles.playlistItem} onPress={onPress}>
      <View style={styles.playlistArtwork}>
        {playlist.artwork ? (
          <Image source={{ uri: playlist.artwork }} style={styles.artwork} />
        ) : (
          <LinearGradient colors={[colors.primary + '60', colors.primary + '30']} style={styles.artworkPlaceholder}>
            <Ionicons name="musical-notes" size={20} color={colors.primary} />
          </LinearGradient>
        )}
      </View>

      <View style={styles.playlistInfo}>
        <Text style={[styles.playlistName, { color: colors.textPrimary }]} numberOfLines={1}>
          {playlist.name}
        </Text>
        <Text style={[styles.playlistTracks, { color: colors.textSecondary }]}>{playlist.trackCount} canciones</Text>
      </View>

      <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
    </TouchableOpacity>
  );
}

function AddToPlaylistModalComponent({ visible, track, onClose }: AddToPlaylistModalProps) {
  const { playlists, addToPlaylist } = useFavorites();
  const { theme } = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToPlaylist = useCallback(
    async (playlistId: string) => {
      if (!track || isAdding) return;
      setIsAdding(true);
      try {
        addToPlaylist(playlistId, [track]);
        onClose();
      } finally {
        setIsAdding(false);
      }
    },
    [track, isAdding, addToPlaylist, onClose],
  );

  const renderPlaylist = ({ item }: { item: Playlist }) => (
    <PlaylistItem playlist={item} onPress={() => handleAddToPlaylist(item.id)} colors={c} />
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={[styles.container, { backgroundColor: c.backgroundElevated, paddingBottom: insets.bottom + 20 }]}>
          <View style={[styles.handle, { backgroundColor: c.surfaceBorder }]} />

          <View style={[styles.header, { borderBottomColor: c.surfaceBorder }]}>
            <Text style={[styles.title, { color: c.textPrimary }]}>Agregar a lista</Text>
            {track && (
              <Text style={[styles.trackName, { color: c.textSecondary }]} numberOfLines={1}>
                {track.title}
              </Text>
            )}
          </View>

          {playlists.length > 0 ? (
            <FlatList
              data={playlists}
              renderItem={renderPlaylist}
              keyExtractor={item => item.id}
              style={styles.list}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="list-outline" size={48} color={c.textMuted} />
              <Text style={[styles.emptyText, { color: c.textSecondary }]}>No tienes listas de reproducción</Text>
              <Text style={[styles.emptySubtext, { color: c.textMuted }]}>Crea una desde la sección "Más"</Text>
            </View>
          )}
        </View>
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
    maxHeight: '50%',
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
  trackName: {
    fontSize: Typography.fontSize.sm,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  playlistArtwork: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    marginRight: Spacing.md,
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  artworkPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: 2,
  },
  playlistTracks: {
    fontSize: Typography.fontSize.sm,
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

export const AddToPlaylistModal = memo(AddToPlaylistModalComponent);
export default AddToPlaylistModal;
