import type { PlayerControls, PlayerState, RepeatMode, Track } from '@/types/audio';
import MediaServiceModule from '@/modules/media-service';
import { EventEmitter } from 'expo-modules-core';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
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
import { Platform, PermissionsAndroid } from 'react-native';

interface PlaybackPositionValue {
  position: number;
  duration: number;
}

interface PlaybackMetadataValue {
  currentTrack: Track | null;
  queue: Track[];
  currentIndex: number;
  isPlaying: boolean;
  isLoading: boolean;
  volume: number;
  shuffle: boolean;
  repeat: RepeatMode;
}

interface PlayerContextValue {
  state: PlayerState;
  controls: PlayerControls;
}

const createDefaultPlayerState = (): PlayerState => ({
  currentTrack: null,
  queue: [],
  currentIndex: -1,
  isPlaying: false,
  isLoading: false,
  position: 0,
  duration: 0,
  volume: 1.0,
  shuffle: false,
  repeat: 'off',
});

const PlaybackPositionContext = createContext<PlaybackPositionValue>({ position: 0, duration: 0 });
const PlaybackMetadataContext = createContext<PlaybackMetadataValue | undefined>(undefined);
const PlaybackControlsContext = createContext<PlayerControls | undefined>(undefined);
const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

interface PlayerProviderProps {
  children: ReactNode;
}

const MAX_AUTOPLAY_RETRIES = 5;
const AUTOPLAY_BASE_DELAY = 200;

export function PlayerProvider({ children }: PlayerProviderProps) {
  const [state, setState] = useState<PlayerState>(createDefaultPlayerState);

  const originalQueueRef = useRef<Track[]>([]);
  const shouldAutoPlayRef = useRef(false);
  const trackFinishedRef = useRef(false);
  const stateRef = useRef<PlayerState>(createDefaultPlayerState());
  const autoplayGenerationRef = useRef(0);
  const serviceStartedRef = useRef(false);
  const didJustFinishProcessedRef = useRef<number>(-1);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const player = useAudioPlayer(state.currentTrack?.uri ? { uri: state.currentTrack.uri } : null);

  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          shouldRouteThroughEarpiece: false,
        });
      } catch (_e) {}
    };
    setupAudio();
  }, []);

  useEffect(() => {
    if (!MediaServiceModule) return;

    let emitter: InstanceType<typeof EventEmitter> | null = null;
    const subscriptions: any[] = [];

    try {
      emitter = new EventEmitter(MediaServiceModule as any);

      subscriptions.push(
        emitter.addListener('onRemotePlay', () => {
          try {
            player.play();
          } catch (_e) {}
        }),
        emitter.addListener('onRemotePause', () => {
          try {
            player.pause();
          } catch (_e) {}
        }),
        emitter.addListener('onRemoteNext', () => {
          nextRef.current();
        }),
        emitter.addListener('onRemotePrevious', () => {
          previousRef.current();
        }),
        emitter.addListener('onRemoteSeek', (event: { position: number }) => {
          try {
            player.seekTo(event.position / 1000);
          } catch (_e) {}
        }),
        emitter.addListener('onRemoteStop', () => {
          try {
            player.pause();
          } catch (_e) {}
        }),
      );
    } catch (_e) {}

    return () => {
      subscriptions.forEach(sub => {
        try {
          sub.remove();
        } catch (_e) {}
      });
    };
  }, [player]);

  useEffect(() => {
    const svc = MediaServiceModule;
    if (state.currentTrack && svc) {
      const startAndUpdate = async () => {
        try {
          if (!serviceStartedRef.current) {
            if (Platform.OS === 'android' && Platform.Version >= 33) {
              try {
                await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
              } catch (_e) {}
            }
            await svc.startService();
            serviceStartedRef.current = true;
          }
          const track = state.currentTrack;
          if (track) {
            svc.updateMetadata(track.title, track.artist, track.album, track.duration, track.uri || null);
          }
        } catch (_e) {}
      };
      startAndUpdate();
    }
  }, [state.currentTrack?.id]);

  useEffect(() => {
    if (MediaServiceModule) {
      try {
        MediaServiceModule.updatePlaybackState(state.isPlaying, state.position);
      } catch (_e) {}
    }
  }, [state.isPlaying, Math.floor(state.position / 1000)]);

  useEffect(() => {
    if (status) {
      const playing = status.playing;
      const position = status.currentTime * 1000;
      const duration = status.duration * 1000;
      const isBuffering = status.isBuffering;

      setState(prev => {
        if (
          prev.isPlaying === playing &&
          Math.abs(prev.position - position) < 250 &&
          Math.abs(prev.duration - duration) < 100 &&
          prev.isLoading === isBuffering
        ) {
          return prev;
        }
        return {
          ...prev,
          isPlaying: playing,
          position,
          duration,
          isLoading: isBuffering,
        };
      });
    }
  }, [status]);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const play = useCallback(async () => {
    if (player && stateRef.current.currentTrack) {
      try {
        await player.play();
      } catch (_e) {}
    }
  }, [player]);

  const pause = useCallback(async () => {
    if (player) {
      try {
        await player.pause();
      } catch (_e) {}
    }
  }, [player]);

  const togglePlayPause = useCallback(async () => {
    try {
      if (stateRef.current.isPlaying) {
        await pause();
      } else {
        await play();
      }
    } catch (_e) {}
  }, [play, pause]);

  const playTrack = useCallback(async (track: Track, queue?: Track[]) => {
    const newQueue = queue || [track];
    const trackIndex = newQueue.findIndex(t => t.id === track.id);

    originalQueueRef.current = newQueue;
    shouldAutoPlayRef.current = true;
    trackFinishedRef.current = false;

    setState(prev => {
      const finalQueue = prev.shuffle ? shuffleArray(newQueue) : newQueue;
      const finalIndex = prev.shuffle ? finalQueue.findIndex(t => t.id === track.id) : trackIndex >= 0 ? trackIndex : 0;

      return {
        ...prev,
        currentTrack: track,
        queue: finalQueue,
        currentIndex: finalIndex >= 0 ? finalIndex : 0,
        isLoading: true,
        position: 0,
        duration: 0,
      };
    });
  }, []);

  const next = useCallback(async () => {
    const s = stateRef.current;
    if (s.queue.length === 0) return;

    if (s.repeat === 'one') {
      if (player) {
        try {
          await player.seekTo(0);
          await player.play();
        } catch (_e) {}
      }
      return;
    }

    let nextIndex = s.currentIndex + 1;

    if (nextIndex >= s.queue.length) {
      if (s.repeat === 'all') {
        nextIndex = 0;
      } else {
        setState(prev => ({ ...prev, isPlaying: false }));
        if (player) {
          try {
            await player.pause();
            await player.seekTo(0);
          } catch (_e) {}
        }
        return;
      }
    }

    const nextTrack = s.queue[nextIndex];
    if (nextTrack) {
      shouldAutoPlayRef.current = true;
      trackFinishedRef.current = false;
      setState(prev => ({
        ...prev,
        currentTrack: nextTrack,
        currentIndex: nextIndex,
        isLoading: true,
        position: 0,
        duration: 0,
      }));
    }
  }, [player]);

  const previous = useCallback(async () => {
    const s = stateRef.current;

    if (s.position > 3000) {
      if (player) {
        try {
          await player.seekTo(0);
        } catch (_e) {}
      }
      setState(prev => ({ ...prev, position: 0 }));
      return;
    }

    if (s.queue.length === 0) return;

    let prevIndex = s.currentIndex - 1;

    if (prevIndex < 0) {
      if (s.repeat === 'all') {
        prevIndex = s.queue.length - 1;
      } else {
        if (player) {
          try {
            await player.seekTo(0);
          } catch (_e) {}
        }
        setState(prev => ({ ...prev, position: 0 }));
        return;
      }
    }

    const prevTrack = s.queue[prevIndex];
    if (prevTrack) {
      shouldAutoPlayRef.current = true;
      trackFinishedRef.current = false;
      setState(prev => ({
        ...prev,
        currentTrack: prevTrack,
        currentIndex: prevIndex,
        isLoading: true,
        position: 0,
        duration: 0,
      }));
    }
  }, [player]);

  const nextRef = useRef(next);
  const previousRef = useRef(previous);
  useEffect(() => {
    nextRef.current = next;
  }, [next]);
  useEffect(() => {
    previousRef.current = previous;
  }, [previous]);

  const seek = useCallback(
    async (positionMs: number) => {
      if (player) {
        try {
          const dur = stateRef.current.duration > 0 ? stateRef.current.duration : player.duration * 1000;
          const validPosition = Math.max(0, dur > 0 ? Math.min(positionMs, dur) : positionMs);
          const positionSeconds = validPosition / 1000;

          if (!isFinite(positionSeconds) || isNaN(positionSeconds) || positionSeconds < 0) {
            return;
          }

          await player.seekTo(positionSeconds);
          setState(prev => ({ ...prev, position: validPosition }));
        } catch (_e) {}
      }
    },
    [player],
  );

  const setVolume = useCallback(
    async (volume: number) => {
      if (player) {
        try {
          const newVolume = Math.max(0, Math.min(1, volume));
          player.volume = newVolume;
          setState(prev => ({ ...prev, volume: newVolume }));
        } catch (_e) {}
      }
    },
    [player],
  );

  const toggleShuffle = useCallback(() => {
    setState(prev => {
      const newShuffle = !prev.shuffle;

      if (newShuffle) {
        const currentTrack = prev.currentTrack;
        const otherTracks = prev.queue.filter(t => t.id !== currentTrack?.id);
        const shuffledOthers = shuffleArray(otherTracks);
        const newQueue = currentTrack ? [currentTrack, ...shuffledOthers] : shuffledOthers;

        return {
          ...prev,
          shuffle: true,
          queue: newQueue,
          currentIndex: 0,
        };
      } else {
        const currentTrack = prev.currentTrack;
        const newQueue = originalQueueRef.current;
        const newIndex = currentTrack ? newQueue.findIndex(t => t.id === currentTrack.id) : 0;

        return {
          ...prev,
          shuffle: false,
          queue: newQueue,
          currentIndex: newIndex >= 0 ? newIndex : 0,
        };
      }
    });
  }, []);

  const toggleRepeat = useCallback(() => {
    setState(prev => {
      const modes: RepeatMode[] = ['off', 'all', 'one'];
      const currentModeIndex = modes.indexOf(prev.repeat);
      const nextModeIndex = (currentModeIndex + 1) % modes.length;
      return { ...prev, repeat: modes[nextModeIndex] };
    });
  }, []);

  const addToQueue = useCallback((tracks: Track[]) => {
    setState(prev => ({
      ...prev,
      queue: [...prev.queue, ...tracks],
    }));
    originalQueueRef.current = [...originalQueueRef.current, ...tracks];
  }, []);

  const clearQueue = useCallback(async () => {
    if (player) {
      try {
        await player.pause();
      } catch (_e) {}
    }
    setState(createDefaultPlayerState());
    originalQueueRef.current = [];
  }, [player]);

  const didJustFinish = status?.didJustFinish ?? false;

  useEffect(() => {
    if (!didJustFinish) return;

    // Uso generación para evitar dobles triggers de la misma canción
    const generation = autoplayGenerationRef.current;
    if (didJustFinishProcessedRef.current === generation) return;
    didJustFinishProcessedRef.current = generation;

    trackFinishedRef.current = true;
    // Pequeño delay para que el estado se sincronice antes de avanzar
    const timer = setTimeout(() => {
      nextRef.current();
    }, 50);
    return () => clearTimeout(timer);
  }, [didJustFinish]);

  useEffect(() => {
    if (state.currentTrack && player) {
      const generation = ++autoplayGenerationRef.current;
      let cancelled = false;
      let retryCount = 0;

      const tryAutoPlay = async () => {
        if (!shouldAutoPlayRef.current || cancelled || autoplayGenerationRef.current !== generation) return;

        const delay = AUTOPLAY_BASE_DELAY * Math.pow(1.5, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));

        if (cancelled || autoplayGenerationRef.current !== generation) return;

        try {
          await player.play();
          shouldAutoPlayRef.current = false;
        } catch (_e) {
          retryCount++;
          if (retryCount < MAX_AUTOPLAY_RETRIES && !cancelled && autoplayGenerationRef.current === generation) {
            tryAutoPlay();
          }
        }
      };

      tryAutoPlay();

      return () => {
        cancelled = true;
      };
    }
  }, [state.currentTrack?.id, player]);

  const controls: PlayerControls = useMemo(
    () => ({
      play,
      pause,
      togglePlayPause,
      next,
      previous,
      seek,
      setVolume,
      toggleShuffle,
      toggleRepeat,
      playTrack,
      addToQueue,
      clearQueue,
    }),
    [
      play,
      pause,
      togglePlayPause,
      next,
      previous,
      seek,
      setVolume,
      toggleShuffle,
      toggleRepeat,
      playTrack,
      addToQueue,
      clearQueue,
    ],
  );

  const positionValue: PlaybackPositionValue = useMemo(
    () => ({ position: state.position, duration: state.duration }),
    [state.position, state.duration],
  );

  const metadataValue: PlaybackMetadataValue = useMemo(
    () => ({
      currentTrack: state.currentTrack,
      queue: state.queue,
      currentIndex: state.currentIndex,
      isPlaying: state.isPlaying,
      isLoading: state.isLoading,
      volume: state.volume,
      shuffle: state.shuffle,
      repeat: state.repeat,
    }),
    [
      state.currentTrack,
      state.queue,
      state.currentIndex,
      state.isPlaying,
      state.isLoading,
      state.volume,
      state.shuffle,
      state.repeat,
    ],
  );

  const contextValue: PlayerContextValue = useMemo(
    () => ({
      state,
      controls,
    }),
    [state, controls],
  );

  return (
    <PlaybackControlsContext.Provider value={controls}>
      <PlaybackMetadataContext.Provider value={metadataValue}>
        <PlaybackPositionContext.Provider value={positionValue}>
          <PlayerContext.Provider value={contextValue}>{children}</PlayerContext.Provider>
        </PlaybackPositionContext.Provider>
      </PlaybackMetadataContext.Provider>
    </PlaybackControlsContext.Provider>
  );
}

export function usePlayer(): PlayerContextValue {
  const context = useContext(PlayerContext);

  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }

  return context;
}

export function usePlaybackPosition(): PlaybackPositionValue {
  return useContext(PlaybackPositionContext);
}

export function usePlaybackMetadata(): PlaybackMetadataValue {
  const context = useContext(PlaybackMetadataContext);
  if (context === undefined) {
    throw new Error('usePlaybackMetadata must be used within a PlayerProvider');
  }
  return context;
}

export function usePlaybackControls(): PlayerControls {
  const context = useContext(PlaybackControlsContext);
  if (context === undefined) {
    throw new Error('usePlaybackControls must be used within a PlayerProvider');
  }
  return context;
}

export default PlayerContext;
