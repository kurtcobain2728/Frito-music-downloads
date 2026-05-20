import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useLyrics } from '@/contexts/LyricsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { LyricsLine } from '@/utils/lyricsUtils';

interface LyricsSheetProps {
  visible: boolean;
  onClose: () => void;
}

function LyricsSheetComponent({ visible, onClose }: LyricsSheetProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const { state, adjustOffset, resetOffset, searchManual, applyResult } = useLyrics();
  const listRef = useRef<FlatList>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const prevActiveRef = useRef(-1);

  useEffect(() => {
    if (state.activeLine >= 0 && state.activeLine !== prevActiveRef.current && state.lyrics?.type === 'synchronized') {
      prevActiveRef.current = state.activeLine;
      listRef.current?.scrollToIndex({
        index: state.activeLine,
        animated: true,
        viewPosition: 0.4,
      });
    }
  }, [state.activeLine, state.lyrics?.type]);

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      searchManual(searchQuery.trim());
    }
  }, [searchQuery, searchManual]);

  const handleScrollFailed = useCallback((info: { index: number }) => {
    setTimeout(() => {
      listRef.current?.scrollToIndex({ index: info.index, animated: false });
    }, 100);
  }, []);

  const renderLine = useCallback(
    ({ item, index }: { item: LyricsLine; index: number }) => {
      const isActive = index === state.activeLine && state.lyrics?.type === 'synchronized';
      return (
        <TouchableOpacity style={styles.lineContainer} activeOpacity={0.7}>
          <Text
            style={[
              styles.lineText,
              { color: isActive ? c.primary : c.textSecondary },
              isActive && styles.lineTextActive,
            ]}
          >
            {item.text}
          </Text>
        </TouchableOpacity>
      );
    },
    [state.activeLine, state.lyrics?.type, c],
  );

  const renderSearchResults = () => {
    if (state.isSearching) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={c.primary} />
          <Text style={[styles.statusText, { color: c.textSecondary }]}>Buscando letras...</Text>
        </View>
      );
    }

    if (state.searchResults.length === 0) return null;

    return (
      <FlatList
        data={state.searchResults}
        keyExtractor={item => item.id.toString()}
        style={styles.searchResults}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.searchItem, { backgroundColor: c.backgroundHighlight }]}
            onPress={() => {
              applyResult(item);
              setShowSearch(false);
            }}
          >
            <Text style={[styles.searchTitle, { color: c.textPrimary }]} numberOfLines={1}>
              {item.trackName}
            </Text>
            <Text style={[styles.searchArtist, { color: c.textSecondary }]} numberOfLines={1}>
              {item.artistName} {item.syncedLyrics ? '(sincronizada)' : '(plana)'}
            </Text>
          </TouchableOpacity>
        )}
      />
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.container, { backgroundColor: c.backgroundElevated, paddingBottom: insets.bottom + 20 }]}>
          <View style={[styles.handle, { backgroundColor: c.surfaceBorder }]} />

          <View style={[styles.header, { borderBottomColor: c.surfaceBorder }]}>
            <View style={styles.headerLeft}>
              <Text style={[styles.title, { color: c.textPrimary }]}>Letra</Text>
              {state.syncOffset !== 0 && (
                <Text style={[styles.offsetLabel, { color: c.textMuted }]}>
                  {state.syncOffset > 0 ? '+' : ''}
                  {state.syncOffset}ms
                </Text>
              )}
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerBtn} onPress={() => adjustOffset(-200)}>
                <Ionicons name="remove" size={18} color={c.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerBtn} onPress={resetOffset}>
                <Text style={[styles.syncLabel, { color: c.textMuted }]}>Sync</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerBtn} onPress={() => adjustOffset(200)}>
                <Ionicons name="add" size={18} color={c.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerBtn} onPress={() => setShowSearch(!showSearch)}>
                <Ionicons name="search" size={18} color={c.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {showSearch && (
            <View style={[styles.searchBar, { borderBottomColor: c.surfaceBorder }]}>
              <TextInput
                style={[styles.searchInput, { color: c.textPrimary, backgroundColor: c.backgroundHighlight }]}
                placeholder="Buscar letra..."
                placeholderTextColor={c.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              <TouchableOpacity style={[styles.searchBtn, { backgroundColor: c.primary }]} onPress={handleSearch}>
                <Ionicons name="search" size={16} color="#000" />
              </TouchableOpacity>
            </View>
          )}

          {showSearch && state.searchResults.length > 0 ? (
            renderSearchResults()
          ) : state.isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={c.primary} />
              <Text style={[styles.statusText, { color: c.textSecondary }]}>Buscando letras...</Text>
            </View>
          ) : state.error ? (
            <View style={styles.centered}>
              <Ionicons name="musical-note" size={48} color={c.textMuted} />
              <Text style={[styles.statusText, { color: c.textSecondary }]}>{state.error}</Text>
              <TouchableOpacity
                style={[styles.retryBtn, { borderColor: c.primary }]}
                onPress={() => setShowSearch(true)}
              >
                <Text style={[styles.retryText, { color: c.primary }]}>Buscar manualmente</Text>
              </TouchableOpacity>
            </View>
          ) : state.lyrics && state.lyrics.lines.length > 0 ? (
            <FlatList
              ref={listRef}
              data={state.lyrics.lines}
              renderItem={renderLine}
              keyExtractor={(_, i) => i.toString()}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              onScrollToIndexFailed={handleScrollFailed}
            />
          ) : (
            <View style={styles.centered}>
              <Ionicons name="musical-note" size={48} color={c.textMuted} />
              <Text style={[styles.statusText, { color: c.textSecondary }]}>Sin letra disponible</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  container: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '80%',
    minHeight: '50%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.base,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold },
  offsetLabel: { fontSize: Typography.fontSize.xs, marginLeft: Spacing.sm },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  headerBtn: { padding: Spacing.sm },
  syncLabel: { fontSize: Typography.fontSize.xs },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  searchInput: {
    flex: 1,
    height: 36,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.base,
  },
  searchBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  searchResults: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  searchItem: { padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.sm },
  searchTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.medium },
  searchArtist: { fontSize: Typography.fontSize.sm, marginTop: 2 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xl },
  lineContainer: { paddingVertical: Spacing.md },
  lineText: { fontSize: Typography.fontSize.lg, lineHeight: 28 },
  lineTextActive: { fontWeight: Typography.fontWeight.bold, fontSize: Typography.fontSize.xl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  statusText: { fontSize: Typography.fontSize.base, marginTop: Spacing.base, textAlign: 'center' },
  retryBtn: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  retryText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.medium },
});

export const LyricsSheet = memo(LyricsSheetComponent);
export default LyricsSheet;
