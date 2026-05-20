import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, BackHandler, ToastAndroid } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import 'react-native-reanimated';

import { PlayerProvider, usePlaybackMetadata } from '@/contexts/PlayerContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { EqualizerProvider, useEqualizer } from '@/contexts/EqualizerContext';
import { LyricsProvider } from '@/contexts/LyricsContext';
import { OnboardingProvider, useOnboarding } from '@/contexts/OnboardingContext';
import { SetupScreen } from '@/components/SetupScreen';
import { useAdaptivePalette } from '@/hooks/useAdaptivePalette';
import { MusicDownloadProvider } from '@/contexts/MusicDownloadContext';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

/**
 * Bridge component that watches for track changes and
 * reattaches the equalizer to the new audio session.
 * Must be rendered inside both PlayerProvider and EqualizerProvider.
 */
function EqualizerBridge() {
  const playerState = usePlaybackMetadata();
  const { reattachEqualizer, state: eqState } = useEqualizer();
  const prevTrackIdRef = useRef<string | null>(null);

  useEffect(() => {
    const currentId = playerState.currentTrack?.id ?? null;
    if (currentId && currentId !== prevTrackIdRef.current && eqState.initialized) {
      prevTrackIdRef.current = currentId;
      // Wait for audio session to start before reattaching
      const timer = setTimeout(() => {
        reattachEqualizer();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [playerState.currentTrack?.id, eqState.initialized, reattachEqualizer]);

  return null;
}

function AdaptivePaletteBridge() {
  useAdaptivePalette();
  return null;
}

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { state } = useOnboarding();
  if (!state.isLoaded) return null;
  if (!state.isSetupComplete) return <SetupScreen />;
  return <>{children}</>;
}

/**
 * Maneja el botón físico "Atrás" de Android:
 * - Si hay navegación posible → va a la pantalla anterior
 * - Si estamos en root → primer press muestra toast, segundo press en <2s cierra la app
 */
function AndroidBackHandler() {
  const navigation = useNavigation();
  const lastBackPressRef = useRef(0);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (navigation.canGoBack()) {
        navigation.goBack();
        return true;
      }

      const now = Date.now();
      if (now - lastBackPressRef.current < 2000) {
        BackHandler.exitApp();
        return true;
      }

      lastBackPressRef.current = now;
      ToastAndroid.show('Presiona atrás de nuevo para salir', ToastAndroid.SHORT);
      return true;
    });

    return () => handler.remove();
  }, [navigation]);

  return null;
}

function ThemedApp() {
  const { theme } = useTheme();
  const c = theme.colors;

  const navTheme = theme.isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary: c.primary,
          background: c.background,
          card: c.backgroundElevated,
          text: c.textPrimary,
          border: c.surfaceBorder,
          notification: c.primary,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: c.primary,
          background: c.background,
          card: c.backgroundElevated,
          text: c.textPrimary,
          border: c.border,
          notification: c.primary,
        },
      };

  return (
    <NavThemeProvider value={navTheme}>
      <OnboardingProvider>
        <OnboardingGate>
          <FavoritesProvider>
            <PlayerProvider>
              <EqualizerProvider>
                <LyricsProvider>
                  <MusicDownloadProvider>
                    <StatusBar style={theme.isDark ? 'light' : 'dark'} />
                    <EqualizerBridge />
                    <AndroidBackHandler />
                    <AdaptivePaletteBridge />
                    <Stack
                      screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: c.background },
                        animation: 'slide_from_bottom',
                      }}
                    >
                      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                      <Stack.Screen
                        name="modal"
                        options={{
                          presentation: 'modal',
                          animation: 'slide_from_bottom',
                          gestureEnabled: true,
                          gestureDirection: 'vertical',
                        }}
                      />
                      <Stack.Screen name="folder/[id]" options={{ animation: 'slide_from_right' }} />
                      <Stack.Screen name="favorites" options={{ animation: 'slide_from_right' }} />
                      <Stack.Screen name="playlists" options={{ animation: 'slide_from_right' }} />
                      <Stack.Screen name="playlist/[id]" options={{ animation: 'slide_from_right' }} />
                      <Stack.Screen name="donations" options={{ animation: 'slide_from_right' }} />
                      <Stack.Screen name="download-music" options={{ animation: 'slide_from_right' }} />
                      <Stack.Screen name="theme-settings" options={{ animation: 'slide_from_right' }} />
                      <Stack.Screen name="equalizer" options={{ animation: 'slide_from_right' }} />
                    </Stack>
                  </MusicDownloadProvider>
                </LyricsProvider>
              </EqualizerProvider>
            </PlayerProvider>
          </FavoritesProvider>
        </OnboardingGate>
      </OnboardingProvider>
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
