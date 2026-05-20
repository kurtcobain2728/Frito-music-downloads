import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { formatDuration } from '@/utils/formatters';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  PanResponder,
  PanResponderGestureState,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface ProgressBarProps {
  position: number;
  duration: number;
  onSeek: (position: number) => void;
  showTimeLabels?: boolean;
  height?: number;
  isPlaying?: boolean;
}

const WAVE_SEGMENT_COUNT = 40;

function WaveBar({
  progress,
  isPlaying,
  fillColor,
  trackColor,
  height,
  barWidth,
}: {
  progress: number;
  isPlaying: boolean;
  fillColor: string;
  trackColor: string;
  height: number;
  barWidth: number;
}) {
  const phase = useSharedValue(0);
  const amplitude = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      amplitude.value = withTiming(1, { duration: 300 });
      phase.value = withRepeat(withTiming(2 * Math.PI, { duration: 1200, easing: Easing.linear }), -1, false);
    } else {
      amplitude.value = withTiming(0, { duration: 400 });
    }
  }, [isPlaying, phase, amplitude]);

  const segments = useMemo(() => {
    return Array.from({ length: WAVE_SEGMENT_COUNT }, (_, i) => i);
  }, []);

  const filledCount = Math.round(progress * WAVE_SEGMENT_COUNT);
  const segmentWidth = barWidth > 0 ? barWidth / WAVE_SEGMENT_COUNT : 0;

  return (
    <View style={[styles.waveContainer, { height: height + 12 }]}>
      {segments.map(i => {
        const isFilled = i < filledCount;
        return (
          <WaveSegment
            key={i}
            index={i}
            segmentWidth={segmentWidth}
            baseHeight={height}
            isFilled={isFilled}
            fillColor={fillColor}
            trackColor={trackColor}
            phase={phase}
            amplitude={amplitude}
            isPlaying={isPlaying}
          />
        );
      })}
    </View>
  );
}

function WaveSegment({
  index,
  segmentWidth,
  baseHeight,
  isFilled,
  fillColor,
  trackColor,
  phase,
  amplitude,
  isPlaying,
}: {
  index: number;
  segmentWidth: number;
  baseHeight: number;
  isFilled: boolean;
  fillColor: string;
  trackColor: string;
  phase: { value: number };
  amplitude: { value: number };
  isPlaying: boolean;
}) {
  const segAnimStyle = useAnimatedStyle(() => {
    const freq = 0.5;
    const wave = Math.sin(phase.value + index * freq) * amplitude.value;
    const extraHeight = wave * (baseHeight * 0.8);
    const h = baseHeight + extraHeight;
    return {
      height: Math.max(2, h),
      backgroundColor: isFilled ? fillColor : trackColor,
    };
  });

  if (segmentWidth <= 0) return null;

  return (
    <Animated.View
      style={[
        {
          width: Math.max(1, segmentWidth - 1),
          borderRadius: 1,
          marginHorizontal: 0.5,
        },
        segAnimStyle,
      ]}
    />
  );
}

function ProgressBarComponent({
  position,
  duration,
  onSeek,
  showTimeLabels = true,
  height = 4,
  isPlaying = false,
}: ProgressBarProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [barWidth, setBarWidth] = useState(0);
  const [barX, setBarX] = useState(0);
  const trackRef = useRef<View>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const thumbScale = useSharedValue(1);

  const progress = duration > 0 ? Math.min(1, Math.max(0, position / duration)) : 0;
  const displayProgress = isDragging ? dragProgress : progress;

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setBarWidth(width);
    trackRef.current?.measureInWindow(pageX => {
      if (pageX !== undefined) setBarX(pageX);
    });
  }, []);

  const calculateProgressFromX = useCallback(
    (pageX: number): number => {
      if (barWidth <= 0) return 0;
      const relativeX = pageX - barX;
      return Math.max(0, Math.min(1, relativeX / barWidth));
    },
    [barWidth, barX],
  );

  const handleSeek = useCallback(
    (newProgress: number) => {
      const newPosition = newProgress * duration;
      if (isFinite(newPosition) && !isNaN(newPosition) && newPosition >= 0) {
        onSeek(Math.min(newPosition, duration));
      }
    },
    [onSeek, duration],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (evt: GestureResponderEvent) => {
          setIsDragging(true);
          thumbScale.value = withSpring(1.5, { damping: 15, stiffness: 300 });
          setDragProgress(calculateProgressFromX(evt.nativeEvent.pageX));
        },
        onPanResponderMove: (evt: GestureResponderEvent, _gs: PanResponderGestureState) => {
          setDragProgress(calculateProgressFromX(evt.nativeEvent.pageX));
        },
        onPanResponderRelease: (evt: GestureResponderEvent) => {
          handleSeek(calculateProgressFromX(evt.nativeEvent.pageX));
          setIsDragging(false);
          thumbScale.value = withSpring(1, { damping: 15, stiffness: 300 });
        },
        onPanResponderTerminate: () => {
          setIsDragging(false);
          thumbScale.value = withSpring(1, { damping: 15, stiffness: 300 });
        },
      }),
    [calculateProgressFromX, handleSeek, thumbScale],
  );

  const thumbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: thumbScale.value }],
  }));

  return (
    <View style={styles.container}>
      <View
        ref={trackRef}
        style={[styles.trackContainer, { height: height + 30 }]}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
      >
        {isDragging ? (
          <View style={[styles.track, { height, backgroundColor: c.progressBar }]}>
            <View
              style={[
                styles.filled,
                { height, width: `${displayProgress * 100}%`, backgroundColor: c.progressBarFill },
              ]}
            />
          </View>
        ) : (
          <WaveBar
            progress={displayProgress}
            isPlaying={isPlaying}
            fillColor={c.progressBarFill}
            trackColor={c.progressBar}
            height={height}
            barWidth={barWidth}
          />
        )}
        <Animated.View
          style={[
            styles.thumb,
            thumbAnimatedStyle,
            { left: `${displayProgress * 100}%`, marginLeft: -8, backgroundColor: c.sliderThumb },
          ]}
        />
      </View>
      {showTimeLabels && (
        <View style={styles.timeContainer}>
          <Text style={[styles.timeText, { color: c.textMuted }]}>
            {formatDuration(isDragging ? dragProgress * duration : position)}
          </Text>
          <Text style={[styles.timeText, { color: c.textMuted }]}>{formatDuration(duration)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  trackContainer: { width: '100%', justifyContent: 'center', paddingHorizontal: 6 },
  track: { width: '100%', borderRadius: BorderRadius.full, overflow: 'hidden' },
  filled: { borderRadius: BorderRadius.full },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  thumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  timeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.regular,
  },
});

export const ProgressBar = memo(ProgressBarComponent);
export default ProgressBar;
