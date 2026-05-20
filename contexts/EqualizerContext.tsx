import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/utils/logger';

let EqualizerModule: any = null;
if (Platform.OS === 'android') {
  try {
    const { requireNativeModule } = require('expo-modules-core');
    EqualizerModule = requireNativeModule('EqualizerModule');
  } catch (_e) {
    try {
      const { NativeModules } = require('react-native');
      EqualizerModule = NativeModules.EqualizerModule;
    } catch (_e2) {
      EqualizerModule = null;
    }
  }
}

export interface EQBand {
  band: number;
  centerFreq: number;
  level: number;
}

const CUSTOM_PRESETS: Record<string, number[]> = {
  Plano: [0, 0, 0, 0, 0],
  'Bass Boost': [600, 400, 0, 0, 0],
  Rock: [400, 200, -100, 200, 400],
  Pop: [-100, 200, 400, 200, -100],
  Jazz: [300, 0, 100, -100, 200],
  Clásica: [300, 200, 0, 200, 300],
  Electrónica: [500, 300, -200, 300, 500],
  'Hip-Hop': [500, 300, 0, -100, 200],
  Vocal: [0, 0, 300, 400, 200],
  'Hi-Fi': [200, 100, 0, 100, 200],
};

interface EqualizerState {
  enabled: boolean;
  bands: EQBand[];
  nativePresets: string[];
  currentPreset: string | null;
  minLevel: number;
  maxLevel: number;
  initialized: boolean;
}

interface EqualizerContextValue {
  state: EqualizerState;
  setEnabled: (enabled: boolean) => void;
  setBandLevel: (band: number, level: number) => void;
  applyPreset: (name: string) => void;
  customPresetNames: string[];
  /** Re-attach equalizer to the current audio session (call after track change) */
  reattachEqualizer: () => Promise<void>;
}

const defaultBands: EQBand[] = [
  { band: 0, centerFreq: 60, level: 0 },
  { band: 1, centerFreq: 230, level: 0 },
  { band: 2, centerFreq: 910, level: 0 },
  { band: 3, centerFreq: 3600, level: 0 },
  { band: 4, centerFreq: 14000, level: 0 },
];

const defaultState: EqualizerState = {
  enabled: false,
  bands: defaultBands,
  nativePresets: [],
  currentPreset: 'Plano',
  minLevel: -1500,
  maxLevel: 1500,
  initialized: false,
};

const STORAGE_KEY = '@frito_music/eq_settings';

const EqualizerContext = createContext<EqualizerContextValue | undefined>(undefined);

function getPresetLevels(name: string, bandCount: number): number[] | null {
  const base = CUSTOM_PRESETS[name];
  if (!base) return null;
  const levels = Array(bandCount).fill(0);
  for (let i = 0; i < Math.min(base.length, bandCount); i++) {
    levels[i] = base[i];
  }
  return levels;
}

export function EqualizerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EqualizerState>(defaultState);
  const stateRef = useRef<EqualizerState>(defaultState);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    initializeEQ();
  }, []);

  const initializeEQ = async () => {
    if (Platform.OS !== 'android' || !EqualizerModule) {
      setState(prev => ({
        ...prev,
        initialized: false,
        bands: defaultBands,
      }));
      return;
    }

    try {
      const result = await EqualizerModule.initialize(0);
      const bands: EQBand[] = result.bands.map((b: any) => ({
        band: b.band,
        centerFreq: b.centerFreq,
        level: b.level,
      }));

      setState({
        enabled: false,
        bands,
        nativePresets: result.presets || [],
        currentPreset: 'Plano',
        minLevel: result.minLevel,
        maxLevel: result.maxLevel,
        initialized: true,
      });

      logger.log(`EQ initialized on session ${result.sessionId || 0} with ${bands.length} bands`);

      // Restore saved settings
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.enabled) {
          await EqualizerModule.setEnabled(true);
          for (const b of parsed.bands) {
            await EqualizerModule.setBandLevel(b.band, b.level);
          }
          setState(prev => ({
            ...prev,
            enabled: parsed.enabled,
            bands: parsed.bands || prev.bands,
            currentPreset: parsed.currentPreset || 'Plano',
          }));
        }
      }
    } catch (e) {
      logger.error('EQ init error:', e);
      setState(prev => ({
        ...prev,
        initialized: false,
        bands: defaultBands,
      }));
    }
  };

  /**
   * Re-attach the equalizer to the current audio session.
   * Should be called ~500ms after a new track starts playing so that
   * the audio session is active and detectable.
   */
  const reattachEqualizer = useCallback(async () => {
    if (!EqualizerModule || !stateRef.current.initialized) return;

    try {
      const result = await EqualizerModule.reattach();
      logger.log(`EQ reattached to session ${result.sessionId}`);

      // Update bands from native (they were preserved during reattach)
      if (result.bands) {
        const bands = result.bands.map((b: any) => ({
          band: b.band,
          centerFreq: b.centerFreq,
          level: b.level,
        }));
        setState(prev => ({ ...prev, bands }));
      }
    } catch (e) {
      logger.error('EQ reattach error:', e);
    }
  }, []);

  const saveSettings = useCallback(async (newState: Partial<EqualizerState>) => {
    try {
      const current = stateRef.current;
      const toSave = { ...current, ...newState };
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          enabled: toSave.enabled,
          bands: toSave.bands,
          currentPreset: toSave.currentPreset,
        }),
      );
    } catch (_e) {}
  }, []);

  const setEnabled = useCallback(
    async (enabled: boolean) => {
      if (EqualizerModule && stateRef.current.initialized) {
        try {
          await EqualizerModule.setEnabled(enabled);
          // When enabling, re-apply all current band levels to the native EQ
          // (in case they were changed while EQ was disabled)
          if (enabled) {
            for (const b of stateRef.current.bands) {
              try {
                await EqualizerModule.setBandLevel(b.band, b.level);
              } catch (_e) {}
            }
          }
        } catch (_e) {}
      }
      setState(prev => ({ ...prev, enabled }));
      saveSettings({ enabled });
    },
    [saveSettings],
  );

  const setBandLevel = useCallback(
    async (band: number, level: number) => {
      // Always send to native so the level is queued even if EQ is currently disabled.
      // When the user enables the EQ, setEnabled() re-applies all levels anyway.
      if (EqualizerModule && stateRef.current.initialized) {
        try {
          await EqualizerModule.setBandLevel(band, level);
        } catch (_e) {}
      }
      setState(prev => {
        const newBands = prev.bands.map(b => (b.band === band ? { ...b, level } : b));
        saveSettings({ bands: newBands, currentPreset: null });
        return { ...prev, bands: newBands, currentPreset: null };
      });
    },
    [saveSettings],
  );

  const applyPreset = useCallback(
    async (name: string) => {
      const current = stateRef.current;
      const levels = getPresetLevels(name, current.bands.length);
      if (!levels) return;

      const newBands = current.bands.map((b, i) => ({
        ...b,
        level: levels[i],
      }));

      // Always send to native (not only when enabled) so preset is ready when EQ is turned on
      if (EqualizerModule && current.initialized) {
        for (const b of newBands) {
          try {
            await EqualizerModule.setBandLevel(b.band, b.level);
          } catch (_e) {}
        }
      }

      setState(prev => ({ ...prev, bands: newBands, currentPreset: name }));
      saveSettings({ bands: newBands, currentPreset: name });
    },
    [saveSettings],
  );

  const customPresetNames = useMemo(() => Object.keys(CUSTOM_PRESETS), []);

  const ctx = useMemo<EqualizerContextValue>(
    () => ({
      state,
      setEnabled,
      setBandLevel,
      applyPreset,
      customPresetNames,
      reattachEqualizer,
    }),
    [state, setEnabled, setBandLevel, applyPreset, customPresetNames, reattachEqualizer],
  );

  return <EqualizerContext.Provider value={ctx}>{children}</EqualizerContext.Provider>;
}

export function useEqualizer(): EqualizerContextValue {
  const context = useContext(EqualizerContext);
  if (!context) throw new Error('useEqualizer must be used within EqualizerProvider');
  return context;
}
