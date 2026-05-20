import { useTheme } from '@/contexts/ThemeContext';
import React, { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

interface ExpressiveScrollBarProps {
  contentHeight: number;
  visibleHeight: number;
  scrollOffset: number;
  isScrolling: boolean;
}

const THUMB_MIN_HEIGHT = 32;
const BAR_WIDTH = 4;
const HIDE_DELAY = 1200;

function ExpressiveScrollBarComponent({
  contentHeight,
  visibleHeight,
  scrollOffset,
  isScrolling,
}: ExpressiveScrollBarProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  const opacity = useSharedValue(0);

  const ratio = contentHeight > 0 ? visibleHeight / contentHeight : 1;
  const thumbHeight = Math.max(THUMB_MIN_HEIGHT, ratio * visibleHeight);
  const maxScroll = contentHeight - visibleHeight;
  const maxThumbOffset = visibleHeight - thumbHeight;

  useEffect(() => {
    if (isScrolling) {
      opacity.value = withTiming(1, { duration: 150 });
    } else {
      opacity.value = withDelay(HIDE_DELAY, withTiming(0, { duration: 300 }));
    }
  }, [isScrolling, opacity]);

  const thumbOffset =
    maxScroll > 0 ? interpolate(scrollOffset, [0, maxScroll], [0, maxThumbOffset], Extrapolation.CLAMP) : 0;

  const barAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (ratio >= 1) return null;

  return (
    <Animated.View style={[styles.container, barAnimatedStyle]} pointerEvents="none">
      <View style={[styles.track, { backgroundColor: c.surfaceBorder }]}>
        <View
          style={[
            styles.thumb,
            {
              height: thumbHeight,
              top: thumbOffset,
              backgroundColor: c.textMuted,
            },
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 2,
    top: 0,
    bottom: 0,
    width: BAR_WIDTH + 8,
    alignItems: 'flex-end',
    paddingRight: 2,
  },
  track: {
    width: BAR_WIDTH,
    flex: 1,
    borderRadius: BAR_WIDTH / 2,
    overflow: 'hidden',
  },
  thumb: {
    position: 'absolute',
    width: BAR_WIDTH,
    borderRadius: BAR_WIDTH / 2,
  },
});

export const ExpressiveScrollBar = memo(ExpressiveScrollBarComponent);
export default ExpressiveScrollBar;
