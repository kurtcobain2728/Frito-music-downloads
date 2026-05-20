import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme, type ThemeColors } from '@/contexts/ThemeContext';
import { useEqualizer } from '@/contexts/EqualizerContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

function formatFreq(hz: number): string {
  if (hz >= 1000) return `${(hz / 1000).toFixed(hz >= 10000 ? 0 : 1)}k`;
  return `${hz}`;
}

function EQSlider({
  level,
  minLevel,
  maxLevel,
  freq,
  onLevelChange,
  enabled,
  primaryColor,
  colors,
}: {
  level: number;
  minLevel: number;
  maxLevel: number;
  freq: number;
  onLevelChange: (level: number) => void;
  enabled: boolean;
  primaryColor: string;
  colors: ThemeColors;
}) {
  const SLIDER_HEIGHT = 180;
  const range = maxLevel - minLevel;
  const normalised = (level - minLevel) / range;
  const fillHeight = useSharedValue(normalised);
  const startY = useSharedValue(0);

  useEffect(() => {
    fillHeight.value = withTiming(normalised, { duration: 80 });
  }, [normalised]);

  const gesture = Gesture.Pan()
    .onBegin(() => {
      startY.value = fillHeight.value;
    })
    .onUpdate(e => {
      if (!enabled) return;
      const delta = -e.translationY / SLIDER_HEIGHT;
      const newVal = Math.max(0, Math.min(1, startY.value + delta));
      fillHeight.value = newVal;
      const newLevel = Math.round(minLevel + newVal * range);
      onLevelChange(newLevel);
    })
    .runOnJS(true);

  const fillStyle = useAnimatedStyle(() => ({
    height: `${fillHeight.value * 100}%`,
  }));

  const db = Math.round(level / 100);

  return (
    <View style={styles.sliderCol}>
      <Text style={[styles.dbLabel, { color: enabled ? colors.textPrimary : colors.textMuted }]}>
        {db > 0 ? `+${db}` : db}
      </Text>
      <GestureDetector gesture={gesture}>
        <View style={[styles.sliderTrack, { height: SLIDER_HEIGHT, backgroundColor: colors.backgroundHighlight }]}>
          <Animated.View
            style={[styles.sliderFill, fillStyle, { backgroundColor: enabled ? primaryColor : colors.textMuted }]}
          />
          <View style={[styles.sliderZero, { backgroundColor: colors.textMuted }]} />
        </View>
      </GestureDetector>
      <Text style={[styles.freqLabel, { color: colors.textMuted }]}>{formatFreq(freq)}</Text>
    </View>
  );
}

export default function EqualizerScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const c = theme.colors;
  const { state, setEnabled, setBandLevel, applyPreset, customPresetNames } = useEqualizer();

  const handleBandChange = useCallback(
    (band: number) => (level: number) => {
      setBandLevel(band, level);
    },
    [setBandLevel],
  );

  return (
    <View style={[styles.container, { backgroundColor: c.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={c.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.textPrimary }]}>Ecualizador</Text>
        <Switch
          value={state.enabled}
          onValueChange={setEnabled}
          trackColor={{ false: c.backgroundHighlight, true: c.primary + '60' }}
          thumbColor={state.enabled ? c.primary : c.textMuted}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.slidersRow}>
          {state.bands.map(band => (
            <EQSlider
              key={band.band}
              level={band.level}
              minLevel={state.minLevel}
              maxLevel={state.maxLevel}
              freq={band.centerFreq}
              onLevelChange={handleBandChange(band.band)}
              enabled={state.enabled}
              primaryColor={c.primary}
              colors={c}
            />
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Presets</Text>
        <View style={styles.presetsGrid}>
          {customPresetNames.map(name => (
            <TouchableOpacity
              key={name}
              style={[
                styles.presetBtn,
                { backgroundColor: c.backgroundElevated },
                state.currentPreset === name && { backgroundColor: c.primary },
              ]}
              onPress={() => applyPreset(name)}
            >
              <Text
                style={[
                  styles.presetText,
                  { color: c.textSecondary },
                  state.currentPreset === name && { color: c.background },
                ]}
              >
                {name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {!state.initialized && (
          <View style={[styles.notice, { backgroundColor: c.backgroundElevated }]}>
            <Ionicons name="warning" size={24} color={c.warning} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.noticeTitle, { color: c.textPrimary }]}>Ecualizador no disponible</Text>
              <Text style={[styles.noticeText, { color: c.textSecondary }]}>
                El ecualizador necesita un build nativo para funcionar. Ejecuta estos comandos en tu terminal:{'\n\n'}
                1. npx expo prebuild --clean{'\n'}
                2. npx expo run:android{'\n\n'}
                Mientras tanto, puedes explorar los presets y ajustes. Se aplicarán cuando el módulo nativo esté activo.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: Typography.fontSize.lg, fontWeight: '700' },
  scrollContent: { padding: Spacing.base, paddingBottom: 120 },
  slidersRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.xl },
  sliderCol: { alignItems: 'center', flex: 1 },
  dbLabel: { fontSize: 11, fontWeight: '600', marginBottom: 6 },
  sliderTrack: { width: 28, borderRadius: 14, overflow: 'hidden', justifyContent: 'flex-end' },
  sliderFill: { width: '100%', borderRadius: 14 },
  sliderZero: { position: 'absolute', left: 4, right: 4, height: 1, top: '50%' },
  freqLabel: { fontSize: 10, marginTop: 6 },
  sectionTitle: { fontSize: Typography.fontSize.lg, fontWeight: '700', marginBottom: Spacing.md },
  presetsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  presetBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full },
  presetText: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.xl,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  noticeTitle: { fontSize: Typography.fontSize.md, fontWeight: '700', marginBottom: Spacing.xs },
  noticeText: { flex: 1, fontSize: Typography.fontSize.sm, lineHeight: 20 },
});
