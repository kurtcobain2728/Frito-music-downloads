import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';

const BASE_DIR = 'file:///storage/emulated/0/Music/MusicaFrito';

/**
 * Sanitiza nombres de archivos para que sean seguros en el sistema de archivos
 */
export function sanitizeFilename(name: string): string {
  // Reemplaza caracteres inválidos en Windows/Android
  return name.replace(/[\/\\:*?"<>|]/g, '_').trim();
}

/**
 * Obtiene o crea el directorio de destino final (Artista)
 */
export async function getDestinationDirectory(artistName: string): Promise<string> {
  let dir = `${BASE_DIR}/${sanitizeFilename(artistName)}/`;

  try {
    const dirInfo = await FileSystem.getInfoAsync(dir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
  } catch (error) {
    // Fallback por si acaso falla el permiso a la raíz Music/
    const docDir = FileSystem.documentDirectory || 'file:///storage/emulated/0/Documents/';
    dir = `${docDir}MusicaFrito/${sanitizeFilename(artistName)}/`;
    const fallbackInfo = await FileSystem.getInfoAsync(dir);
    if (!fallbackInfo.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
  }

  return dir;
}

/**
 * Calcula la ruta completa final
 */
export async function getDestinationPath(
  artistName: string,
  albumName: string | undefined, // Mantenemos el parámetro para no romper otras funciones que lo pasen, pero lo ignoramos
  fileName: string,
): Promise<string> {
  const dir = await getDestinationDirectory(artistName);
  return `${dir}${sanitizeFilename(fileName)}`;
}

/**
 * Realiza la descarga del archivo y lo agrega a la Media Library de Android
 */
export async function downloadFile(
  url: string,
  destPath: string,
  onProgress?: (progress: number, downloadedMB: number, totalMB: number) => void,
): Promise<string> {
  const downloadResumable = FileSystem.createDownloadResumable(url, destPath, {}, (downloadProgress: any) => {
    const totalBytes = downloadProgress.totalBytesExpectedToWrite;
    const writtenBytes = downloadProgress.totalBytesWritten;

    const progress = totalBytes > 0 ? writtenBytes / totalBytes : 0;
    const downloadedMB = writtenBytes / (1024 * 1024);
    const totalMB = totalBytes > 0 ? totalBytes / (1024 * 1024) : 0;

    if (onProgress) {
      onProgress(progress, downloadedMB, totalMB);
    }
  });

  try {
    const result = await downloadResumable.downloadAsync();
    if (!result) {
      throw new Error('Descarga fallida: resultado vacío');
    }

    // Exponer al MediaScanner de Android (añade al Media Store)
    const { status } = await MediaLibrary.getPermissionsAsync();
    if (status === 'granted') {
      try {
        const asset = await MediaLibrary.createAssetAsync(result.uri);
        try {
          const album = await MediaLibrary.getAlbumAsync('MusicaFrito');
          if (album === null) {
            await MediaLibrary.createAlbumAsync('MusicaFrito', asset, false);
          } else {
            await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
          }
        } catch (albumErr) {
          console.warn('No se pudo añadir al álbum MusicaFrito:', albumErr);
        }
      } catch (err) {
        console.warn('No se pudo añadir al MediaLibrary:', err);
      }
    }

    return result.uri;
  } catch (error) {
    console.error('Error durante la descarga:', error);
    throw error;
  }
}
