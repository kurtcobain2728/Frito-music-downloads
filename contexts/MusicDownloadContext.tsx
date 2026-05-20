import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { QUALITY_BY_EXTENSION } from '@/constants/extensions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExtensionManager } from '@/utils/extensionManager';

export interface SearchResult {
  tracks: TrackResult[];
  albums: AlbumResult[];
  artists: ArtistResult[];
}

export interface TrackResult {
  id: string;
  name: string;
  artists: string;
  album: string;
  duration_ms: number;
  imageUrl: string;
  external_url: string;
  platform: string;
}

export interface AlbumResult {
  id: string;
  name: string;
  artists: string;
  imageUrl: string;
  platform: string;
}

export interface ArtistResult {
  id: string;
  name: string;
  imageUrl: string;
  platform: string;
}

export interface DownloadTask {
  id: string;
  trackId: string;
  trackName: string;
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  error?: string;
}

interface MusicDownloadState {
  selectedExtensionId: string;
  selectedQuality: string;
  searchQuery: string;
  searchResults: SearchResult | null;
  isSearching: boolean;
  downloadQueue: DownloadTask[];
  setExtension: (id: string) => void;
  setQuality: (q: string) => void;
  setSearchQuery: (q: string) => void;
  setSearchResults: (results: SearchResult | null) => void;
  setIsSearching: (isSearching: boolean) => void;
  addDownloadTask: (task: DownloadTask) => void;
  updateDownloadTask: (id: string, updates: Partial<DownloadTask>) => void;
}

const MusicDownloadContext = createContext<MusicDownloadState | undefined>(undefined);

export function MusicDownloadProvider({ children }: { children: React.ReactNode }) {
  // Inicializamos vacío — el ExtensionPicker auto-seleccionará la primera extensión instalada o cargada
  const [selectedExtensionId, setSelectedExtensionId] = useState<string>('');
  const [selectedQuality, setSelectedQuality] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [downloadQueue, setDownloadQueue] = useState<DownloadTask[]>([]);

  const setExtension = useCallback((id: string) => {
    setSelectedExtensionId(id);
    if (id) {
      AsyncStorage.setItem('selected_extension_id', id).catch(() => {});
    }
    // Buscar calidades conocidas para esta extensión
    const qualities = QUALITY_BY_EXTENSION[id];
    if (qualities && qualities.length > 0) {
      setSelectedQuality(qualities[0].value);
    } else {
      setSelectedQuality('best');
    }
  }, []);

  useEffect(() => {
    const initDownloadState = async () => {
      try {
        const manager = ExtensionManager.getInstance();
        await manager.initialize();
        
        const savedId = await AsyncStorage.getItem('selected_extension_id');
        const installed = manager.getInstalledExtensions();
        
        if (savedId && installed.some(ext => ext.name === savedId)) {
          setExtension(savedId);
        } else if (installed.length > 0) {
          setExtension(installed[0].name);
        }
      } catch (e) {
        console.error('Failed to load initial download state:', e);
      }
    };
    initDownloadState();
  }, [setExtension]);

  const setQuality = useCallback((q: string) => setSelectedQuality(q), []);

  const addDownloadTask = useCallback((task: DownloadTask) => {
    setDownloadQueue(prev => [...prev, task]);
  }, []);

  const updateDownloadTask = useCallback((id: string, updates: Partial<DownloadTask>) => {
    setDownloadQueue(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  return (
    <MusicDownloadContext.Provider
      value={{
        selectedExtensionId,
        selectedQuality,
        searchQuery,
        searchResults,
        isSearching,
        downloadQueue,
        setExtension,
        setQuality,
        setSearchQuery,
        setSearchResults,
        setIsSearching,
        addDownloadTask,
        updateDownloadTask,
      }}
    >
      {children}
    </MusicDownloadContext.Provider>
  );
}

export function useMusicDownload() {
  const context = useContext(MusicDownloadContext);
  if (context === undefined) {
    throw new Error('useMusicDownload must be used within a MusicDownloadProvider');
  }
  return context;
}
