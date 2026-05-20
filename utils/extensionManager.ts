import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import JSZip from 'jszip';
import { ExtensionRuntime, ExtensionManifest } from './extensionRuntime';

const REGISTRY_URL_KEY = 'store_registry_url';
const INSTALLED_EXTENSIONS_KEY = 'installed_extensions';
const EXTENSIONS_DIR = `${FileSystem.documentDirectory}extensions/`;

export interface StoreExtension {
  id: string;
  name: string;
  display_name: string;
  version: string;
  description: string;
  download_url: string;
  icon_url?: string;
  category: string;
  tags: string[];
}

export class ExtensionManager {
  private static instance: ExtensionManager;
  private runtimes: Map<string, ExtensionRuntime> = new Map();
  private installedManifests: Map<string, ExtensionManifest> = new Map();

  public registryUrl: string = '';

  private constructor() {}

  public static getInstance(): ExtensionManager {
    if (!ExtensionManager.instance) {
      ExtensionManager.instance = new ExtensionManager();
    }
    return ExtensionManager.instance;
  }

  private normalizeRegistryUrl(url: string): string {
    if (!url) return '';
    // Si es una URL de un repo de github normal, la convertimos al raw de registry.json
    if (url.includes('github.com') && !url.includes('raw.githubusercontent.com') && !url.endsWith('.json')) {
      const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (match) {
        return `https://raw.githubusercontent.com/${match[1]}/${match[2]}/main/registry.json`;
      }
    }
    return url;
  }

  /**
   * Normaliza el manifiesto de la extensión para aceptar tanto el formato
   * SpotiFLAC (camelCase: displayName, type[]) como nuestro formato interno
   * (snake_case: display_name, types[]).
   */
  private normalizeManifest(raw: any, extensionId: string): ExtensionManifest {
    return {
      name: raw.name || extensionId,
      display_name: raw.display_name || raw.displayName || raw.name || extensionId,
      version: raw.version || '0.0.0',
      description: raw.description || '',
      // SpotiFLAC usa "type": [...], nuestro formato usa "types": [...]
      types: raw.types || raw.type || [],
      permissions: raw.permissions,
      // Guardamos el campo icon por si viene en el manifest de SpotiFLAC
      icon: raw.icon,
    } as ExtensionManifest;
  }

  public async initialize(): Promise<void> {
    const savedUrl = await AsyncStorage.getItem(REGISTRY_URL_KEY);
    // Solo usamos el guardado si es una URL http válida
    if (savedUrl && savedUrl.startsWith('http')) {
      this.registryUrl = this.normalizeRegistryUrl(savedUrl);
    } else {
      this.registryUrl = this.normalizeRegistryUrl('https://github.com/spotiflacapp/SpotiFLAC-Extension');
    }

    const dirInfo = await FileSystem.getInfoAsync(EXTENSIONS_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(EXTENSIONS_DIR, { intermediates: true });
    }

    await this.loadInstalledExtensions();
  }

  public async setRegistryUrl(url: string): Promise<void> {
    const normalizedUrl = this.normalizeRegistryUrl(url);
    this.registryUrl = normalizedUrl;
    await AsyncStorage.setItem(REGISTRY_URL_KEY, normalizedUrl);
  }

  public async fetchRegistry(): Promise<StoreExtension[]> {
    if (!this.registryUrl) return [];

    // Support file:// protocol for local testing
    if (this.registryUrl.startsWith('file://')) {
      const content = await FileSystem.readAsStringAsync(this.registryUrl);
      const data = JSON.parse(content);
      return data.extensions || [];
    }

    const response = await fetch(this.registryUrl, {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!response.ok) throw new Error(`Failed to fetch registry: ${response.status}`);
    const data = await response.json();
    return data.extensions || [];
  }

  public async installExtension(extensionId: string, downloadUrl: string): Promise<boolean> {
    try {
      const tempZipPath = `${FileSystem.cacheDirectory}${extensionId}.zip`;

      console.log(`[ExtManager] Downloading extension ${extensionId} from ${downloadUrl}`);

      // Descargar el archivo .spotiflac-ext (que es un zip)
      const downloadResult = await FileSystem.downloadAsync(downloadUrl, tempZipPath);
      if (!downloadResult || downloadResult.status !== 200) {
        throw new Error(`Download failed with status: ${downloadResult?.status}`);
      }

      // Leer el zip
      const contentBase64 = await FileSystem.readAsStringAsync(downloadResult.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const jszip = new JSZip();
      const zip = await jszip.loadAsync(contentBase64, { base64: true });

      console.log(`[ExtManager] Zip contents:`, Object.keys(zip.files));

      // Buscar manifest.json
      const manifestFile = zip.file('manifest.json');
      if (!manifestFile) {
        throw new Error('Invalid extension bundle: missing manifest.json');
      }

      // Buscar el JS de la extensión — puede llamarse extension.js o index.js
      const jsFile = zip.file('extension.js') || zip.file('index.js');
      if (!jsFile) {
        const allFiles = Object.keys(zip.files).join(', ');
        throw new Error(`Invalid extension bundle: no JS file found. Files: ${allFiles}`);
      }

      const manifestRaw = JSON.parse(await manifestFile.async('string'));
      const jsContent = await jsFile.async('string');

      // Normalizar el manifesto para manejar tanto camelCase como snake_case
      const manifest = this.normalizeManifest(manifestRaw, extensionId);
      const manifestContent = JSON.stringify(manifest);

      console.log(`[ExtManager] Manifest normalized:`, manifest.display_name, 'v' + manifest.version);

      // Guardar localmente
      const extDir = `${EXTENSIONS_DIR}${extensionId}/`;
      const dirInfo = await FileSystem.getInfoAsync(extDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(extDir, { intermediates: true });
      }

      await FileSystem.writeAsStringAsync(`${extDir}manifest.json`, manifestContent);
      await FileSystem.writeAsStringAsync(`${extDir}extension.js`, jsContent);

      // Registrar como instalado
      this.installedManifests.set(extensionId, manifest);
      await this.saveInstalledList();

      // Cargar runtime
      const runtime = new ExtensionRuntime(extensionId, manifest, jsContent);
      await runtime.preloadStorageCache();
      await runtime.initialize();
      this.runtimes.set(extensionId, runtime);

      // Limpiar temporal
      await FileSystem.deleteAsync(tempZipPath, { idempotent: true });

      console.log(`[ExtManager] Extension ${extensionId} installed successfully`);
      return true;
    } catch (error) {
      console.error(`[ExtManager] Failed to install extension ${extensionId}:`, error);
      throw error; // Re-throw para que la UI pueda mostrar el mensaje exacto
    }
  }

  public async updateExtension(extensionId: string, downloadUrl: string): Promise<boolean> {
    // Desinstalar la versión actual y reinstalar
    try {
      const oldRuntime = this.runtimes.get(extensionId);
      if (oldRuntime) {
        await oldRuntime.cleanup();
        this.runtimes.delete(extensionId);
      }
      this.installedManifests.delete(extensionId);

      // Eliminar archivos locales
      const extDir = `${EXTENSIONS_DIR}${extensionId}/`;
      await FileSystem.deleteAsync(extDir, { idempotent: true });

      // Reinstalar con la nueva versión
      return await this.installExtension(extensionId, downloadUrl);
    } catch (error) {
      console.error(`[ExtManager] Failed to update extension ${extensionId}:`, error);
      throw error;
    }
  }

  public async uninstallExtension(extensionId: string): Promise<void> {
    const runtime = this.runtimes.get(extensionId);
    if (runtime) {
      await runtime.cleanup();
      this.runtimes.delete(extensionId);
    }

    this.installedManifests.delete(extensionId);
    await this.saveInstalledList();

    const extDir = `${EXTENSIONS_DIR}${extensionId}/`;
    await FileSystem.deleteAsync(extDir, { idempotent: true });
  }

  private async loadInstalledExtensions(): Promise<void> {
    try {
      const savedList = await AsyncStorage.getItem(INSTALLED_EXTENSIONS_KEY);
      if (!savedList) return;

      const extensionIds: string[] = JSON.parse(savedList);
      for (const id of extensionIds) {
        const extDir = `${EXTENSIONS_DIR}${id}/`;
        const manifestPath = `${extDir}manifest.json`;
        const jsPath = `${extDir}extension.js`;

        try {
          const manifestContent = await FileSystem.readAsStringAsync(manifestPath);
          const jsContent = await FileSystem.readAsStringAsync(jsPath);
          const manifestRaw = JSON.parse(manifestContent);

          // Normalizar por si hay manifiestos guardados en formato antiguo
          const manifest = this.normalizeManifest(manifestRaw, id);

          this.installedManifests.set(id, manifest);

          const runtime = new ExtensionRuntime(id, manifest, jsContent);
          await runtime.preloadStorageCache();
          await runtime.initialize();
          this.runtimes.set(id, runtime);

          console.log(`[ExtManager] Loaded extension: ${id} v${manifest.version}`);
        } catch (e) {
          console.error(`[ExtManager] Failed to load installed extension ${id}:`, e);
        }
      }
    } catch (error) {
      console.error('[ExtManager] Error loading installed extensions:', error);
    }
  }

  private async saveInstalledList(): Promise<void> {
    const ids = Array.from(this.installedManifests.keys());
    await AsyncStorage.setItem(INSTALLED_EXTENSIONS_KEY, JSON.stringify(ids));
  }

  public getInstalledExtensions(): ExtensionManifest[] {
    return Array.from(this.installedManifests.values());
  }

  public hasInstalled(extensionId: string): boolean {
    return this.installedManifests.has(extensionId);
  }

  /**
   * Compara la versión instalada con la del registro para saber si hay actualización.
   * Retorna true si se necesita actualizar.
   */
  public needsUpdate(extensionId: string, registryVersion: string): boolean {
    const installed = this.installedManifests.get(extensionId);
    if (!installed) return false;
    return this.compareVersions(registryVersion, installed.version) > 0;
  }

  private compareVersions(a: string, b: string): number {
    const pa = (a || '0.0.0').split('.').map(Number);
    const pb = (b || '0.0.0').split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const na = pa[i] || 0;
      const nb = pb[i] || 0;
      if (na > nb) return 1;
      if (na < nb) return -1;
    }
    return 0;
  }

  // --- Capabilities Routing ---

  public getProvidersForCapability(capability: string): ExtensionRuntime[] {
    const providers: ExtensionRuntime[] = [];
    for (const runtime of this.runtimes.values()) {
      if (runtime.manifest.types?.includes(capability) || runtime.extensionObj?.[capability]) {
        providers.push(runtime);
      }
    }
    return providers;
  }

  public async performSearch(query: string): Promise<any> {
    const searchProviders = this.getProvidersForCapability('search');
    if (searchProviders.length === 0) {
      return null;
    }

    const provider = searchProviders[0];
    try {
      return await provider.invoke('search', query, 'track,album,artist', 20);
    } catch (e) {
      console.error(`Error searching with ${provider.id}:`, e);
      return null;
    }
  }

  public async getDownloadUrl(trackId: string, extensionId?: string): Promise<string | null> {
    let provider: ExtensionRuntime | undefined;

    if (extensionId) {
      provider = this.runtimes.get(extensionId);
    } else {
      const downloadProviders = this.getProvidersForCapability('download_provider');
      provider = downloadProviders[0];
    }

    if (!provider) return null;

    try {
      const result = await provider.invoke('getDownloadUrl', trackId);
      if (typeof result === 'string') return result;
      if (result && result.url) return result.url;
      return null;
    } catch (e) {
      console.error(`Error getting download URL from ${provider.id}:`, e);
      return null;
    }
  }

  public getRuntime(extensionId: string): ExtensionRuntime | undefined {
    return this.runtimes.get(extensionId);
  }
}
