import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  type?: 'success' | 'error' | 'info';
}

export function CustomAlert({ visible, title, message, onClose, type = 'info' }: CustomAlertProps) {
  const { theme } = useTheme();
  const c = theme.colors;

  if (!visible) return null;

  const getIconName = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'alert-circle';
      case 'info':
      default:
        return 'information-circle';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return '#4ade80';
      case 'error':
        return '#f87171';
      case 'info':
      default:
        return c.primary;
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />

        <View style={[styles.alertBox, { backgroundColor: c.backgroundHighlight, borderColor: '#333' }]}>
          <View style={styles.header}>
            <Ionicons name={getIconName()} size={32} color={getIconColor()} />
            <Text style={[styles.title, { color: c.textPrimary }]}>{title}</Text>
          </View>

          <Text style={[styles.message, { color: c.textSecondary }]}>{message}</Text>

          <TouchableOpacity style={[styles.button, { backgroundColor: c.primary }]} onPress={onClose}>
            <Text style={styles.buttonText}>Aceptar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  alertBox: {
    width: '80%',
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  button: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontWeight: Typography.fontWeight.bold,
    fontSize: Typography.fontSize.md,
  },
});
