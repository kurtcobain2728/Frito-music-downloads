/**
 * Types for the Music Player application
 * Defines core data structures for tracks, folders, playlists and player state
 */

// =============================================================================
// Track Types
// =============================================================================

/**
 * Represents a single audio track with all its metadata
 */
export interface Track {
  /** Unique identifier for the track */
  id: string;
  /** File URI to the audio file */
  uri: string;
  /** Display title of the track */
  title: string;
  /** Artist name */
  artist: string;
  /** Album name */
  album: string;
  /** Duration in milliseconds */
  duration: number;
  /** URI to the album artwork image */
  artwork?: string;
  /** Folder path where the track is located */
  folderPath: string;
  /** File name with extension */
  filename: string;
  /** File format (mp3, flac, wav, etc.) */
  format: AudioFormat;
  /** File size in bytes */
  fileSize: number;
  /** Creation timestamp */
  createdAt: number;
}

/**
 * Supported audio formats
 */
export type AudioFormat = 'mp3' | 'flac' | 'wav' | 'aac' | 'm4a' | 'ogg' | 'wma' | 'unknown';

// =============================================================================
// Folder Types
// =============================================================================

/**
 * Represents a folder containing audio files
 */
export interface Folder {
  /** Unique identifier (based on path) */
  id: string;
  /** Display name of the folder */
  name: string;
  /** Full path to the folder */
  path: string;
  /** Number of tracks in this folder */
  trackCount: number;
  /** Preview of first few tracks */
  previewTracks: Track[];
  /** Artwork from first track (if available) */
  artwork?: string;
}

// =============================================================================
// Playlist Types
// =============================================================================

/**
 * User-created playlist
 */
export interface Playlist {
  /** Unique identifier */
  id: string;
  /** Playlist name */
  name: string;
  /** Description (optional) */
  description?: string;
  /** Tracks in the playlist (stored as full objects for persistence) */
  tracks: Track[];
  /** Number of tracks */
  trackCount: number;
  /** Artwork (optional) */
  artwork?: string;
  /** Creation timestamp */
  createdAt: number;
  /** Last modified timestamp */
  updatedAt: number;
}

// =============================================================================
// Player State Types
// =============================================================================

/**
 * Repeat mode options
 */
export type RepeatMode = 'off' | 'all' | 'one';

/**
 * Current state of the audio player
 */
export interface PlayerState {
  /** Currently playing track */
  currentTrack: Track | null;
  /** Queue of tracks to play */
  queue: Track[];
  /** Index of current track in queue */
  currentIndex: number;
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Whether player is loading a track */
  isLoading: boolean;
  /** Current playback position in milliseconds */
  position: number;
  /** Duration of current track in milliseconds */
  duration: number;
  /** Volume level (0.0 to 1.0) */
  volume: number;
  /** Whether shuffle is enabled */
  shuffle: boolean;
  /** Current repeat mode */
  repeat: RepeatMode;
}

/**
 * Player control functions
 */
export interface PlayerControls {
  /** Start playing current track */
  play: () => Promise<void>;
  /** Pause current track */
  pause: () => Promise<void>;
  /** Toggle play/pause */
  togglePlayPause: () => Promise<void>;
  /** Skip to next track */
  next: () => Promise<void>;
  /** Skip to previous track */
  previous: () => Promise<void>;
  /** Seek to position in milliseconds */
  seek: (position: number) => Promise<void>;
  /** Set volume (0.0 to 1.0) */
  setVolume: (volume: number) => Promise<void>;
  /** Toggle shuffle mode */
  toggleShuffle: () => void;
  /** Cycle through repeat modes */
  toggleRepeat: () => void;
  /** Play a specific track */
  playTrack: (track: Track, queue?: Track[]) => Promise<void>;
  /** Add tracks to queue */
  addToQueue: (tracks: Track[]) => void;
  /** Clear queue and stop playback */
  clearQueue: () => void;
}

// =============================================================================
// Library Types
// =============================================================================

/**
 * State of the audio library
 */
export interface LibraryState {
  tracks: Track[];
  folders: Folder[];
  isScanning: boolean;
  isLoaded: boolean;
  lastScanAt: number | null;
  error: string | null;
}
