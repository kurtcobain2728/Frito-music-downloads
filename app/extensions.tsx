import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { router } from 'expo-router';
import { ExtensionManager, StoreExtension } from '@/utils/extensionManager';
import { ExtensionManifest } from '@/utils/extensionRuntime';

type ActionState = 'idle' | 'installing' | 'uninstalling' | 'updating';

interface ExtensionState {
  isInstalled: boolean;
  hasUpdate: boolean;
  installedVersion?: string;
  action: ActionState;
}

export default function ExtensionsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const c = theme.colors;

  const [registryUrl, setRegistryUrl] = useState('');
  const [loadingRegistry, setLoadingRegistry] = useState(false);
  const [storeExtensions, setStoreExtensions] = useState<StoreExtension[]>([]);
  const [extStates, setExtStates] = useState<Record<string, ExtensionState>>({});

  const buildStates = useCallback(
    (store: StoreExtension[], manager: ExtensionManager): Record<string, ExtensionState> => {
      const states: Record<string, ExtensionState> = {};
      for (const ext of store) {
        const installed = manager.hasInstalled(ext.id);
        const installedManifest = installed
          ? manager.getInstalledExtensions().find((m: ExtensionManifest) => m.name === ext.id)
          : undefined;
        states[ext.id] = {
          isInstalled: installed,
          hasUpdate: installed ? manager.needsUpdate(ext.id, ext.version) : false,
          installedVersion: installedManifest?.version,
          action: 'idle',
        };
      }
      return states;
    },
    [],
  );

  const loadData = useCallback(async () => {
    setLoadingRegistry(true);
    try {
      const manager = ExtensionManager.getInstance();
      await manager.initialize();
      setRegistryUrl(manager.registryUrl);

      if (manager.registryUrl) {
        const exts = await manager.fetchRegistry();
        setStoreExtensions(exts);
        setExtStates(buildStates(exts, manager));
      }
    } catch (error: any) {
      Alert.alert('Error', `No se pudo cargar el registro:\n${error?.message || error}`);
    } finally {
      setLoadingRegistry(false);
    }
  }, [buildStates]);

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveRegistry = async () => {
    setLoadingRegistry(true);
    try {
      const manager = ExtensionManager.getInstance();
      await manager.setRegistryUrl(registryUrl);
      const exts = await manager.fetchRegistry();
      setStoreExtensions(exts);
      setExtStates(buildStates(exts, manager));
    } catch (error: any) {
      Alert.alert('Error', `Registro inválido o inaccesible:\n${error?.message || error}`);
    } finally {
      setLoadingRegistry(false);
    }
  };

  const setExtAction = (id: string, action: ActionState) => {
    setExtStates(prev => ({
      ...prev,
      [id]: { ...prev[id], action },
    }));
  };

  const handleInstall = async (ext: StoreExtension) => {
    setExtAction(ext.id, 'installing');
    try {
      const manager = ExtensionManager.getInstance();
      await manager.installExtension(ext.id, ext.download_url);
      // Refrescar estados
      const installed = manager.getInstalledExtensions().find((m: ExtensionManifest) => m.name === ext.id);
      setExtStates(prev => ({
        ...prev,
        [ext.id]: {
          isInstalled: true,
          hasUpdate: false,
          installedVersion: installed?.version,
          action: 'idle',
        },
      }));
    } catch (error: any) {
      setExtAction(ext.id, 'idle');
      Alert.alert(
        'Error al instalar',
        `No se pudo instalar "${ext.display_name}".\n\nDetalle: ${error?.message || String(error)}`,
      );
    }
  };

  const handleUninstall = async (ext: StoreExtension) => {
    Alert.alert('Desinstalar extensión', `¿Seguro que deseas desinstalar "${ext.display_name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Desinstalar',
        style: 'destructive',
        onPress: async () => {
          setExtAction(ext.id, 'uninstalling');
          try {
            const manager = ExtensionManager.getInstance();
            await manager.uninstallExtension(ext.id);
            setExtStates(prev => ({
              ...prev,
              [ext.id]: { isInstalled: false, hasUpdate: false, action: 'idle' },
            }));
          } catch (error: any) {
            setExtAction(ext.id, 'idle');
            Alert.alert('Error', `No se pudo desinstalar:\n${error?.message || error}`);
          }
        },
      },
    ]);
  };

  const handleUpdate = async (ext: StoreExtension) => {
    setExtAction(ext.id, 'updating');
    try {
      const manager = ExtensionManager.getInstance();
      await manager.updateExtension(ext.id, ext.download_url);
      const installed = manager.getInstalledExtensions().find((m: ExtensionManifest) => m.name === ext.id);
      setExtStates(prev => ({
        ...prev,
        [ext.id]: {
          isInstalled: true,
          hasUpdate: false,
          installedVersion: installed?.version,
          action: 'idle',
        },
      }));
    } catch (error: any) {
      setExtAction(ext.id, 'idle');
      Alert.alert(
        'Error al actualizar',
        `No se pudo actualizar "${ext.display_name}".\n\nDetalle: ${error?.message || String(error)}`,
      );
    }
  };

  const renderActionButton = (ext: StoreExtension) => {
    const state = extStates[ext.id] || { isInstalled: false, hasUpdate: false, action: 'idle' };
    const isBusy = state.action !== 'idle';

    if (isBusy) {
      return (
        <View style={[styles.actionBtn, { backgroundColor: c.backgroundHighlight }]}>
          <ActivityIndicator size="small" color={c.primary} />
          <Text style={[styles.actionBtnText, { color: c.textSecondary, marginLeft: 4 }]}>
            {state.action === 'installing'
              ? 'Instalando...'
              : state.action === 'uninstalling'
                ? 'Quitando...'
                : 'Actualizando...'}
          </Text>
        </View>
      );
    }

    if (!state.isInstalled) {
      return (
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: c.primary }]} onPress={() => handleInstall(ext)}>
          <Ionicons name="download-outline" size={14} color="#fff" />
          <Text style={[styles.actionBtnText, { color: '#fff', marginLeft: 4 }]}>Instalar</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.installedActions}>
        {state.hasUpdate && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#F59E0B', marginRight: 6 }]}
            onPress={() => handleUpdate(ext)}
          >
            <Ionicons name="refresh-outline" size={14} color="#fff" />
            <Text style={[styles.actionBtnText, { color: '#fff', marginLeft: 4 }]}>Actualizar</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: c.backgroundHighlight }]}
          onPress={() => handleUninstall(ext)}
        >
          <Ionicons name="trash-outline" size={14} color={c.error || '#EF4444'} />
          <Text style={[styles.actionBtnText, { color: c.error || '#EF4444', marginLeft: 4 }]}>Quitar</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: c.background }]}>
      <LinearGradient colors={[c.backgroundHighlight, c.background]} style={styles.gradient} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={c.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.textPrimary }]}>Extensiones</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadData} disabled={loadingRegistry}>
          <Ionicons name="refresh-outline" size={22} color={loadingRegistry ? c.textMuted : c.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* URL del Registro */}
        <View style={[styles.card, { backgroundColor: c.backgroundElevated }]}>
          <Text style={[styles.cardTitle, { color: c.textPrimary }]}>URL del Registro</Text>
          <Text style={[styles.cardSubtitle, { color: c.textSecondary }]}>
            Repositorio de extensiones (GitHub o URL directa a registry.json)
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { color: c.textPrimary, backgroundColor: c.background, borderColor: c.border }]}
              value={registryUrl}
              onChangeText={setRegistryUrl}
              placeholder="https://github.com/spotiflacapp/SpotiFLAC-Extension"
              placeholderTextColor={c.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: c.primary }]}
              onPress={handleSaveRegistry}
              disabled={loadingRegistry}
            >
              {loadingRegistry ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Cargar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Contador y título */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Extensiones Disponibles</Text>
          {storeExtensions.length > 0 && (
            <View style={[styles.countBadge, { backgroundColor: c.backgroundHighlight }]}>
              <Text style={[styles.countText, { color: c.textSecondary }]}>{storeExtensions.length}</Text>
            </View>
          )}
        </View>

        {loadingRegistry && storeExtensions.length === 0 && (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={c.primary} />
            <Text style={[styles.loadingText, { color: c.textSecondary }]}>Cargando extensiones...</Text>
          </View>
        )}

        {storeExtensions.map(ext => {
          const state = extStates[ext.id] || { isInstalled: false, hasUpdate: false, action: 'idle' };
          return (
            <View
              key={ext.id}
              style={[
                styles.extCard,
                { backgroundColor: c.backgroundElevated },
                state.isInstalled && { borderLeftWidth: 3, borderLeftColor: c.primary },
              ]}
            >
              {/* Badge de actualización disponible */}
              {state.hasUpdate && (
                <View style={[styles.updateBadge, { backgroundColor: '#F59E0B' }]}>
                  <Text style={styles.updateBadgeText}>Actualización disponible</Text>
                </View>
              )}

              <View style={styles.extHeader}>
                <View style={styles.extInfo}>
                  <View style={styles.extNameRow}>
                    <Text style={[styles.extName, { color: c.textPrimary }]}>{ext.display_name}</Text>
                    {state.isInstalled && (
                      <View style={[styles.installedBadge, { backgroundColor: c.primary + '22' }]}>
                        <Ionicons name="checkmark-circle" size={12} color={c.primary} />
                        <Text style={[styles.installedBadgeText, { color: c.primary }]}>Instalado</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.extDesc, { color: c.textSecondary }]} numberOfLines={2}>
                    {ext.description}
                  </Text>
                </View>
              </View>

              {/* Tags y versión */}
              <View style={styles.tagsRow}>
                {ext.tags?.slice(0, 3).map(tag => (
                  <View key={tag} style={[styles.tag, { backgroundColor: c.background }]}>
                    <Text style={[styles.tagText, { color: c.textMuted }]}>{tag}</Text>
                  </View>
                ))}
                <Text style={[styles.versionText, { color: c.textMuted }]}>
                  v{ext.version}
                  {state.isInstalled && state.installedVersion && state.installedVersion !== ext.version
                    ? ` (instalada v${state.installedVersion})`
                    : ''}
                </Text>
              </View>

              {/* Botones de acción */}
              <View style={styles.actionsRow}>{renderActionButton(ext)}</View>
            </View>
          );
        })}

        {storeExtensions.length === 0 && !loadingRegistry && (
          <View style={styles.emptyState}>
            <Ionicons name="extension-puzzle-outline" size={48} color={c.textMuted} />
            <Text style={[styles.emptyText, { color: c.textSecondary }]}>
              No hay extensiones. Configura una URL de registro arriba y presiona "Cargar".
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 200 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    height: 60,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  refreshButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },
  headerTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold },
  scrollContent: { padding: Spacing.base, paddingBottom: 100 },
  card: {
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  cardTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, marginBottom: 4 },
  cardSubtitle: { fontSize: Typography.fontSize.sm, marginBottom: Spacing.md },
  inputContainer: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.sm,
    fontSize: Typography.fontSize.sm,
  },
  saveBtn: {
    height: 48,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 72,
  },
  saveBtnText: { color: '#fff', fontWeight: Typography.fontWeight.bold },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sectionTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  countText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium },
  loadingState: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  loadingText: { marginTop: Spacing.md, fontSize: Typography.fontSize.sm },
  extCard: {
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  updateBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  updateBadgeText: { color: '#fff', fontSize: 10, fontWeight: Typography.fontWeight.bold },
  extHeader: { marginBottom: Spacing.sm },
  extInfo: { flex: 1 },
  extNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  extName: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold },
  installedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  installedBadgeText: { fontSize: 10, fontWeight: Typography.fontWeight.medium },
  extDesc: { fontSize: Typography.fontSize.sm },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.md,
  },
  tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.sm },
  tagText: { fontSize: 10 },
  versionText: { fontSize: 10, marginLeft: 'auto' },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  installedActions: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  actionBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyText: { marginTop: Spacing.md, textAlign: 'center', lineHeight: 22 },
});
