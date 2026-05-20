import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { EXTENSIONS } from '@/constants/extensions';
import { useTheme } from '@/contexts/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useMusicDownload } from '@/contexts/MusicDownloadContext';

export function QualityPicker() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { selectedExtensionId, selectedQuality, setQuality } = useMusicDownload();

  const extension = EXTENSIONS.find(e => e.id === selectedExtensionId);
  if (!extension || extension.qualityOptions.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: c.textSecondary }]}>Calidad:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {extension.qualityOptions.map(opt => {
          const isSelected = selectedQuality === opt.value;

          return (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.chip,
                { backgroundColor: isSelected ? c.primary + '20' : c.backgroundElevated },
                isSelected && { borderColor: c.primary, borderWidth: 1 },
              ]}
              onPress={() => setQuality(opt.value)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? c.primary : c.textSecondary },
                  isSelected && { fontWeight: Typography.fontWeight.bold },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    marginLeft: Spacing.base,
    marginBottom: Spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipText: {
    fontSize: Typography.fontSize.xs,
  },
});
