export interface QualityOption {
  label: string;
  value: string;
}

export interface MusicExtension {
  id: string;
  name: string;
  displayName: string;
  downloadUrl: string;
  tags: string[];
  supportsSearch: boolean;
  supportsDownload: boolean;
  qualityOptions: QualityOption[];
}

export const QUALITY_BY_EXTENSION: Record<string, QualityOption[]> = {
  amazon: [
    { label: 'HD (FLAC)', value: 'hd' },
    { label: 'Ultra HD', value: 'uhd' },
  ],
  'qobuz-web': [
    { label: 'FLAC 16-bit', value: 'flac' },
    { label: 'FLAC 24-bit', value: 'flac24' },
  ],
  'tidal-web': [
    { label: 'AAC', value: 'aac' },
    { label: 'FLAC (MQA)', value: 'mqa' },
  ],
  deezer: [
    { label: 'MP3 128k', value: '128' },
    { label: 'MP3 320k', value: '320' },
    { label: 'FLAC', value: 'flac' },
  ],
  'spotify-web': [
    { label: 'OGG 160k', value: '160' },
    { label: 'OGG 320k', value: '320' },
  ],
  'ytmusic-spotiflac': [
    { label: 'WebM/Opus', value: 'opus' },
    { label: 'MP4/AAC', value: 'aac' },
  ],
  soundcloud: [{ label: 'MP3 128k', value: '128' }],
  'apple-music': [{ label: 'AAC 256k', value: 'aac' }],
  pandora: [{ label: 'MP3 128k', value: '128' }],
};

export const EXTENSIONS: MusicExtension[] = [
  {
    id: 'spotify-web',
    name: 'spotify-web',
    displayName: 'Spotify Web',
    downloadUrl:
      'https://raw.githubusercontent.com/zarzet/SpotiFLAC-Extension/main/extensions/spotify-web.spotiflac-ext',
    tags: ['spotify', 'web', 'streaming', 'homefeed'],
    supportsSearch: true,
    supportsDownload: true,
    qualityOptions: QUALITY_BY_EXTENSION['spotify-web'],
  },
  {
    id: 'amazon',
    name: 'amazon',
    displayName: 'Amazon Music',
    downloadUrl: 'https://raw.githubusercontent.com/zarzet/SpotiFLAC-Extension/main/extensions/amzn.spotiflac-ext',
    tags: ['amazon', 'download', 'lossless', 'metadata', 'search'],
    supportsSearch: true,
    supportsDownload: true,
    qualityOptions: QUALITY_BY_EXTENSION['amazon'],
  },
  {
    id: 'apple-music',
    name: 'apple-music',
    displayName: 'Apple Music',
    downloadUrl:
      'https://raw.githubusercontent.com/zarzet/SpotiFLAC-Extension/main/extensions/apple-musc.spotiflac-ext',
    tags: ['apple', 'metadata', 'lyrics', 'search', 'download'],
    supportsSearch: true,
    supportsDownload: true,
    qualityOptions: QUALITY_BY_EXTENSION['apple-music'],
  },
  {
    id: 'soundcloud',
    name: 'soundcloud',
    displayName: 'SoundCloud',
    downloadUrl:
      'https://raw.githubusercontent.com/zarzet/SpotiFLAC-Extension/main/extensions/soundcloud.spotiflac-ext',
    tags: ['soundcloud', 'download', 'metadata', 'search'],
    supportsSearch: true,
    supportsDownload: true,
    qualityOptions: QUALITY_BY_EXTENSION['soundcloud'],
  },
  {
    id: 'ytmusic-spotiflac',
    name: 'ytmusic-spotiflac',
    displayName: 'YouTube Music',
    downloadUrl:
      'https://raw.githubusercontent.com/zarzet/SpotiFLAC-Extension/main/extensions/ytmusic-spotiflac.spotiflac-ext',
    tags: ['youtube', 'ytmusic', 'metadata', 'search', 'homefeed', 'download'],
    supportsSearch: true,
    supportsDownload: true,
    qualityOptions: QUALITY_BY_EXTENSION['ytmusic-spotiflac'],
  },
  {
    id: 'deezer',
    name: 'deezer',
    displayName: 'Deezer',
    downloadUrl: 'https://raw.githubusercontent.com/zarzet/SpotiFLAC-Extension/main/extensions/deezer.spotiflac-ext',
    tags: ['deezer', 'download', 'lossless', 'metadata', 'search'],
    supportsSearch: true,
    supportsDownload: true,
    qualityOptions: QUALITY_BY_EXTENSION['deezer'],
  },
  {
    id: 'pandora',
    name: 'pandora',
    displayName: 'Pandora',
    downloadUrl: 'https://raw.githubusercontent.com/zarzet/SpotiFLAC-Extension/main/extensions/pandora.spotiflac-ext',
    tags: ['pandora', 'download', 'metadata', 'search'],
    supportsSearch: true,
    supportsDownload: true,
    qualityOptions: QUALITY_BY_EXTENSION['pandora'],
  },
  {
    id: 'qobuz-web',
    name: 'qobuz-web',
    displayName: 'Qobuz',
    downloadUrl: 'https://raw.githubusercontent.com/zarzet/SpotiFLAC-Extension/main/extensions/qobuz-web.spotiflac-ext',
    tags: ['qobuz', 'download', 'lossless', 'metadata', 'search'],
    supportsSearch: true,
    supportsDownload: true,
    qualityOptions: QUALITY_BY_EXTENSION['qobuz-web'],
  },
  {
    id: 'tidal-web',
    name: 'tidal-web',
    displayName: 'Tidal',
    downloadUrl: 'https://raw.githubusercontent.com/zarzet/SpotiFLAC-Extension/main/extensions/tidal-web.spotiflac-ext',
    tags: ['tidal', 'download', 'lossless', 'metadata', 'search'],
    supportsSearch: true,
    supportsDownload: true,
    qualityOptions: QUALITY_BY_EXTENSION['tidal-web'],
  },
];
