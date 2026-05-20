import { BorderRadius } from '@/constants/theme';
import { getArtwork, getCachedArtwork } from '@/utils/artworkCache';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { ArtworkPlaceholder } from './ArtworkPlaceholder';

interface OptimizedArtworkProps {
  uri?: string;
  trackUri?: string;
  trackId: string;
  size: number;
  borderRadius?: number;
  iconSize?: number;
}

function OptimizedArtworkComponent({
  uri,
  trackUri,
  trackId,
  size,
  borderRadius = BorderRadius.sm,
  iconSize,
}: OptimizedArtworkProps) {
  const [imageSource, setImageSource] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
    setImageSource(null);

    if (uri) {
      setImageSource(uri);
      return;
    }

    if (trackUri) {
      const cached = getCachedArtwork(trackUri);
      if (cached) {
        setImageSource(cached);
        return;
      }

      let cancelled = false;
      getArtwork(trackUri, size * 2).then(result => {
        if (!cancelled && result) setImageSource(result);
      });
      return () => {
        cancelled = true;
      };
    }
  }, [uri, trackUri, trackId, size]);

  const handleError = useCallback(() => {
    if (imageSource === uri && trackUri) {
      const cached = getCachedArtwork(trackUri);
      if (cached) {
        setImageSource(cached);
        return;
      }
      getArtwork(trackUri, size * 2).then(result => {
        if (result) setImageSource(result);
        else setError(true);
      });
    } else {
      setError(true);
    }
  }, [imageSource, uri, trackUri, size]);

  if (!imageSource || error) {
    return <ArtworkPlaceholder trackId={trackId} size={size} iconSize={iconSize} borderRadius={borderRadius} />;
  }

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius }]}>
      <Image source={{ uri: imageSource }} style={styles.image} resizeMode="cover" onError={handleError} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
});

export const OptimizedArtwork = memo(OptimizedArtworkComponent);
export default OptimizedArtwork;
