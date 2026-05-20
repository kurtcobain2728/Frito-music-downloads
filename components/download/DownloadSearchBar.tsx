import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useMusicDownload } from '@/contexts/MusicDownloadContext';
import { performMusicSearch } from '@/utils/musicSearch';

export function DownloadSearchBar() {
  const { theme } = useTheme();
  const c = theme.colors;

  const { searchQuery, setSearchQuery, setSearchResults, setIsSearching, selectedExtensionId } = useMusicDownload();

  const [localQuery, setLocalQuery] = useState(searchQuery);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Si cambia localQuery, programamos la búsqueda
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!localQuery.trim()) {
      setSearchQuery('');
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      setSearchQuery(localQuery);
      setIsSearching(true);
      try {
        const results = await performMusicSearch(localQuery, selectedExtensionId);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching:', error);
        setSearchResults(null);
      } finally {
        setIsSearching(false);
      }
    }, 400); // Debounce de 400ms

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [localQuery, selectedExtensionId]); // Re-buscar si cambia la query o el proveedor

  return (
    <View style={styles.container}>
      <View style={[styles.searchBox, { backgroundColor: c.backgroundElevated }]}>
        <Ionicons name="search" size={20} color={c.textMuted} style={styles.icon} />
        <TextInput
          style={[styles.input, { color: c.textPrimary }]}
          placeholder="Buscar canciones, álbumes, artistas..."
          placeholderTextColor={c.textMuted}
          value={localQuery}
          onChangeText={setLocalQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {localQuery.length > 0 && (
          <TouchableOpacity onPress={() => setLocalQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close-circle" size={20} color={c.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    height: '100%',
  },
});
