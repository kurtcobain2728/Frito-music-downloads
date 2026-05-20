import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Track, Playlist } from '@/types/audio';

const STORAGE_KEYS = {
  FAVORITES: '@musicplayer/favorites',
  PLAYLISTS: '@musicplayer/playlists',
} as const;

interface FavoritesContextValue {
  favorites: string[];
  playlists: Playlist[];
  isLoading: boolean;
  isFavorite: (trackId: string) => boolean;
  toggleFavorite: (track: Track) => void;
  createPlaylist: (name: string, tracks?: Track[]) => Playlist;
  addToPlaylist: (playlistId: string, tracks: Track[]) => void;
  removeFromPlaylist: (playlistId: string, trackId: string) => void;
  deletePlaylist: (playlistId: string) => void;
  getPlaylist: (playlistId: string) => Playlist | undefined;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

interface FavoritesProviderProps {
  children: ReactNode;
}

const generateId = (): string => {
  return `playlist_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

export function FavoritesProvider({ children }: FavoritesProviderProps) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [favoritesJson, playlistsJson] = await AsyncStorage.multiGet([
          STORAGE_KEYS.FAVORITES,
          STORAGE_KEYS.PLAYLISTS,
        ]);
        if (favoritesJson[1]) {
          const parsed = JSON.parse(favoritesJson[1]);
          if (Array.isArray(parsed)) setFavorites(parsed);
        }
        if (playlistsJson[1]) {
          const parsed = JSON.parse(playlistsJson[1]);
          if (Array.isArray(parsed)) setPlaylists(parsed);
        }
      } catch (_e) {
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const persistFavorites = useCallback(async (ids: string[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(ids));
    } catch (_e) {}
  }, []);

  const persistPlaylists = useCallback(async (lists: Playlist[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(lists));
    } catch (_e) {}
  }, []);

  const isFavorite = useCallback(
    (trackId: string): boolean => {
      return favorites.includes(trackId);
    },
    [favorites],
  );

  const toggleFavorite = useCallback(
    (track: Track) => {
      setFavorites(prev => {
        const next = prev.includes(track.id) ? prev.filter(id => id !== track.id) : [...prev, track.id];
        persistFavorites(next);
        return next;
      });
    },
    [persistFavorites],
  );

  const createPlaylist = useCallback(
    (name: string, tracks: Track[] = []): Playlist => {
      const newPlaylist: Playlist = {
        id: generateId(),
        name,
        tracks,
        trackCount: tracks.length,
        artwork: tracks[0]?.artwork,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setPlaylists(prev => {
        const next = [...prev, newPlaylist];
        persistPlaylists(next);
        return next;
      });
      return newPlaylist;
    },
    [persistPlaylists],
  );

  const addToPlaylist = useCallback(
    (playlistId: string, tracks: Track[]) => {
      setPlaylists(prev => {
        const next = prev.map(playlist => {
          if (playlist.id === playlistId) {
            const existingIds = new Set(playlist.tracks.map(t => t.id));
            const newTracks = tracks.filter(t => !existingIds.has(t.id));
            const updatedTracks = [...playlist.tracks, ...newTracks];
            return {
              ...playlist,
              tracks: updatedTracks,
              trackCount: updatedTracks.length,
              artwork: updatedTracks[0]?.artwork || playlist.artwork,
              updatedAt: Date.now(),
            };
          }
          return playlist;
        });
        persistPlaylists(next);
        return next;
      });
    },
    [persistPlaylists],
  );

  const removeFromPlaylist = useCallback(
    (playlistId: string, trackId: string) => {
      setPlaylists(prev => {
        const next = prev.map(playlist => {
          if (playlist.id === playlistId) {
            const updatedTracks = playlist.tracks.filter(t => t.id !== trackId);
            return {
              ...playlist,
              tracks: updatedTracks,
              trackCount: updatedTracks.length,
              artwork: updatedTracks[0]?.artwork,
              updatedAt: Date.now(),
            };
          }
          return playlist;
        });
        persistPlaylists(next);
        return next;
      });
    },
    [persistPlaylists],
  );

  const deletePlaylist = useCallback(
    (playlistId: string) => {
      setPlaylists(prev => {
        const next = prev.filter(p => p.id !== playlistId);
        persistPlaylists(next);
        return next;
      });
    },
    [persistPlaylists],
  );

  const getPlaylist = useCallback(
    (playlistId: string): Playlist | undefined => {
      return playlists.find(p => p.id === playlistId);
    },
    [playlists],
  );

  const contextValue = useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      playlists,
      isLoading,
      isFavorite,
      toggleFavorite,
      createPlaylist,
      addToPlaylist,
      removeFromPlaylist,
      deletePlaylist,
      getPlaylist,
    }),
    [
      favorites,
      playlists,
      isLoading,
      isFavorite,
      toggleFavorite,
      createPlaylist,
      addToPlaylist,
      removeFromPlaylist,
      deletePlaylist,
      getPlaylist,
    ],
  );

  return <FavoritesContext.Provider value={contextValue}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}

export default FavoritesContext;
