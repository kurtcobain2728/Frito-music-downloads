import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { ArtistResult, TrackResult, AlbumResult } from '@/contexts/MusicDownloadContext';
import { getArtistTopTracks, getArtistAlbums } from '@/utils/musicSearch';

interface ArtistProfileCardProps {
  artist: ArtistResult;
  onClose: () => void;
  onTrackSelect: (track: TrackResult) => void;
  onAlbumSelect: (album: AlbumResult) => void;
}

export function ArtistProfileCard({ artist, onClose, onTrackSelect, onAlbumSelect }: ArtistProfileCardProps) {
  const { theme } = useTheme();
  const c = theme.colors;

  const [topTracks, setTopTracks] = useState<TrackResult[]>([]);
  const [albums, setAlbums] = useState<AlbumResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtistData = async () => {
      setLoading(true);
      try {
        const [tracksData, albumsData] = await Promise.all([getArtistTopTracks(artist.id), getArtistAlbums(artist.id)]);
        setTopTracks(tracksData);
        setAlbums(albumsData);
      } catch (err) {
        console.error('Error fetching artist data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchArtistData();
  }, [artist.id]);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: artist.imageUrl }} style={styles.image} />
          <LinearGradient colors={['transparent', c.background]} style={styles.gradient} />

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <View style={[styles.closeBg, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
              <Ionicons name="chevron-down" size={24} color="#FFF" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={[styles.name, { color: c.textPrimary }]}>{artist.name}</Text>
          <Text style={[styles.platform, { color: c.primary }]}>Plataforma: {artist.platform}</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={c.primary} style={{ marginTop: Spacing.xl }} />
        ) : (
          <>
            {/* Top Canciones */}
            {topTracks.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Populares</Text>
                {topTracks.map((track, index) => (
                  <TouchableOpacity key={track.id} style={styles.trackItem} onPress={() => onTrackSelect(track)}>
                    <Text style={[styles.trackNumber, { color: c.textSecondary }]}>{index + 1}</Text>
                    <Image source={{ uri: track.imageUrl }} style={styles.trackImage} />
                    <View style={styles.trackInfo}>
                      <Text style={[styles.trackName, { color: c.textPrimary }]} numberOfLines={1}>
                        {track.name}
                      </Text>
                    </View>
                    <Ionicons name="download-outline" size={24} color={c.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Álbumes */}
            {albums.length > 0 && (
              <View style={[styles.section, styles.lastSection]}>
                <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Álbumes</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.albumsScroll}
                >
                  {albums.map(album => (
                    <TouchableOpacity key={album.id} style={styles.albumCard} onPress={() => onAlbumSelect(album)}>
                      <Image source={{ uri: album.imageUrl }} style={styles.albumImage} />
                      <Text style={[styles.albumName, { color: c.textPrimary }]} numberOfLines={2}>
                        {album.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  imageContainer: {
    width: '100%',
    height: 250,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  closeBtn: {
    position: 'absolute',
    top: Spacing.xl,
    left: Spacing.base,
  },
  closeBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  name: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs,
  },
  platform: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.xs,
    textTransform: 'capitalize',
  },
  section: {
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.md,
  },
  lastSection: {
    paddingBottom: Spacing['3xl'],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.md,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  trackNumber: {
    width: 25,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  trackImage: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  trackInfo: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  trackName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  albumsScroll: {
    paddingRight: Spacing.base,
  },
  albumCard: {
    width: 140,
    marginRight: Spacing.md,
  },
  albumImage: {
    width: 140,
    height: 140,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  albumName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
});
