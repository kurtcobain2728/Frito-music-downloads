import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View, AppState } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useMusicDownload } from '@/contexts/MusicDownloadContext';
import { ExtensionManager } from '@/utils/extensionManager';
import { ExtensionManifest } from '@/utils/extensionRuntime';

export function ExtensionPicker() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { selectedExtensionId, setExtension } = useMusicDownload();
  const [extensions, setExtensions] = useState<ExtensionManifest[]>([]);

  const loadExtensions = useCallback(async () => {
    const manager = ExtensionManager.getInstance();
    await manager.initialize();
    const installed = manager.getInstalledExtensions();
    setExtensions(installed);

    // Auto-seleccionar la primera si ninguna está seleccionada
    if (installed.length > 0 && !selectedExtensionId) {
      setExtension(installed[0].name); // .name es el ID único de la extensión
    }
  }, [selectedExtensionId, setExtension]);

  useEffect(() => {
    loadExtensions();
  }, []);

  // Recargar cuando la app vuelve al primer plano (usuario instaló extensión y regresó)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        loadExtensions();
      }
    });
    return () => subscription.remove();
  }, [loadExtensions]);

  const getPlatformStyle = (id: string) => {
    const idLower = id.toLowerCase();
    if (idLower.includes('spotify')) return { icon: 'logo-usd' as const, color: '#1DB954' };
    if (idLower.includes('deezer')) return { icon: 'musical-notes' as const, color: '#FF6600' };
    if (idLower.includes('amazon') || idLower.includes('amzn'))
      return { icon: 'logo-amazon' as const, color: '#FF9900' };
    if (idLower.includes('apple')) return { icon: 'logo-apple' as const, color: '#FA243C' };
    if (idLower.includes('soundcloud')) return { icon: 'logo-soundcloud' as const, color: '#FF5500' };
    if (idLower.includes('youtube') || idLower.includes('ytmusic'))
      return { icon: 'logo-youtube' as const, color: '#FF0000' };
    if (idLower.includes('tidal')) return { icon: 'water-outline' as const, color: '#00FFFF' };
    if (idLower.includes('qobuz')) return { icon: 'musical-note' as const, color: '#1E3A5F' };
    return { icon: 'cloud-download' as const, color: c.primary };
  };

  if (extensions.length === 0) {
    return null; // Oculta el picker si no hay extensiones instaladas
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: c.textSecondary }]}>Servidor:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {extensions.map(ext => {
          // Usar name como ID consistentemente (es el id único de la extensión)
          const id = ext.name;
          const isSelected = selectedExtensionId === id;
          const pStyle = getPlatformStyle(id);

          return (
            <TouchableOpacity
              key={id}
              style={[
                styles.chip,
                { backgroundColor: isSelected ? c.backgroundHighlight : c.backgroundElevated },
                isSelected && { borderColor: pStyle.color, borderWidth: 1.5 },
              ]}
              onPress={() => setExtension(id)}
            >
              <Ionicons
                name={pStyle.icon}
                size={16}
                color={isSelected ? pStyle.color : c.textMuted}
                style={styles.icon}
              />
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? c.textPrimary : c.textSecondary },
                  isSelected && { fontWeight: Typography.fontWeight.bold },
                ]}
              >
                {ext.display_name || ext.name}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  icon: {
    marginRight: Spacing.xs,
  },
  chipText: {
    fontSize: Typography.fontSize.sm,
  },
});
