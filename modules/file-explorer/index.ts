import { Platform } from 'react-native';

interface DirectoryEntry {
  name: string;
  path: string;
  audioCount: number;
}

interface FileEntry {
  name: string;
  filename: string;
  path: string;
  uri: string;
  size: number;
  lastModified: number;
  extension: string;
  folderPath?: string;
}

interface DirectoryListing {
  folders: DirectoryEntry[];
  files: FileEntry[];
}

interface IFileExplorerModule {
  getStorageRoot(): Promise<string>;
  listDirectory(path: string): Promise<DirectoryListing>;
  getAllAudioInDirectory(path: string): Promise<FileEntry[]>;
  hasStoragePermission(): Promise<boolean>;
  sendRequestSync(url: string, options: { method?: string; headers?: Record<string, string>; body?: string | null }): {
    status: number;
    body: string;
    headers: Record<string, string>;
    ok: boolean;
    error?: string;
  };
}

let FileExplorerModule: IFileExplorerModule | null = null;

if (Platform.OS === 'android') {
  try {
    const ExpoModulesCore = require('expo-modules-core');
    if (ExpoModulesCore && ExpoModulesCore.requireNativeModule) {
      FileExplorerModule = ExpoModulesCore.requireNativeModule('FileExplorerModule');
    }
  } catch (_e) {
    FileExplorerModule = null;
  }

  if (!FileExplorerModule) {
    try {
      const { NativeModules } = require('react-native');
      if (NativeModules && NativeModules.FileExplorerModule) {
        FileExplorerModule = NativeModules.FileExplorerModule;
      }
    } catch (_e2) {
      FileExplorerModule = null;
    }
  }
}

export default FileExplorerModule;
export type { IFileExplorerModule, DirectoryListing, DirectoryEntry, FileEntry };
