import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, PermissionsAndroid } from 'react-native';
import * as MediaLibrary from 'expo-media-library';

export type SetupPage = 'welcome' | 'media' | 'notifications' | 'complete';

interface OnboardingState {
  isSetupComplete: boolean;
  currentPage: SetupPage;
  mediaPermission: boolean;
  notificationPermission: boolean;
  isLoaded: boolean;
}

interface OnboardingContextValue {
  state: OnboardingState;
  checkPermissions: () => Promise<void>;
  requestMediaPermission: () => Promise<boolean>;
  requestNotificationPermission: () => Promise<boolean>;
  nextPage: () => void;
  prevPage: () => void;
  completeSetup: () => Promise<void>;
}

const STORAGE_KEY = '@frito_music/setup_complete';

const PAGES: SetupPage[] = ['welcome', 'media', 'notifications', 'complete'];

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>({
    isSetupComplete: false,
    currentPage: 'welcome',
    mediaPermission: false,
    notificationPermission: false,
    isLoaded: false,
  });

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'true') {
          setState(prev => ({ ...prev, isSetupComplete: true, isLoaded: true }));
          return;
        }
      } catch (_e) {}
      setState(prev => ({ ...prev, isLoaded: true }));
    })();
  }, []);

  const checkPermissions = useCallback(async () => {
    let mediaGranted = false;
    let notifGranted = false;

    try {
      const { status } = await MediaLibrary.getPermissionsAsync();
      mediaGranted = status === 'granted';
    } catch (_e) {}

    if (Platform.OS === 'android' && Platform.Version >= 33) {
      try {
        const result = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        notifGranted = result;
      } catch (_e) {}
    } else {
      notifGranted = true;
    }

    setState(prev => ({
      ...prev,
      mediaPermission: mediaGranted,
      notificationPermission: notifGranted,
    }));
  }, []);

  useEffect(() => {
    if (state.isLoaded && !state.isSetupComplete) {
      checkPermissions();
    }
  }, [state.isLoaded, state.isSetupComplete, checkPermissions]);

  const requestMediaPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync(false, ['audio']);
      const granted = status === 'granted';
      setState(prev => ({ ...prev, mediaPermission: granted }));
      return granted;
    } catch (_e) {
      return false;
    }
  }, []);

  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android' || Platform.Version < 33) {
      setState(prev => ({ ...prev, notificationPermission: true }));
      return true;
    }
    try {
      const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      const granted = result === PermissionsAndroid.RESULTS.GRANTED;
      setState(prev => ({ ...prev, notificationPermission: granted }));
      return granted;
    } catch (_e) {
      return false;
    }
  }, []);

  const nextPage = useCallback(() => {
    setState(prev => {
      const idx = PAGES.indexOf(prev.currentPage);
      if (idx < PAGES.length - 1) {
        return { ...prev, currentPage: PAGES[idx + 1] };
      }
      return prev;
    });
  }, []);

  const prevPage = useCallback(() => {
    setState(prev => {
      const idx = PAGES.indexOf(prev.currentPage);
      if (idx > 0) {
        return { ...prev, currentPage: PAGES[idx - 1] };
      }
      return prev;
    });
  }, []);

  const completeSetup = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
    } catch (_e) {}
    setState(prev => ({ ...prev, isSetupComplete: true }));
  }, []);

  const ctx = useMemo<OnboardingContextValue>(
    () => ({
      state,
      checkPermissions,
      requestMediaPermission,
      requestNotificationPermission,
      nextPage,
      prevPage,
      completeSetup,
    }),
    [state, checkPermissions, requestMediaPermission, requestNotificationPermission, nextPage, prevPage, completeSetup],
  );

  return <OnboardingContext.Provider value={ctx}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error('useOnboarding must be used within OnboardingProvider');
  return context;
}
