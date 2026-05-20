import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { TrackResult, useMusicDownload } from '@/contexts/MusicDownloadContext';
import { EXTENSIONS } from '@/constants/extensions';

interface DownloadConfirmModalProps {
  visible: boolean;
  track: TrackResult | null;
  onClose: () => void;
  onConfirm: () => void;
  isDownloading?: boolean;
}

export function DownloadConfirmModal({ visible, track, onClose, onConfirm, isDownloading }: DownloadConfirmModalProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { selectedExtensionId, selectedQuality } = useMusicDownload();

  if (!track) return null;

  const extension = EXTENSIONS.find(e => e.id === selectedExtensionId);
  const quality = extension?.qualityOptions.find(q => q.value === selectedQuality);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalContent, { backgroundColor: c.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: c.textPrimary }]}>Confirmar Descarga</Text>
            <TouchableOpacity onPress={onClose} disabled={isDownloading}>
              <Ionicons name="close" size={24} color={c.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.trackInfo}>
            <Image source={{ uri: track.imageUrl }} style={styles.cover} />
            <View style={styles.trackDetails}>
              <Text style={[styles.trackName, { color: c.textPrimary }]} numberOfLines={2}>
                {track.name}
              </Text>
              <Text style={[styles.trackArtist, { color: c.textSecondary }]} numberOfLines={1}>
                {track.artists}
              </Text>
              <Text style={[styles.trackAlbum, { color: c.textMuted }]} numberOfLines={1}>
                Álbum: {track.album}
              </Text>
            </View>
          </View>

          <View style={[styles.settingsBox, { backgroundColor: c.backgroundElevated }]}>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: c.textSecondary }]}>Servidor:</Text>
              <Text style={[styles.settingValue, { color: c.primary }]}>
                {extension?.displayName || track.platform}
              </Text>
            </View>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: c.textSecondary }]}>Calidad:</Text>
              <Text style={[styles.settingValue, { color: c.textPrimary }]}>{quality?.label || 'Estándar'}</Text>
            </View>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: c.textSecondary }]}>Destino:</Text>
              <Text style={[styles.settingValue, { color: c.textPrimary }]} numberOfLines={1}>
                MusicaFrito/{track.artists.split(',')[0]}/
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnCancel, { backgroundColor: c.backgroundElevated }]}
              onPress={onClose}
              disabled={isDownloading}
            >
              <Text style={[styles.btnText, { color: c.textPrimary }]}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.btnDownload, { backgroundColor: c.primary }]}
              onPress={onConfirm}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <>
                  <Ionicons name="download" size={18} color="#000" style={{ marginRight: 8 }} />
                  <Text style={[styles.btnText, { color: '#000', fontWeight: 'bold' }]}>Descargar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    width: '100%',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  trackInfo: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  cover: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    backgroundColor: '#333',
  },
  trackDetails: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'center',
  },
  trackName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: Typography.fontSize.sm,
    marginBottom: 2,
  },
  trackAlbum: {
    fontSize: Typography.fontSize.xs,
  },
  settingsBox: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  settingLabel: {
    fontSize: Typography.fontSize.sm,
  },
  settingValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    flexShrink: 1,
    marginLeft: Spacing.md,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancel: {
    // bg from props
  },
  btnDownload: {
    // bg from props
  },
  btnText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
});
