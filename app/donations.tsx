import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { Typography, Spacing, BorderRadius, Layout } from '@/constants/theme';
import { useTheme, type ThemeColors } from '@/contexts/ThemeContext';

interface DonationMethod {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  email: string;
  minAmount: string;
  description: string;
}

const DONATION_METHODS: DonationMethod[] = [
  {
    id: 'binance',
    name: 'Binance (USDT)',
    icon: 'logo-bitcoin',
    iconColor: '#F0B90B',
    email: '0x73b535be4e94e123f4c08c860d1760a2a26fb744',
    minAmount: '$0.01 USD',
    description:
      'Envía USDT a través de la red BEP20 (Binance Smart Chain) a la siguiente dirección. Asegúrate de seleccionar la red BEP20 al enviar.',
  },
  {
    id: 'bitget',
    name: 'Bitget Pay',
    icon: 'wallet-outline',
    iconColor: '#00D4AA',
    email: '7191013122',
    minAmount: '$0.01 USD',
    description:
      'Usa Bitget Pay para enviar una donación. Busca el siguiente ID de usuario dentro de la app de Bitget para transferir sin comisión.',
  },
  {
    id: 'paypal',
    name: 'PayPal',
    icon: 'logo-paypal',
    iconColor: '#00457C',
    email: 'Próximamente',
    minAmount: '$1.00 USD',
    description: 'El método de donación por PayPal estará disponible próximamente. ¡Gracias por tu paciencia!',
  },
];

interface DonationCardProps {
  method: DonationMethod;
  colors: ThemeColors;
}

function DonationCard({ method, colors }: DonationCardProps) {
  const handleCopyEmail = async () => {
    try {
      await Clipboard.setStringAsync(method.email);
      Alert.alert('¡Copiado!', `El correo de ${method.name} ha sido copiado al portapapeles.`, [{ text: 'OK' }]);
    } catch (error) {
      // ignore clipboard errors silently
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.backgroundElevated }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: method.iconColor + '20' }]}>
          <Ionicons name={method.icon} size={28} color={method.iconColor} />
        </View>
        <View style={styles.cardTitleContainer}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{method.name}</Text>
          <Text style={[styles.minAmount, { color: colors.primary }]}>Mínimo: {method.minAmount}</Text>
        </View>
      </View>

      <Text style={[styles.description, { color: colors.textSecondary }]}>{method.description}</Text>

      <View style={styles.emailContainer}>
        <Text style={[styles.emailLabel, { color: colors.textMuted }]}>Correo / ID:</Text>
        <TouchableOpacity
          style={[styles.emailBox, { backgroundColor: colors.backgroundHighlight }]}
          onPress={handleCopyEmail}
        >
          <Text style={[styles.emailText, { color: colors.textPrimary }]} numberOfLines={1}>
            {method.email}
          </Text>
          <Ionicons name="copy-outline" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function DonationsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const c = theme.colors;

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background, paddingTop: insets.top }]}>
      <LinearGradient colors={[c.backgroundHighlight, c.background]} style={styles.gradient} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={28} color={c.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.textPrimary }]}>Donaciones</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Layout.screenPaddingBottom + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introSection}>
          <Ionicons name="heart" size={48} color={c.primary} />
          <Text style={[styles.introTitle, { color: c.textPrimary }]}>¡Apoya Frito Music!</Text>
          <Text style={[styles.introText, { color: c.textSecondary }]}>
            Este proyecto es totalmente libre y de código abierto. Sin embargo, si te gusta nuestro trabajo y quieres
            apoyar el desarrollo continuo, puedes hacer una donación a través de los siguientes métodos.
          </Text>
        </View>

        <View style={styles.methodsContainer}>
          {DONATION_METHODS.map(method => (
            <DonationCard key={method.id} method={method} colors={c} />
          ))}
        </View>

        <View style={styles.thankYouSection}>
          <Text style={[styles.thankYouText, { color: c.textMuted }]}>
            ¡Gracias por tu apoyo! Cada donación nos ayuda a seguir mejorando la app.
          </Text>
          <Ionicons name="musical-notes" size={24} color={c.textMuted} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  headerSpacer: {
    width: 44,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
  },
  introSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.base,
  },
  introTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    marginTop: Spacing.base,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  introText: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    lineHeight: 22,
  },
  methodsContainer: {
    marginTop: Spacing.lg,
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: 2,
  },
  minAmount: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  description: {
    fontSize: Typography.fontSize.sm,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  emailContainer: {
    marginTop: Spacing.sm,
  },
  emailLabel: {
    fontSize: Typography.fontSize.xs,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emailBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  emailText: {
    fontSize: Typography.fontSize.base,
    flex: 1,
    marginRight: Spacing.sm,
  },
  thankYouSection: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    marginTop: Spacing.lg,
  },
  thankYouText: {
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
});
