import React, { useState, memo } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface CreatePlaylistModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

function CreatePlaylistModalComponent({ visible, onClose, onCreate }: CreatePlaylistModalProps) {
  const [name, setName] = useState('');
  const { theme } = useTheme();
  const c = theme.colors;

  const handleCreate = () => {
    if (name.trim()) {
      onCreate(name.trim());
      setName('');
    }
  };

  const handleClose = () => {
    setName('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

        <View style={[styles.container, { backgroundColor: c.backgroundElevated }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: c.textPrimary }]}>Nueva lista de reproducción</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={c.textSecondary} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={[styles.input, { backgroundColor: c.backgroundHighlight, color: c.textPrimary }]}
            placeholder="Nombre de la lista"
            placeholderTextColor={c.textMuted}
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleCreate}
          />

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={[styles.cancelText, { color: c.textSecondary }]}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.createButton,
                { backgroundColor: c.primary },
                !name.trim() && { backgroundColor: c.backgroundHighlight },
              ]}
              onPress={handleCreate}
              disabled={!name.trim()}
            >
              <Text style={[styles.createText, { color: c.background }, !name.trim() && { color: c.textMuted }]}>
                Crear
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  container: {
    width: '85%',
    maxWidth: 400,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  input: {
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    marginBottom: Spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    marginRight: Spacing.sm,
  },
  cancelText: {
    fontSize: Typography.fontSize.base,
  },
  createButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  createText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
});

export const CreatePlaylistModal = memo(CreatePlaylistModalComponent);
export default CreatePlaylistModal;
