import { usePlayer } from '@/contexts/PlayerContext';
import { getLyricsByGet, searchLyrics, type LrcLibResult } from '@/utils/lyricsApi';
import { findActiveLine, parseLrc, type ParsedLyrics } from '@/utils/lyricsUtils';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

interface LyricsState {
  lyrics: ParsedLyrics | null;
  activeLine: number;
  isLoading: boolean;
  error: string | null;
  syncOffset: number;
  searchResults: LrcLibResult[];
  isSearching: boolean;
}

interface LyricsContextValue {
  state: LyricsState;
  adjustOffset: (deltaMs: number) => void;
  resetOffset: () => void;
  searchManual: (query: string) => Promise<void>;
  applyResult: (result: LrcLibResult) => void;
  clearLyrics: () => void;
}

const LyricsContext = createContext<LyricsContextValue | undefined>(undefined);

export function LyricsProvider({ children }: { children: ReactNode }) {
  const { state: playerState } = usePlayer();
  const [lyricsState, setLyricsState] = useState<LyricsState>({
    lyrics: null,
    activeLine: -1,
    isLoading: false,
    error: null,
    syncOffset: 0,
    searchResults: [],
    isSearching: false,
  });
  const prevTrackIdRef = useRef<string | undefined>(undefined);
  const offsetRef = useRef(0);

  useEffect(() => {
    const trackId = playerState.currentTrack?.id;
    if (!trackId || trackId === prevTrackIdRef.current) return;
    prevTrackIdRef.current = trackId;

    const track = playerState.currentTrack;
    if (!track) return;

    setLyricsState(prev => ({ ...prev, isLoading: true, error: null, lyrics: null, activeLine: -1, syncOffset: 0 }));
    offsetRef.current = 0;

    let cancelled = false;

    (async () => {
      try {
        const result = await getLyricsByGet(track.title, track.artist, track.album, track.duration);

        if (cancelled) return;

        if (result) {
          const raw = result.syncedLyrics || result.plainLyrics || '';
          const parsed = parseLrc(raw);
          setLyricsState(prev => ({ ...prev, lyrics: parsed, isLoading: false }));
        } else {
          const results = await searchLyrics(track.title, track.artist);
          if (cancelled) return;

          if (results.length > 0) {
            const best = results[0];
            const raw = best.syncedLyrics || best.plainLyrics || '';
            const parsed = parseLrc(raw);
            setLyricsState(prev => ({ ...prev, lyrics: parsed, isLoading: false }));
          } else {
            setLyricsState(prev => ({ ...prev, isLoading: false, error: 'No se encontraron letras' }));
          }
        }
      } catch (_e) {
        if (!cancelled) {
          setLyricsState(prev => ({ ...prev, isLoading: false, error: 'Error al buscar letras' }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [playerState.currentTrack?.id]);

  useEffect(() => {
    if (lyricsState.lyrics?.type !== 'synchronized') return;

    const posWithOffset = playerState.position + offsetRef.current;
    const idx = findActiveLine(lyricsState.lyrics.lines, posWithOffset);

    if (idx !== lyricsState.activeLine) {
      setLyricsState(prev => ({ ...prev, activeLine: idx }));
    }
  }, [playerState.position, lyricsState.lyrics, lyricsState.activeLine]);

  const adjustOffset = useCallback((deltaMs: number) => {
    offsetRef.current += deltaMs;
    setLyricsState(prev => ({ ...prev, syncOffset: offsetRef.current }));
  }, []);

  const resetOffset = useCallback(() => {
    offsetRef.current = 0;
    setLyricsState(prev => ({ ...prev, syncOffset: 0 }));
  }, []);

  const searchManual = useCallback(async (query: string) => {
    setLyricsState(prev => ({ ...prev, isSearching: true, searchResults: [] }));
    try {
      const results = await searchLyrics(query);
      setLyricsState(prev => ({ ...prev, searchResults: results, isSearching: false }));
    } catch (_e) {
      setLyricsState(prev => ({ ...prev, isSearching: false }));
    }
  }, []);

  const applyResult = useCallback((result: LrcLibResult) => {
    const raw = result.syncedLyrics || result.plainLyrics || '';
    const parsed = parseLrc(raw);
    setLyricsState(prev => ({ ...prev, lyrics: parsed, searchResults: [], error: null }));
  }, []);

  const clearLyrics = useCallback(() => {
    setLyricsState(prev => ({ ...prev, lyrics: null, activeLine: -1, error: null }));
  }, []);

  const ctx = useMemo<LyricsContextValue>(
    () => ({
      state: lyricsState,
      adjustOffset,
      resetOffset,
      searchManual,
      applyResult,
      clearLyrics,
    }),
    [lyricsState, adjustOffset, resetOffset, searchManual, applyResult, clearLyrics],
  );

  return <LyricsContext.Provider value={ctx}>{children}</LyricsContext.Provider>;
}

export function useLyrics(): LyricsContextValue {
  const context = useContext(LyricsContext);
  if (!context) throw new Error('useLyrics must be used within LyricsProvider');
  return context;
}
