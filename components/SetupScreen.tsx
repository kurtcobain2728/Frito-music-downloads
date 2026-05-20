import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useOnboarding, type SetupPage } from '@/contexts/OnboardingContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useCallback, useRef } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View, ViewToken } from 'react-native';
import Animated, { FadeIn, FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PageConfig {
  key: SetupPage;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  description: string;
  actionLabel?: string;
}

const PAGES: PageConfig[] = [
  {
    key: 'welcome',
    icon: 'musical-notes',
    iconColor: '#1DB954',
    title: 'Bienvenido a Frito Music',
    description:
      'Tu reproductor de música local con estilo. Vamos a configurar un par de cosas para darte la mejor experiencia.',
  },
  {
    key: 'media',
    icon: 'folder-open',
    iconColor: '#4688F1',
    title: 'Acceso a tu música',
    description: 'Necesitamos acceso a tus archivos de audio para escanear y reproducir tu biblioteca musical.',
    actionLabel: 'Permitir acceso',
  },
  {
    key: 'notifications',
    icon: 'notifications',
    iconColor: '#FF9800',
    title: 'Notificaciones',
    description: 'Permite las notificaciones para ver los controles de reproducción en la barra de estado.',
    actionLabel: 'Permitir notificaciones',
  },
  {
    key: 'complete',
    icon: 'checkmark-circle',
    iconColor: '#1DB954',
    title: '¡Todo listo!',
    description: 'Tu reproductor está configurado. Disfruta de tu música.',
  },
];

function SetupScreenComponent() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const c = theme.colors;
  const { state, requestMediaPermission, requestNotificationPermission, nextPage, prevPage, completeSetup } =
    useOnboarding();
  const flatListRef = useRef<FlatList>(null);
  const currentIndexRef = useRef(0);
  const buttonScale = useSharedValue(1);

  const currentPageIndex = PAGES.findIndex(p => p.key === state.currentPage);

  const isPermissionGranted = useCallback(
    (page: SetupPage): boolean => {
      switch (page) {
        case 'media':
          return state.mediaPermission;
        case 'notifications':
          return state.notificationPermission;
        default:
          return true;
      }
    },
    [state.mediaPermission, state.notificationPermission],
  );

  const handleAction = useCallback(
    async (page: SetupPage) => {
      switch (page) {
        case 'media':
          await requestMediaPermission();
          break;
        case 'notifications':
          await requestNotificationPermission();
          break;
      }
    },
    [requestMediaPermission, requestNotificationPermission],
  );

  const scrollToIndex = useCallback((idx: number) => {
    flatListRef.current?.scrollToIndex({ index: idx, animated: true });
    currentIndexRef.current = idx;
  }, []);

  const handleNext = useCallback(() => {
    const nextIdx = currentPageIndex + 1;
    if (nextIdx < PAGES.length) {
      nextPage();
      scrollToIndex(nextIdx);
    }
  }, [currentPageIndex, nextPage, scrollToIndex]);

  const handlePrev = useCallback(() => {
    const prevIdx = currentPageIndex - 1;
    if (prevIdx >= 0) {
      prevPage();
      scrollToIndex(prevIdx);
    }
  }, [currentPageIndex, prevPage, scrollToIndex]);

  const handleComplete = useCallback(() => {
    completeSetup();
  }, [completeSetup]);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleButtonPressIn = useCallback(() => {
    buttonScale.value = withSpring(0.95, { damping: 15 });
  }, [buttonScale]);

  const handleButtonPressOut = useCallback(() => {
    buttonScale.value = withSpring(1, { damping: 15 });
  }, [buttonScale]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      currentIndexRef.current = viewableItems[0].index;
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const renderPage = useCallback(
    ({ item }: { item: PageConfig }) => {
      const granted = isPermissionGranted(item.key);
      const isLast = item.key === 'complete';
      const isFirst = item.key === 'welcome';

      return (
        <View style={[styles.page, { width: SCREEN_WIDTH }]}>
          <Animated.View entering={FadeInUp.duration(600)} style={styles.iconSection}>
            <View style={[styles.iconCircle, { backgroundColor: item.iconColor + '15' }]}>
              <Ionicons name={item.icon} size={64} color={item.iconColor} />
            </View>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.textSection}>
            <Text style={[styles.pageTitle, { color: c.textPrimary }]}>{item.title}</Text>
            <Text style={[styles.pageDescription, { color: c.textSecondary }]}>{item.description}</Text>
          </Animated.View>

          <View style={styles.actionSection}>
            {item.actionLabel && !granted && (
              <Animated.View style={buttonAnimatedStyle}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: item.iconColor }]}
                  onPress={() => handleAction(item.key)}
                  onPressIn={handleButtonPressIn}
                  onPressOut={handleButtonPressOut}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionButtonText}>{item.actionLabel}</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
            {item.actionLabel && granted && (
              <View style={[styles.grantedBadge, { backgroundColor: c.success + '20' }]}>
                <Ionicons name="checkmark-circle" size={20} color={c.success} />
                <Text style={[styles.grantedText, { color: c.success }]}>Permiso concedido</Text>
              </View>
            )}
          </View>

          <View style={styles.navSection}>
            {!isFirst && (
              <TouchableOpacity style={[styles.navButton, { borderColor: c.surfaceBorder }]} onPress={handlePrev}>
                <Ionicons name="arrow-back" size={20} color={c.textSecondary} />
                <Text style={[styles.navButtonText, { color: c.textSecondary }]}>Atrás</Text>
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }} />
            {isLast ? (
              <TouchableOpacity
                style={[styles.navButton, styles.navButtonPrimary, { backgroundColor: c.primary }]}
                onPress={handleComplete}
              >
                <Text style={[styles.navButtonText, { color: '#000' }]}>Comenzar</Text>
                <Ionicons name="arrow-forward" size={20} color="#000" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.navButton, { borderColor: c.surfaceBorder }]} onPress={handleNext}>
                <Text style={[styles.navButtonText, { color: c.textSecondary }]}>
                  {granted || !item.actionLabel ? 'Siguiente' : 'Omitir'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color={c.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    },
    [
      c,
      isPermissionGranted,
      handleAction,
      handleNext,
      handlePrev,
      handleComplete,
      buttonAnimatedStyle,
      handleButtonPressIn,
      handleButtonPressOut,
    ],
  );

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <LinearGradient colors={[c.backgroundHighlight, c.background]} style={StyleSheet.absoluteFill} />
      <View style={[styles.dotsContainer, { top: insets.top + Spacing.lg }]}>
        {PAGES.map((p, i) => (
          <View
            key={p.key}
            style={[
              styles.dot,
              { backgroundColor: i === currentPageIndex ? c.primary : c.surfaceBorder },
              i === currentPageIndex && styles.dotActive,
            ]}
          />
        ))}
      </View>
      <FlatList
        ref={flatListRef}
        data={PAGES}
        renderItem={renderPage}
        keyExtractor={item => item.key}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        contentContainerStyle={{ paddingTop: insets.top + 60 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
    borderRadius: 4,
  },
  page: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
  },
  iconSection: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textSection: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  pageTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  pageDescription: {
    fontSize: Typography.fontSize.md,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing.lg,
  },
  actionSection: {
    alignItems: 'center',
    minHeight: 60,
    marginBottom: Spacing.xl,
  },
  actionButton: {
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing['2xl'],
    borderRadius: BorderRadius.full,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  grantedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.full,
  },
  grantedText: {
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  navSection: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.xl,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  navButtonPrimary: {
    borderWidth: 0,
  },
  navButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    marginHorizontal: Spacing.xs,
  },
});

export const SetupScreen = memo(SetupScreenComponent);
export default SetupScreen;
