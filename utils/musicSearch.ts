import { SearchResult, TrackResult, AlbumResult, ArtistResult } from '@/contexts/MusicDownloadContext';
import { ExtensionManager } from './extensionManager';
import { ExtensionRuntime } from './extensionRuntime';

const DEEZER_API_URL = 'https://api.deezer.com';

// ─── Deezer fallback search ────────────────────────────────────────────────────

export async function searchDeezer(query: string): Promise<SearchResult> {
  const q = encodeURIComponent(query);

  const [tracksRes, albumsRes, artistsRes] = await Promise.all([
    fetch(`${DEEZER_API_URL}/search/track?q=${q}&limit=20`),
    fetch(`${DEEZER_API_URL}/search/album?q=${q}&limit=20`),
    fetch(`${DEEZER_API_URL}/search/artist?q=${q}&limit=20`),
  ]);

  if (!tracksRes.ok || !albumsRes.ok || !artistsRes.ok) {
    throw new Error('Fallo al comunicarse con la API de Deezer');
  }

  const tracksData = await tracksRes.json();
  const albumsData = await albumsRes.json();
  const artistsData = await artistsRes.json();

  const tracks: TrackResult[] = (tracksData.data || []).map((t: any) => ({
    id: t.id.toString(),
    name: t.title,
    artists: t.artist.name,
    album: t.album.title,
    duration_ms: t.duration * 1000,
    imageUrl: t.album.cover_xl || t.album.cover_medium || t.album.cover,
    external_url: t.preview || t.link,
    // IMPORTANTE: platform es siempre 'deezer' para los resultados de Deezer.
    // El download handler verificará esto y mostrará un error claro.
    platform: 'deezer',
  }));

  const albums: AlbumResult[] = (albumsData.data || []).map((a: any) => ({
    id: a.id.toString(),
    name: a.title,
    artists: a.artist.name,
    imageUrl: a.cover_xl || a.cover_medium || a.cover,
    platform: 'deezer',
  }));

  const artists: ArtistResult[] = (artistsData.data || []).map((a: any) => ({
    id: a.id.toString(),
    name: a.name,
    imageUrl: a.picture_xl || a.picture_medium || a.picture,
    platform: 'deezer',
  }));

  return { tracks, albums, artists };
}

// ─── Artist & Album helpers (Deezer) ────────────────────────────────────────

export async function getArtistTopTracks(artistId: string): Promise<TrackResult[]> {
  const res = await fetch(`${DEEZER_API_URL}/artist/${artistId}/top?limit=10`);
  if (!res.ok) throw new Error('Error al obtener top tracks');
  const data = await res.json();
  return (data.data || []).map((t: any) => ({
    id: t.id.toString(),
    name: t.title,
    artists: t.artist?.name || '',
    album: t.album?.title || '',
    duration_ms: t.duration * 1000,
    imageUrl: t.album?.cover_xl || t.album?.cover_medium || t.album?.cover || '',
    external_url: t.preview || t.link,
    platform: 'deezer',
  }));
}

export async function getArtistAlbums(artistId: string): Promise<AlbumResult[]> {
  const res = await fetch(`${DEEZER_API_URL}/artist/${artistId}/albums?limit=20`);
  if (!res.ok) throw new Error('Error al obtener álbumes del artista');
  const data = await res.json();
  return (data.data || []).map((a: any) => ({
    id: a.id.toString(),
    name: a.title,
    artists: '',
    imageUrl: a.cover_xl || a.cover_medium || a.cover || '',
    platform: 'deezer',
  }));
}

export async function getAlbumTracks(
  albumId: string,
  albumImageUrl?: string,
  albumName?: string,
): Promise<TrackResult[]> {
  const res = await fetch(`${DEEZER_API_URL}/album/${albumId}/tracks`);
  if (!res.ok) throw new Error('Error al obtener canciones del álbum');
  const data = await res.json();
  return (data.data || []).map((t: any) => ({
    id: t.id.toString(),
    name: t.title,
    artists: t.artist?.name || '',
    album: albumName || '',
    duration_ms: t.duration * 1000,
    imageUrl: albumImageUrl || '',
    external_url: t.preview || t.link,
    platform: 'deezer',
  }));
}

// ─── Extension search adapter ────────────────────────────────────────────────

/**
 * Adapta los resultados de customSearch de SpotiFLAC al formato interno de Music-Frito.
 * El platform se fuerza al extensionId activo para que la descarga sepa qué runtime usar.
 */
function adaptExtensionResults(raw: any, extensionId: string): SearchResult {
  const adaptTrack = (t: any): TrackResult => ({
    id: String(t.id || t.videoId || t.trackId || t.track_id || ''),
    name: t.title || t.name || '',
    artists: Array.isArray(t.artists)
      ? t.artists.map((a: any) => (typeof a === 'string' ? a : a.name || '')).join(', ')
      : typeof t.artists === 'string'
        ? t.artists
        : t.artist || '',
    album: (typeof t.album === 'object' ? t.album?.title || t.album?.name : t.album) || '',
    duration_ms: t.duration_ms || t.durationMs || (t.duration ? t.duration * 1000 : 0),
    imageUrl:
      t.imageUrl ||
      t.thumbnailUrl ||
      t.thumbnail ||
      t.cover_url ||
      (typeof t.album === 'object' ? t.album?.cover_url || t.album?.cover_xl : '') ||
      '',
    external_url: t.external_url || t.url || t.externalUrl || t.link || '',
    // Forzar el platform al extensionId para que download-music.tsx lo use correctamente
    platform: extensionId,
  });

  const adaptAlbum = (a: any): AlbumResult => ({
    id: String(a.id || a.albumId || a.album_id || ''),
    name: a.title || a.name || '',
    artists: Array.isArray(a.artists)
      ? a.artists.map((x: any) => (typeof x === 'string' ? x : x.name || '')).join(', ')
      : a.artist || '',
    imageUrl: a.imageUrl || a.thumbnailUrl || a.thumbnail || a.cover_url || a.coverUrl || '',
    platform: extensionId,
  });

  const adaptArtist = (a: any): ArtistResult => ({
    id: String(a.id || a.artistId || a.artist_id || ''),
    name: a.name || a.title || '',
    imageUrl: a.imageUrl || a.thumbnailUrl || a.thumbnail || a.avatarUrl || a.picture_xl || '',
    platform: extensionId,
  });

  // SpotiFLAC customSearch puede devolver un array directo de tracks, o un objeto {tracks, albums, artists}
  if (Array.isArray(raw)) {
    return {
      tracks: raw.map(adaptTrack),
      albums: [],
      artists: [],
    };
  }

  return {
    tracks: (raw.tracks || raw.songs || raw.results || []).map(adaptTrack),
    albums: (raw.albums || []).map(adaptAlbum),
    artists: (raw.artists || []).map(adaptArtist),
  };
}

// ─── Main search function ────────────────────────────────────────────────────

/**
 * Búsqueda principal.
 * Usa la extensión instalada seleccionada (customSearch) si está disponible,
 * y hace fallback a Deezer si no hay extensiones o si falla.
 */
export async function performMusicSearch(query: string, extensionId: string): Promise<SearchResult> {
  if (!query.trim()) {
    return { tracks: [], albums: [], artists: [] };
  }

  const manager = ExtensionManager.getInstance();

  if (extensionId) {
    const runtime = manager.getRuntime(extensionId);
    if (runtime && runtime.extensionObj) {
      try {
        let rawResult: any = null;

        // SpotiFLAC expone customSearch(query, options)
        if (runtime.hasMethod('customSearch')) {
          console.log(`[musicSearch] Using ${extensionId} customSearch`);
          rawResult = await runtime.invoke('customSearch', query, {
            types: ['track', 'album', 'artist'],
            limit: 20,
          });
        } else if (runtime.hasMethod('search')) {
          console.log(`[musicSearch] Using ${extensionId} search`);
          rawResult = await runtime.invoke('search', query, 'track,album,artist', 20);
        } else if (runtime.hasMethod('searchTracks')) {
          console.log(`[musicSearch] Using ${extensionId} searchTracks`);
          const tracks = await runtime.invoke('searchTracks', query, 20);
          rawResult = { tracks, albums: [], artists: [] };
        }

        if (rawResult) {
          const adapted = adaptExtensionResults(rawResult, extensionId);
          if (adapted.tracks.length > 0 || adapted.albums.length > 0 || adapted.artists.length > 0) {
            return adapted;
          }
        }
      } catch (err) {
        console.warn(`[musicSearch] Extension ${extensionId} search failed:`, err);
        // Fallback a Deezer para la búsqueda (pero el platform quedará como 'deezer')
      }
    }
  }

  // Fallback: Deezer (solo metadata pública, no descarga)
  console.log('[musicSearch] Falling back to Deezer for search');
  return searchDeezer(query);
}

// ─── Download URL ────────────────────────────────────────────────────────────

/**
 * Obtiene la URL de descarga directa de un track usando la extensión activa.
 *
 * En SpotiFLAC, el flujo es:
 *   extension.download(trackId, outputPath, options) → { success, url? }
 * Algunos también exponen:
 *   extension.getDownloadUrl(trackId) → string | { url }
 *
 * @param trackId     El ID del track según la plataforma de la extensión
 * @param extensionId El ID de la extensión a usar (= track.platform si fue buscado con extensión)
 * @param trackUrl    URL externa del track (por si el download la necesita como hint)
 */
export async function getDownloadUrlForTrack(trackId: string, extensionId: string, trackUrl?: string): Promise<string> {
  const manager = ExtensionManager.getInstance();

  // Si el track vino de Deezer (fallback de búsqueda), no tenemos extensión para descargarlo
  if (!extensionId || extensionId === 'deezer') {
    // Intentar usar cualquier extensión instalada con capacidad de descarga
    const installed = manager.getInstalledExtensions();
    if (installed.length === 0) {
      throw new Error(
        'No hay extensiones instaladas. Ve a Más → Extensiones e instala una para poder descargar música.',
      );
    }
    // Usar la primera extensión disponible como fallback
    const fallbackId = installed[0].name;
    const fallbackRuntime = manager.getRuntime(fallbackId);
    if (fallbackRuntime) {
      return tryDownloadWithRuntime(fallbackRuntime, trackId, trackUrl, fallbackId);
    }
    throw new Error('No se pudo cargar ninguna extensión instalada.');
  }

  const runtime = manager.getRuntime(extensionId);
  if (!runtime || !runtime.extensionObj) {
    throw new Error(
      `La extensión "${extensionId}" no está instalada o no se pudo inicializar. Ve a Extensiones y reinstálala.`,
    );
  }

  return tryDownloadWithRuntime(runtime, trackId, trackUrl, extensionId);
}

/**
 * Intenta obtener una URL de descarga de un runtime concreto,
 * probando los métodos en orden de prioridad que usan las extensiones SpotiFLAC.
 */
async function tryDownloadWithRuntime(
  runtime: ExtensionRuntime,
  trackId: string,
  trackUrl: string | undefined,
  extensionId: string,
): Promise<string> {
  // 1. getDownloadUrl (simple, devuelve URL directa)
  if (runtime.hasMethod('getDownloadUrl')) {
    try {
      const result = await runtime.invoke('getDownloadUrl', trackId, trackUrl);
      const url = extractUrl(result);
      if (url) return url;
    } catch (e) {
      console.warn(`[musicSearch] ${extensionId}.getDownloadUrl failed:`, e);
    }
  }

  // 2. download (SpotiFLAC nativo, puede devolver { success, url } o { success, file_path })
  if (runtime.hasMethod('download')) {
    try {
      // Pasamos un output path vacío — el resultado { url } es lo que nos importa
      const result = await runtime.invoke('download', trackId, '', { urlOnly: true, fetchUrlOnly: true });
      const url = extractUrl(result);
      if (url) return url;

      // Si download devolvió success:true pero solo file_path (descarga nativa interna),
      // no podemos usar ese path — lo ignoramos y seguimos
    } catch (e) {
      console.warn(`[musicSearch] ${extensionId}.download failed:`, e);
    }
  }

  // 3. resolve (algunos providers)
  if (runtime.hasMethod('resolve')) {
    try {
      const result = await runtime.invoke('resolve', trackId, trackUrl);
      const url = extractUrl(result);
      if (url) return url;
    } catch (e) {
      console.warn(`[musicSearch] ${extensionId}.resolve failed:`, e);
    }
  }

  // 4. checkAvailability (Qobuz estilo — verifica y retorna stream URL)
  if (runtime.hasMethod('checkAvailability')) {
    try {
      const result = await runtime.invoke('checkAvailability', trackId);
      const url = extractUrl(result);
      if (url) return url;
    } catch (e) {
      console.warn(`[musicSearch] ${extensionId}.checkAvailability failed:`, e);
    }
  }

  throw new Error(
    `La extensión "${extensionId}" no pudo obtener una URL de descarga para esta canción. ` +
      `Puede que el track no esté disponible en esta plataforma o que requiera autenticación.`,
  );
}

/**
 * Extrae una URL de string de un resultado que puede tener distintas formas.
 */
function extractUrl(result: any): string | null {
  if (!result) return null;
  if (typeof result === 'string' && result.startsWith('http')) return result;
  if (result.url && typeof result.url === 'string' && result.url.startsWith('http')) return result.url;
  if (result.downloadUrl && typeof result.downloadUrl === 'string') return result.downloadUrl;
  if (result.stream_url && typeof result.stream_url === 'string') return result.stream_url;
  if (result.audio_url && typeof result.audio_url === 'string') return result.audio_url;
  return null;
}
