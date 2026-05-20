import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useMusicDownload, TrackResult, AlbumResult, ArtistResult } from '@/contexts/MusicDownloadContext';

type TabType = 'tracks' | 'albums' | 'artists';

interface SearchResultsListProps {
  onTrackSelect: (track: TrackResult) => void;
  onAlbumSelect: (album: AlbumResult) => void;
  onArtistSelect: (artist: ArtistResult) => void;
}

export function SearchResultsList({ onTrackSelect, onAlbumSelect, onArtistSelect }: SearchResultsListProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { searchResults, isSearching } = useMusicDownload();
  const [activeTab, setActiveTab] = useState<TabType>('tracks');

  if (isSearching) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={c.primary} />
        <Text style={[styles.loadingText, { color: c.textSecondary }]}>Buscando música...</Text>
      </View>
    );
  }

  if (!searchResults) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="musical-notes-outline" size={64} color={c.textMuted} />
        <Text style={[styles.emptyText, { color: c.textMuted }]}>
          Busca a tu artista favorito o el nombre de una canción
        </Text>
      </View>
    );
  }

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      {(['tracks', 'albums', 'artists'] as TabType[]).map(tab => {
        const isActive = activeTab === tab;
        const labels: Record<TabType, string> = { tracks: 'Canciones', albums: 'Álbumes', artists: 'Artistas' };

        return (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, isActive && { borderBottomColor: c.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                { color: isActive ? c.textPrimary : c.textSecondary },
                isActive && { fontWeight: Typography.fontWeight.bold },
              ]}
            >
              {labels[tab]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderTrackItem = ({ item }: { item: TrackResult }) => (
    <TouchableOpacity style={styles.resultItem} onPress={() => onTrackSelect(item)}>
      <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: c.textPrimary }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.itemSub, { color: c.textSecondary }]} numberOfLines={1}>
          {item.artists} • {item.album}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.downloadBtn, { backgroundColor: c.backgroundElevated }]}
        onPress={() => onTrackSelect(item)}
      >
        <Ionicons name="download-outline" size={20} color={c.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderAlbumItem = ({ item }: { item: AlbumResult }) => (
    <TouchableOpacity style={styles.resultItem} onPress={() => onAlbumSelect(item)}>
      <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: c.textPrimary }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.itemSub, { color: c.textSecondary }]} numberOfLines={1}>
          {item.artists}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={c.textMuted} />
    </TouchableOpacity>
  );

  const renderArtistItem = ({ item }: { item: ArtistResult }) => (
    <TouchableOpacity style={styles.resultItem} onPress={() => onArtistSelect(item)}>
      <Image source={{ uri: item.imageUrl }} style={[styles.itemImage, { borderRadius: 25 }]} />
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: c.textPrimary }]} numberOfLines={1}>
          {item.name}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={c.textMuted} />
    </TouchableOpacity>
  );

  const data = searchResults[activeTab];

  return (
    <View style={styles.container}>
      {renderTabs()}
      <FlatList
        data={data as any}
        keyExtractor={item => item.id}
        renderItem={
          activeTab === 'tracks'
            ? (renderTrackItem as any)
            : activeTab === 'albums'
              ? (renderAlbumItem as any)
              : (renderArtistItem as any)
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={{ color: c.textMuted }}>No se encontraron resultados.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.sm,
  },
  emptyText: {
    marginTop: Spacing.md,
    textAlign: 'center',
    fontSize: Typography.fontSize.md,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: Spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  tabText: {
    fontSize: Typography.fontSize.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xl,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#333',
  },
  itemInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: 2,
  },
  itemSub: {
    fontSize: Typography.fontSize.sm,
  },
  downloadBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
});
