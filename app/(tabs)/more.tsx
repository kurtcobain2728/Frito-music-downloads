import { ScreenWithPlayer } from '@/components/ScreenWithPlayer';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, Spacing, BorderRadius, Layout } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useFavorites } from '@/contexts/FavoritesContext';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  iconColor?: string;
  bgColor: string;
  textColor: string;
  subtitleColor: string;
  chevronColor: string;
}

function MenuItem({
  icon,
  title,
  subtitle,
  onPress,
  iconColor = '#1DB954',
  bgColor,
  textColor,
  subtitleColor,
  chevronColor,
}: MenuItemProps) {
  return (
    <TouchableOpacity style={[styles.menuItem, { backgroundColor: bgColor }]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIconContainer, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={[styles.menuTitle, { color: textColor }]}>{title}</Text>
        <Text style={[styles.menuSubtitle, { color: subtitleColor }]}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={chevronColor} />
    </TouchableOpacity>
  );
}

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const c = theme.colors;
  const { favorites, playlists } = useFavorites();

  return (
    <ScreenWithPlayer>
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: c.background }]}>
        <LinearGradient colors={[c.backgroundHighlight, c.background]} style={styles.gradient} />

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Layout.screenPaddingBottom + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: c.textPrimary }]}>Más</Text>
            <Text style={[styles.subtitle, { color: c.textSecondary }]}>Tu colección personal</Text>
          </View>

          <View style={styles.menuContainer}>
            <MenuItem
              icon="heart"
              title="Favoritos"
              subtitle={`${favorites.length} canción${favorites.length !== 1 ? 'es' : ''}`}
              onPress={() => router.push('/favorites' as any)}
              iconColor="#FF6B6B"
              bgColor={c.backgroundElevated}
              textColor={c.textPrimary}
              subtitleColor={c.textSecondary}
              chevronColor={c.textMuted}
            />
            <MenuItem
              icon="list"
              title="Listas de Reproducción"
              subtitle={`${playlists.length} lista${playlists.length !== 1 ? 's' : ''}`}
              onPress={() => router.push('/playlists' as any)}
              iconColor={c.primary}
              bgColor={c.backgroundElevated}
              textColor={c.textPrimary}
              subtitleColor={c.textSecondary}
              chevronColor={c.textMuted}
            />
            <MenuItem
              icon="options"
              title="Ecualizador"
              subtitle="Ajusta el sonido"
              onPress={() => router.push('/equalizer' as any)}
              iconColor="#00BCD4"
              bgColor={c.backgroundElevated}
              textColor={c.textPrimary}
              subtitleColor={c.textSecondary}
              chevronColor={c.textMuted}
            />
            <MenuItem
              icon="color-palette"
              title="Apariencia"
              subtitle="Temas, colores y estilo"
              onPress={() => router.push('/theme-settings' as any)}
              iconColor="#8E44AD"
              bgColor={c.backgroundElevated}
              textColor={c.textPrimary}
              subtitleColor={c.textSecondary}
              chevronColor={c.textMuted}
            />
            <MenuItem
              icon="gift"
              title="Donaciones"
              subtitle="Apoya el proyecto"
              onPress={() => router.push('/donations' as any)}
              iconColor="#FFD700"
              bgColor={c.backgroundElevated}
              textColor={c.textPrimary}
              subtitleColor={c.textSecondary}
              chevronColor={c.textMuted}
            />
            <MenuItem
              icon="cloud-download"
              title="Descargar Música"
              subtitle="Busca y descarga desde Spotify, Deezer, Tidal..."
              onPress={() => router.push('/download-music' as any)}
              iconColor="#1DB954"
              bgColor={c.backgroundElevated}
              textColor={c.textPrimary}
              subtitleColor={c.textSecondary}
              chevronColor={c.textMuted}
            />
            <MenuItem
              icon="extension-puzzle"
              title="Extensiones"
              subtitle="Gestiona proveedores de música y metadatos"
              onPress={() => router.push('/extensions' as any)}
              iconColor="#FF9800"
              bgColor={c.backgroundElevated}
              textColor={c.textPrimary}
              subtitleColor={c.textSecondary}
              chevronColor={c.textMuted}
            />
          </View>

          <View style={styles.infoSection}>
            <Ionicons name="musical-notes" size={48} color={c.textMuted} />
            <Text style={[styles.infoTitle, { color: c.textSecondary }]}>Organiza tu música</Text>
            <Text style={[styles.infoText, { color: c.textMuted }]}>
              Marca canciones como favoritas o crea listas de reproducción personalizadas
            </Text>
          </View>
        </ScrollView>
      </View>
    </ScreenWithPlayer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 200 },
  scrollContent: { flexGrow: 1 },
  header: { paddingHorizontal: Spacing.base, paddingTop: Spacing.lg, paddingBottom: Spacing.xl },
  title: { fontSize: Typography.fontSize['3xl'], fontWeight: Typography.fontWeight.bold, marginBottom: Spacing.xs },
  subtitle: { fontSize: Typography.fontSize.base },
  menuContainer: { paddingHorizontal: Spacing.base },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.base,
  },
  menuTextContainer: { flex: 1 },
  menuTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, marginBottom: 2 },
  menuSubtitle: { fontSize: Typography.fontSize.sm },
  infoSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing['3xl'],
  },
  infoTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
  },
  infoText: { fontSize: Typography.fontSize.sm, textAlign: 'center', lineHeight: 20 },
});
