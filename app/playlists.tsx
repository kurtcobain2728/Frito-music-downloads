import { CreatePlaylistModal } from '@/components/CreatePlaylistModal';
import { ScreenWithPlayer } from '@/components/ScreenWithPlayer';
import { BorderRadius, Layout, Spacing, Typography } from '@/constants/theme';
import { useTheme, type ThemeColors } from '@/contexts/ThemeContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import type { Playlist } from '@/types/audio';
import { formatTrackCount } from '@/utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PlaylistCardProps {
  playlist: Playlist;
  onPress: (playlist: Playlist) => void;
  colors: ThemeColors;
}

function PlaylistCard({ playlist, onPress, colors }: PlaylistCardProps) {
  return (
    <TouchableOpacity
      style={[styles.playlistCard, { backgroundColor: colors.backgroundElevated }]}
      onPress={() => onPress(playlist)}
      activeOpacity={0.7}
    >
      <View style={styles.playlistArtwork}>
        {playlist.artwork ? (
          <Image source={{ uri: playlist.artwork }} style={styles.artwork} />
        ) : (
          <LinearGradient colors={[colors.primary + '60', colors.primary + '30']} style={styles.artworkPlaceholder}>
            <Ionicons name="musical-notes" size={28} color={colors.primary} />
          </LinearGradient>
        )}
      </View>

      <View style={styles.playlistInfo}>
        <Text style={[styles.playlistName, { color: colors.textPrimary }]} numberOfLines={1}>
          {playlist.name}
        </Text>
        <Text style={[styles.playlistTracks, { color: colors.textSecondary }]}>
          {formatTrackCount(playlist.trackCount)}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

export default function PlaylistsScreen() {
  const insets = useSafeAreaInsets();
  const { playlists, createPlaylist } = useFavorites();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { theme } = useTheme();
  const c = theme.colors;

  const handleBack = () => {
    router.back();
  };

  const handlePlaylistPress = useCallback((playlist: Playlist) => {
    router.push({
      pathname: '/playlist/[id]' as any,
      params: { id: playlist.id, name: playlist.name },
    });
  }, []);

  const handleCreatePlaylist = useCallback(
    async (name: string) => {
      await createPlaylist(name);
      setShowCreateModal(false);
    },
    [createPlaylist],
  );

  const renderPlaylistItem = useCallback(
    ({ item }: { item: Playlist }) => <PlaylistCard playlist={item} onPress={handlePlaylistPress} colors={c} />,
    [handlePlaylistPress, c],
  );

  const keyExtractor = useCallback((item: Playlist) => item.id, []);

  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient colors={[c.primary, c.primaryDark]} style={styles.iconContainer}>
        <Ionicons name="list" size={48} color="white" />
      </LinearGradient>

      <Text style={[styles.title, { color: c.textPrimary }]}>Listas de Reproducción</Text>
      <Text style={[styles.subtitle, { color: c.textSecondary }]}>
        {playlists.length} lista{playlists.length !== 1 ? 's' : ''}
      </Text>

      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: c.primary }]}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add" size={20} color={c.background} />
        <Text style={[styles.createButtonText, { color: c.background }]}>Crear lista</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="list-outline" size={64} color={c.textMuted} />
      <Text style={[styles.emptyTitle, { color: c.textPrimary }]}>Sin listas</Text>
      <Text style={[styles.emptyText, { color: c.textSecondary }]}>Crea tu primera lista de reproducción</Text>
    </View>
  );

  return (
    <ScreenWithPlayer>
      <View style={[styles.container, { backgroundColor: c.background, paddingTop: insets.top }]}>
        <LinearGradient colors={[c.primary + '40', c.background]} style={styles.gradient} />

        <TouchableOpacity style={[styles.backButton, { top: insets.top + Spacing.sm }]} onPress={handleBack}>
          <Ionicons name="chevron-back" size={28} color={c.textPrimary} />
        </TouchableOpacity>

        <FlatList
          data={playlists}
          renderItem={renderPlaylistItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={[
            styles.listContent,
            playlists.length === 0 && styles.listContentEmpty,
            { paddingBottom: Layout.screenPaddingBottom + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        />

        <CreatePlaylistModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreatePlaylist}
        />
      </View>
    </ScreenWithPlayer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 350,
  },
  backButton: {
    position: 'absolute',
    left: Spacing.base,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 22,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.base,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.lg,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  createButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    marginLeft: Spacing.sm,
  },
  playlistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  playlistArtwork: {
    width: 56,
    height: 56,
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
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: 2,
  },
  playlistTracks: {
    fontSize: Typography.fontSize.sm,
  },
  listContent: {
    flexGrow: 1,
  },
  listContentEmpty: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    marginTop: 50,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
  },
});
