import React from 'react';
import { View, Text, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';

interface DownloadProgressModalProps {
  visible: boolean;
  itemName: string;
  progress: number; // 0 to 1
  downloadedMB: number;
  totalMB: number;
}

export function DownloadProgressModal({
  visible,
  itemName,
  progress,
  downloadedMB,
  totalMB,
}: DownloadProgressModalProps) {
  const { theme } = useTheme();
  const c = theme.colors;

  if (!visible) return null;

  const percentage = Math.round(progress * 100);

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />

        <View style={[styles.modalBox, { backgroundColor: c.backgroundHighlight, borderColor: '#333' }]}>
          <ActivityIndicator size="large" color={c.primary} style={{ marginBottom: Spacing.md }} />

          <Text style={[styles.title, { color: c.textPrimary }]}>Descargando...</Text>
          <Text style={[styles.itemName, { color: c.textSecondary }]} numberOfLines={1}>
            {itemName}
          </Text>

          {/* Barra de Progreso */}
          <View style={[styles.progressBarContainer, { backgroundColor: '#333' }]}>
            <View style={[styles.progressBarFill, { backgroundColor: c.primary, width: `${percentage}%` }]} />
          </View>

          <View style={styles.statsContainer}>
            <Text style={[styles.statsText, { color: c.textSecondary }]}>{percentage}%</Text>
            <Text style={[styles.statsText, { color: c.textSecondary }]}>
              {downloadedMB.toFixed(2)} MB / {totalMB > 0 ? totalMB.toFixed(2) : '?'} MB
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalBox: {
    width: '85%',
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs,
  },
  itemName: {
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  statsText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
});
