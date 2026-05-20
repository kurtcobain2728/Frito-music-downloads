import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { AlbumResult, TrackResult } from '@/contexts/MusicDownloadContext';
import { getAlbumTracks } from '@/utils/musicSearch';

interface AlbumProfileCardProps {
  album: AlbumResult;
  onClose: () => void;
  onDownloadAlbum: (tracks: TrackResult[]) => void;
  onTrackSelect: (track: TrackResult) => void;
}

export function AlbumProfileCard({ album, onClose, onDownloadAlbum, onTrackSelect }: AlbumProfileCardProps) {
  const { theme } = useTheme();
  const c = theme.colors;

  const [tracks, setTracks] = useState<TrackResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTracks = async () => {
      setLoading(true);
      try {
        const result = await getAlbumTracks(album.id, album.imageUrl, album.name);
        setTracks(result);
      } catch (err) {
        console.error('Error fetching album tracks:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTracks();
  }, [album.id]);

  const handleDownloadAll = () => {
    if (tracks.length > 0) {
      onDownloadAlbum(tracks);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: album.imageUrl }} style={styles.image} />
          <LinearGradient colors={['transparent', c.background]} style={styles.gradient} />

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <View style={[styles.closeBg, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
              <Ionicons name="chevron-down" size={24} color="#FFF" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={[styles.name, { color: c.textPrimary }]}>{album.name}</Text>
          <Text style={[styles.platform, { color: c.primary }]}>Plataforma: {album.platform}</Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.downloadBtn, { backgroundColor: c.primary }]}
              onPress={handleDownloadAll}
              disabled={loading || tracks.length === 0}
            >
              <Ionicons name="download" size={24} color="#000" />
              <Text style={styles.downloadText}>Descargar Álbum</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tracksSection}>
          <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Canciones</Text>
          {loading ? (
            <ActivityIndicator size="large" color={c.primary} style={{ marginTop: Spacing.xl }} />
          ) : tracks.length > 0 ? (
            tracks.map((track, index) => (
              <TouchableOpacity key={track.id} style={styles.trackItem} onPress={() => onTrackSelect(track)}>
                <Text style={[styles.trackNumber, { color: c.textSecondary }]}>{index + 1}</Text>
                <View style={styles.trackInfo}>
                  <Text style={[styles.trackName, { color: c.textPrimary }]} numberOfLines={1}>
                    {track.name}
                  </Text>
                  <Text style={[styles.trackArtist, { color: c.textSecondary }]} numberOfLines={1}>
                    {track.artists}
                  </Text>
                </View>
                <Ionicons name="download-outline" size={24} color={c.textSecondary} />
              </TouchableOpacity>
            ))
          ) : (
            <Text style={{ color: c.textSecondary, textAlign: 'center' }}>No se encontraron canciones.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: 300,
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
    zIndex: 10,
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
    paddingBottom: Spacing.lg,
  },
  name: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs,
  },
  platform: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.lg,
    textTransform: 'capitalize',
  },
  actions: {
    flexDirection: 'row',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  downloadText: {
    color: '#000',
    fontWeight: Typography.fontWeight.bold,
    fontSize: Typography.fontSize.md,
    marginLeft: Spacing.sm,
  },
  tracksSection: {
    paddingHorizontal: Spacing.base,
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  trackNumber: {
    width: 30,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
  },
  trackInfo: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  trackName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: 2,
  },
  trackArtist: {
    fontSize: Typography.fontSize.sm,
  },
});
