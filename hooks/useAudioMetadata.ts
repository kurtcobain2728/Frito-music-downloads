import { getMetadata } from '@/utils/artworkCache';
import { useEffect, useRef, useState } from 'react';

export interface AudioMetaLabel {
  sampleRate: number | null;
  bitrate: number | null;
  mimeType: string | null;
  label: string | null;
}

const MIME_TO_FORMAT: Record<string, string> = {
  'audio/mpeg': 'MP3',
  'audio/mp3': 'MP3',
  'audio/flac': 'FLAC',
  'audio/x-flac': 'FLAC',
  'audio/wav': 'WAV',
  'audio/x-wav': 'WAV',
  'audio/aac': 'AAC',
  'audio/mp4': 'AAC',
  'audio/x-m4a': 'M4A',
  'audio/ogg': 'OGG',
  'audio/vorbis': 'OGG',
  'audio/opus': 'OPUS',
  'audio/x-ms-wma': 'WMA',
  'audio/aiff': 'AIFF',
  'audio/x-aiff': 'AIFF',
};

function formatMime(mimeType: string | null): string | null {
  if (!mimeType) return null;
  return MIME_TO_FORMAT[mimeType.toLowerCase()] || mimeType.replace('audio/', '').toUpperCase();
}

function buildLabel(sampleRate: number | null, bitrate: number | null, mimeType: string | null): string | null {
  const parts: string[] = [];

  if (sampleRate && sampleRate > 0) {
    parts.push(`${(sampleRate / 1000).toFixed(1)} kHz`);
  }

  if (bitrate && bitrate > 0) {
    parts.push(`${Math.round(bitrate / 1000)} kbps`);
  }

  const format = formatMime(mimeType);
  if (format) {
    parts.push(format);
  }

  return parts.length > 0 ? parts.join(' \u2022 ') : null;
}

export function useAudioMetadata(trackUri: string | undefined, trackId: string | undefined): AudioMetaLabel {
  const [meta, setMeta] = useState<AudioMetaLabel>({ sampleRate: null, bitrate: null, mimeType: null, label: null });
  const prevTrackIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!trackUri || !trackId) {
      setMeta({ sampleRate: null, bitrate: null, mimeType: null, label: null });
      return;
    }

    if (trackId === prevTrackIdRef.current) return;
    prevTrackIdRef.current = trackId;

    let cancelled = false;

    (async () => {
      const result = await getMetadata(trackUri);
      if (cancelled || !result) return;

      const sampleRate = result.sampleRate ?? null;
      const bitrate = result.bitrate ?? null;
      const mimeType = result.mimeType ?? null;
      const label = buildLabel(sampleRate, bitrate, mimeType);

      setMeta({ sampleRate, bitrate, mimeType, label });
    })();

    return () => {
      cancelled = true;
    };
  }, [trackUri, trackId]);

  return meta;
}
