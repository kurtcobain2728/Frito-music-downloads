import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';
import CryptoJS from 'crypto-js';
import FileExplorerModule from '@/modules/file-explorer';

export interface ExtensionManifest {
  name: string;
  display_name: string;
  version: string;
  description: string;
  types: string[]; // e.g. "download_provider", "metadata_provider", "search_provider"
  icon?: string; // Optional: filename inside the zip (e.g. "icon.jpg")
  permissions?: {
    network?: string[];
    file?: boolean;
    storage?: boolean;
    allowHttp?: boolean;
  };
}

export class ExtensionRuntime {
  public id: string;
  public manifest: ExtensionManifest;
  public jsCode: string;
  private storagePrefix: string;

  // The actual evaluated extension object (captured via registerExtension)
  public extensionObj: any = null;

  constructor(id: string, manifest: ExtensionManifest, jsCode: string) {
    this.id = id;
    this.manifest = manifest;
    this.jsCode = jsCode;
    this.storagePrefix = `ext_${id}_`;
  }

  /**
   * Initializes the extension by evaluating its JS code.
   *
   * SpotiFLAC extensions call `registerExtension({...})` which is a global
   * function provided by the host app. We inject this function into the sandbox
   * so the extension can register itself. The object passed to registerExtension
   * becomes our extensionObj.
   */
  public async initialize(): Promise<void> {
    try {
      // We capture the object passed to registerExtension via a closure
      let capturedExtension: any = null;

      const sandbox = this.createSandbox((extObj: any) => {
        capturedExtension = extObj;
      });

      const argsNames = Object.keys(sandbox);
      const argsValues = Object.values(sandbox);

      // The runner evaluates the extension code.
      // SpotiFLAC extensions: call registerExtension({...}) at the end.
      // Legacy extensions: set module.exports or return an 'extension' object.
      const runner = new Function(
        ...argsNames,
        `
        "use strict";
        var extension = {};
        var module = { exports: {} };
        var exports = module.exports;
        try {
          ${this.jsCode}
        } catch(e) {
          throw e;
        }
        // If registerExtension was called, capturedExtension is set via the callback
        // Otherwise fallback to module.exports or extension variable
        if (typeof module.exports === 'object' && Object.keys(module.exports).length > 0) {
          return module.exports;
        }
        if (typeof extension === 'object' && Object.keys(extension).length > 0) {
          return extension;
        }
        return null;
      `,
      );

      const result = runner(...argsValues);

      // Prefer the registerExtension capture, fall back to return value
      this.extensionObj = capturedExtension || result;

      if (!this.extensionObj) {
        throw new Error('Extension did not export any object (no registerExtension call and no module.exports)');
      }

      // Call initialize if the extension has it (SpotiFLAC calls it with settings)
      if (typeof this.extensionObj.initialize === 'function') {
        await this.extensionObj.initialize({});
      } else if (typeof this.extensionObj.init === 'function') {
        await this.extensionObj.init();
      }

      console.log(
        `[ExtRuntime:${this.id}] Initialized. Methods:`,
        Object.keys(this.extensionObj).filter(k => typeof this.extensionObj[k] === 'function'),
      );
    } catch (e) {
      console.error(`[ExtRuntime:${this.id}] Error initializing:`, e);
      throw e;
    }
  }

  public async cleanup(): Promise<void> {
    if (this.extensionObj && typeof this.extensionObj.cleanup === 'function') {
      try {
        await this.extensionObj.cleanup();
      } catch (e) {
        console.error(`[ExtRuntime:${this.id}] Error during cleanup:`, e);
      }
    }
    this.extensionObj = null;
  }

  /**
   * Invokes a method on the extension object.
   */
  public async invoke(method: string, ...args: any[]): Promise<any> {
    if (!this.extensionObj || typeof this.extensionObj[method] !== 'function') {
      throw new Error(
        `Method '${method}' not found in extension '${this.id}'. Available: ${Object.keys(this.extensionObj || {}).join(', ')}`,
      );
    }
    return await this.extensionObj[method](...args);
  }

  /**
   * Returns true if the extension has a given method.
   */
  public hasMethod(method: string): boolean {
    return !!this.extensionObj && typeof this.extensionObj[method] === 'function';
  }

  /**
   * Creates the sandbox environment for the extension JS code.
   * This provides all the APIs that SpotiFLAC extensions expect from the host.
   */
  private createSandbox(onRegister: (obj: any) => void) {
    const self = this;

    return {
      // ─── SpotiFLAC host API ───────────────────────────────────────────────

      /**
       * The primary registration mechanism for SpotiFLAC extensions.
       * The extension calls registerExtension({search, download, ...})
       */
      registerExtension: (extObj: any) => {
        console.log(`[ExtRuntime:${self.id}] registerExtension called with methods:`, Object.keys(extObj || {}));
        onRegister(extObj);
      },

      /**
       * HTTP API used by SpotiFLAC extensions for network requests.
       * Returns a synchronous-style result object {status, body, headers, ok}.
       * Since we're in React Native, we bridge the async fetch synchronously
       * by using a blocking approach via XMLHttpRequest (synchronous mode).
       */
      http: {
        get: (url: string, headers: any = {}) => self.doFetchSync(url, { method: 'GET', headers }),
        post: (url: string, body: any, headers: any = {}) => self.doFetchSync(url, { method: 'POST', body, headers }),
        request: (url: string, options: any) => self.doFetchSync(url, options),
      },

      /**
       * Storage API — synchronous-style wrappers backed by a local cache.
       * Since AsyncStorage is async, we use a synchronous in-memory cache
       * that's pre-populated at runtime.
       */
      storage: {
        get: (key: string, fallback: any = null) => {
          const val = self.storageCache.get(self.storagePrefix + key);
          if (val === undefined) return fallback;
          return val;
        },
        set: (key: string, value: any) => {
          self.storageCache.set(self.storagePrefix + key, value);
          // Persist asynchronously (fire and forget)
          AsyncStorage.setItem(
            self.storagePrefix + key,
            typeof value === 'string' ? value : JSON.stringify(value),
          ).catch(() => {});
          return true;
        },
        remove: (key: string) => {
          self.storageCache.delete(self.storagePrefix + key);
          AsyncStorage.removeItem(self.storagePrefix + key).catch(() => {});
          return true;
        },
      },

      /**
       * File API stub — SpotiFLAC extensions use this to write downloaded files.
       * We stub these since Music-Frito handles file writing itself.
       */
      file: {
        download: (url: string, path: string, options: any = {}) => {
          // This is called by extensions to download files natively.
          // We return a stub since Music-Frito's downloader handles actual file writing.
          // The important thing is we don't crash — some extensions check the result.
          console.log(`[ExtRuntime:${self.id}] file.download called for path:`, path);
          return { success: true, path: path };
        },
        exists: (path: string) => false,
        read: (path: string) => null,
        write: (path: string, data: string) => true,
        delete: (path: string) => true,
        mkdir: (path: string) => true,
        listDir: (path: string) => [],
      },

      /**
       * Utils API
       */
      utils: {
        base64Encode: (str: string) => Buffer.from(str).toString('base64'),
        base64Decode: (str: string) => Buffer.from(str, 'base64').toString('utf8'),
        md5: (msg: string) => CryptoJS.MD5(msg).toString(),
        hmacSHA256: (msg: string, key: string) => CryptoJS.HmacSHA256(msg, key).toString(),
        hmacSHA1: (msg: string, key: string) => CryptoJS.HmacSHA1(msg, key).toString(),
        sha256: (msg: string) => {
          // Synchronous sha256 via CryptoJS
          return CryptoJS.SHA256(msg).toString();
        },
        cryptoEncrypt: (data: string, key: string, iv: string) => {
          const encrypted = CryptoJS.AES.encrypt(data, CryptoJS.enc.Utf8.parse(key), {
            iv: CryptoJS.enc.Utf8.parse(iv),
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
          });
          return encrypted.toString();
        },
        cryptoDecrypt: (data: string, key: string, iv: string) => {
          const decrypted = CryptoJS.AES.decrypt(data, CryptoJS.enc.Utf8.parse(key), {
            iv: CryptoJS.enc.Utf8.parse(iv),
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
          });
          return decrypted.toString(CryptoJS.enc.Utf8);
        },
        parseJSON: (str: string) => {
          try {
            return JSON.parse(str);
          } catch {
            return undefined;
          }
        },
        sleep: (ms: number) => {
          // Synchronous sleep stub — extensions may call this but we can't truly block
          // Return immediately to avoid hanging the JS thread
          return undefined;
        },
        // App info
        getAppVersion: () => '4.5.1',
        appUserAgent: () => 'SpotiFLAC/4.5.1 (Android)',
        getPlatform: () => 'android',
        getLocale: () => 'en-US',
        getCountry: () => 'US',
      },

      /**
       * Logging API
       */
      log: {
        debug: (...args: any[]) => console.log(`[Ext:${self.id}]`, ...args),
        info: (...args: any[]) => console.info(`[Ext:${self.id}]`, ...args),
        warn: (...args: any[]) => console.warn(`[Ext:${self.id}]`, ...args),
        error: (...args: any[]) => console.error(`[Ext:${self.id}]`, ...args),
      },

      // ─── Standard JS globals ─────────────────────────────────────────────
      fetch: (url: string, options: any) => fetch(url, options),
      console: console,
      setTimeout: setTimeout,
      clearTimeout: clearTimeout,
      setInterval: setInterval,
      clearInterval: clearInterval,
      Promise: Promise,
      JSON: JSON,
      Math: Math,
      Date: Date,
      Buffer: Buffer,
      atob: (data: string) => Buffer.from(data, 'base64').toString('binary'),
      btoa: (data: string) => Buffer.from(data, 'binary').toString('base64'),
      encodeURIComponent: encodeURIComponent,
      decodeURIComponent: decodeURIComponent,
      encodeURI: encodeURI,
      decodeURI: decodeURI,
      parseInt: parseInt,
      parseFloat: parseFloat,
      isNaN: isNaN,
      isFinite: isFinite,
      Array: Array,
      Object: Object,
      String: String,
      Number: Number,
      Boolean: Boolean,
      RegExp: RegExp,
      Error: Error,
      TypeError: TypeError,
      Map: Map,
      Set: Set,
      Symbol: Symbol,
      undefined: undefined,
    };
  }

  // ─── Synchronous HTTP (used by SpotiFLAC extensions) ───────────────────────
  // SpotiFLAC extensions expect synchronous http.get/post calls.
  // We use XMLHttpRequest in synchronous mode to achieve this.
  private doFetchSync(url: string, options: any): any {
    try {
      // 1. Try native synchronous request via FileExplorerModule if available
      if (FileExplorerModule && typeof FileExplorerModule.sendRequestSync === 'function') {
        const bodyStr = options.body
          ? typeof options.body === 'object'
            ? JSON.stringify(options.body)
            : String(options.body)
          : null;

        const nativeRes = FileExplorerModule.sendRequestSync(url, {
          method: options.method || 'GET',
          headers: options.headers || {},
          body: bodyStr,
        });

        if (nativeRes) {
          return {
            status: nativeRes.status,
            statusCode: nativeRes.status,
            body: nativeRes.body,
            headers: nativeRes.headers || {},
            ok: nativeRes.ok,
            error: nativeRes.error,
          };
        }
      }

      // 2. Fallback to standard (but often failing/unsupported) XMLHttpRequest
      const xhr = new XMLHttpRequest();
      xhr.open(options.method || 'GET', url, false); // false = synchronous

      // Set headers
      const headers = options.headers || {};
      Object.keys(headers).forEach(key => {
        try {
          xhr.setRequestHeader(key, headers[key]);
        } catch (_) {}
      });

      const body = options.body
        ? typeof options.body === 'object'
          ? JSON.stringify(options.body)
          : options.body
        : null;

      xhr.send(body);

      return {
        status: xhr.status,
        statusCode: xhr.status,
        body: xhr.responseText,
        headers: this.parseXHRHeaders(xhr.getAllResponseHeaders()),
        ok: xhr.status >= 200 && xhr.status < 300,
      };
    } catch (e: any) {
      console.error(`[ExtRuntime:${this.id}] doFetchSync error for ${url}:`, e);
      return { status: 0, statusCode: 0, body: '', headers: {}, ok: false, error: e.toString() };
    }
  }

  private parseXHRHeaders(raw: string): Record<string, string> {
    const headers: Record<string, string> = {};
    if (!raw) return headers;
    raw.split('\r\n').forEach(line => {
      const idx = line.indexOf(': ');
      if (idx > 0) {
        headers[line.slice(0, idx).toLowerCase()] = line.slice(idx + 2);
      }
    });
    return headers;
  }

  // ─── Synchronous storage cache ──────────────────────────────────────────────
  // Pre-populated on initialize so storage.get() can work synchronously
  private storageCache: Map<string, any> = new Map();

  public async preloadStorageCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const myKeys = keys.filter(k => k.startsWith(this.storagePrefix));
      if (myKeys.length === 0) return;
      const pairs = await AsyncStorage.multiGet(myKeys);
      for (const [key, val] of pairs) {
        if (val !== null) {
          try {
            this.storageCache.set(key, JSON.parse(val));
          } catch {
            this.storageCache.set(key, val);
          }
        }
      }
    } catch (e) {
      console.warn(`[ExtRuntime:${this.id}] preloadStorageCache error:`, e);
    }
  }
}
