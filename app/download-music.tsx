import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';

import { Typography, Spacing, Layout } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useMusicDownload, TrackResult, AlbumResult, ArtistResult } from '@/contexts/MusicDownloadContext';
import { downloadFile, getDestinationPath } from '@/utils/musicDownloader';
import { getDownloadUrlForTrack } from '@/utils/musicSearch';

// Componentes UI
import { ExtensionPicker } from '@/components/download/ExtensionPicker';
import { QualityPicker } from '@/components/download/QualityPicker';
import { DownloadSearchBar } from '@/components/download/DownloadSearchBar';
import { SearchResultsList } from '@/components/download/SearchResultsList';
import { ArtistProfileCard } from '@/components/download/ArtistProfileCard';
import { AlbumProfileCard } from '@/components/download/AlbumProfileCard';
import { DownloadConfirmModal } from '@/components/download/DownloadConfirmModal';
import { CustomAlert } from '@/components/common/CustomAlert';
import { DownloadProgressModal } from '@/components/download/DownloadProgressModal';

export default function DownloadMusicScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const c = theme.colors;
  const { selectedExtensionId } = useMusicDownload();

  const [selectedArtist, setSelectedArtist] = useState<ArtistResult | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumResult | null>(null);
  const [trackToDownload, setTrackToDownload] = useState<TrackResult | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Estados para Alerta y Progreso
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'error',
  });

  const [progressVisible, setProgressVisible] = useState(false);
  const [progressData, setProgressData] = useState({ itemName: '', progress: 0, downloadedMB: 0, totalMB: 0 });

  const showAlert = (title: string, message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setAlertConfig({ title, message, type });
    setAlertVisible(true);
  };

  // Solicitar permisos al cargar la pantalla (solo en Android, aunque expo lo maneja)
  useEffect(() => {
    (async () => {
      if (Platform.OS === 'android') {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          showAlert(
            'Permisos requeridos',
            'Se necesitan permisos de almacenamiento para guardar la música descargada.',
            'error',
          );
        }
      }
    })();
  }, []);

  const handleBack = () => {
    if (selectedAlbum) {
      setSelectedAlbum(null);
    } else if (selectedArtist) {
      setSelectedArtist(null);
    } else {
      router.back();
    }
  };

  const handleTrackSelect = (track: TrackResult) => {
    setTrackToDownload(track);
  };

  const handleAlbumSelect = (album: AlbumResult) => {
    setSelectedAlbum(album);
  };

  const handleArtistSelect = (artist: ArtistResult) => {
    setSelectedArtist(artist);
  };

  const handleConfirmDownload = async () => {
    if (!trackToDownload) return;
    setIsDownloading(true);
    setProgressData({ itemName: trackToDownload.name, progress: 0, downloadedMB: 0, totalMB: 0 });
    setProgressVisible(true);

    try {
      const artist = trackToDownload.artists.split(',')[0].trim();
      const filename = `${trackToDownload.name}.mp3`;
      const destPath = await getDestinationPath(artist, trackToDownload.album, filename);

      // Usa la extensión seleccionada por el usuario, no track.platform
      const finalDownloadUrl = await getDownloadUrlForTrack(
        trackToDownload.id,
        selectedExtensionId || trackToDownload.platform,
        trackToDownload.external_url,
      );

      await downloadFile(finalDownloadUrl, destPath, (progress, downloadedMB, totalMB) => {
        setProgressData({ itemName: trackToDownload.name, progress, downloadedMB, totalMB });
      });

      showAlert('¡Descarga Completada!', `Guardado en: MusicaFrito/${artist}/`, 'success');
      setTrackToDownload(null);
    } catch (error: any) {
      showAlert('Error en la descarga', error.message || 'No se pudo completar la descarga.', 'error');
    } finally {
      setIsDownloading(false);
      setProgressVisible(false);
    }
  };

  const handleDownloadAlbum = async (tracks: TrackResult[]) => {
    if (tracks.length === 0) return;
    setIsDownloading(true);
    setProgressVisible(true);

    try {
      let successCount = 0;
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        setProgressData({
          itemName: `(${i + 1}/${tracks.length}) ${track.name}`,
          progress: 0,
          downloadedMB: 0,
          totalMB: 0,
        });

        try {
          const artist = track.artists.split(',')[0].trim();
          const filename = `${track.name}.mp3`;
          const destPath = await getDestinationPath(artist, track.album, filename);

          // Usa la extensión seleccionada por el usuario
          const finalDownloadUrl = await getDownloadUrlForTrack(
            track.id,
            selectedExtensionId || track.platform,
            track.external_url,
          );

          await downloadFile(finalDownloadUrl, destPath, (progress, downloadedMB, totalMB) => {
            setProgressData(prev => ({ ...prev, progress, downloadedMB, totalMB }));
          });

          successCount++;
        } catch (err) {
          console.warn(`Error descargando ${track.name}:`, err);
        }
      }
      showAlert(
        'Álbum Descargado',
        `Se descargaron ${successCount}/${tracks.length} canciones exitosamente.`,
        'success',
      );
    } catch (error: any) {
      showAlert('Error en descarga de álbum', error.message || 'No se pudo completar.', 'error');
    } finally {
      setIsDownloading(false);
      setProgressVisible(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background, paddingTop: selectedArtist ? 0 : insets.top }]}>
      {!selectedArtist && <LinearGradient colors={[c.backgroundHighlight, c.background]} style={styles.gradient} />}

      {/* Header Estándar (oculto si hay un artista seleccionado) */}
      {!selectedArtist && (
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={28} color={c.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: c.textPrimary }]}>Descargar Música</Text>
          <View style={styles.headerSpacer} />
        </View>
      )}

      {/* Vista de Álbum */}
      {selectedAlbum ? (
        <AlbumProfileCard
          album={selectedAlbum}
          onClose={() => setSelectedAlbum(null)}
          onDownloadAlbum={handleDownloadAlbum}
          onTrackSelect={handleTrackSelect}
        />
      ) : selectedArtist ? (
        <ArtistProfileCard
          artist={selectedArtist}
          onClose={() => setSelectedArtist(null)}
          onTrackSelect={handleTrackSelect}
          onAlbumSelect={handleAlbumSelect}
        />
      ) : (
        /* Contenido Principal: Búsqueda y Resultados */
        <View style={styles.mainContent}>
          <ExtensionPicker />
          <QualityPicker />
          <DownloadSearchBar />

          <View style={styles.resultsWrapper}>
            <SearchResultsList
              onTrackSelect={handleTrackSelect}
              onAlbumSelect={handleAlbumSelect}
              onArtistSelect={handleArtistSelect}
            />
          </View>
        </View>
      )}

      {/* Modal de confirmación de descarga */}
      <DownloadConfirmModal
        visible={!!trackToDownload}
        track={trackToDownload}
        onClose={() => setTrackToDownload(null)}
        onConfirm={handleConfirmDownload}
        isDownloading={isDownloading}
      />

      <DownloadProgressModal
        visible={progressVisible}
        itemName={progressData.itemName}
        progress={progressData.progress}
        downloadedMB={progressData.downloadedMB}
        totalMB={progressData.totalMB}
      />

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertVisible(false)}
      />
    </View>
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
    height: 300,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  headerSpacer: {
    width: 44,
  },
  mainContent: {
    flex: 1,
  },
  resultsWrapper: {
    flex: 1,
    marginTop: Spacing.sm,
  },
});
