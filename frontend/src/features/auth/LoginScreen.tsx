import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { colors, elevation, radius, spacing, typography } from '../../theme';
import { type SignIn, useLoginForm } from './use-login-form';

type LoginScreenProps = {
  signIn: SignIn;
  notice: string | null;
};

const highlights = [
  'One directory for every employee and contractor',
  'Role-based access for admins, HR and staff',
  'Live headcount by department and status',
] as const;

export function LoginScreen({ signIn, notice }: LoginScreenProps) {
  const form = useLoginForm(signIn);
  const isWide = useBreakpoint() === 'desktop';

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.layout}>
        {isWide && (
          <View style={styles.brandPanel}>
            <View style={styles.brandHeader}>
              <View aria-hidden style={styles.logo}>
                <Text style={styles.logoText}>EMS</Text>
              </View>
              <Text style={styles.brandName}>Employee Management System</Text>
            </View>
            <View style={styles.pitch}>
              <Text style={styles.pitchTitle}>Your people, organised.</Text>
              {highlights.map((highlight) => (
                <Text key={highlight} style={styles.highlight}>
                  {highlight}
                </Text>
              ))}
            </View>
          </View>
        )}
        <ScrollView contentContainerStyle={styles.formArea} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              {!isWide && <Text style={styles.compactBrand}>Employee Management System</Text>}
              <Text accessibilityRole="header" style={styles.title}>
                Sign in
              </Text>
              <Text style={styles.subtitle}>Use the email and password your administrator gave you.</Text>
            </View>

            {notice !== null && (
              <View role="status" style={[styles.banner, styles.noticeBanner]}>
                <Text style={[styles.bannerText, styles.noticeText]}>{notice}</Text>
              </View>
            )}
            {form.submitError !== null && (
              <View role="alert" style={[styles.banner, styles.errorBanner]}>
                <Text style={[styles.bannerText, styles.errorText]}>{form.submitError}</Text>
              </View>
            )}

            <TextField
              label="Email"
              value={form.email}
              onChangeText={form.changeEmail}
              error={form.fieldErrors.email}
              placeholder="you@company.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <TextField
              label="Password"
              value={form.password}
              onChangeText={form.changePassword}
              error={form.fieldErrors.password}
              isSecure
              autoCapitalize="none"
              autoComplete="current-password"
              onSubmitEditing={() => void form.submit()}
            />
            <Button label="Sign in" isLoading={form.isSubmitting} onPress={() => void form.submit()} />
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  layout: {
    flex: 1,
    flexDirection: 'row',
  },
  brandPanel: {
    width: '42%',
    maxWidth: 560,
    justifyContent: 'space-between',
    padding: spacing.xxl,
    backgroundColor: colors.primarySubtle,
    borderRightWidth: 1,
    borderRightColor: colors.primaryBorder,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + spacing.xs,
  },
  logo: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
  },
  logoText: {
    color: colors.onPrimary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
  },
  brandName: {
    color: colors.primaryStrongText,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  pitch: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  pitchTitle: {
    color: colors.primaryStrongText,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
  },
  highlight: {
    paddingLeft: spacing.sm + spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    color: colors.textSecondary,
    fontSize: typography.fontSize.md,
  },
  formArea: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    gap: spacing.md + spacing.xs,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 3,
    borderTopColor: colors.primary,
    backgroundColor: colors.surface,
    boxShadow: elevation.raised,
  },
  cardHeader: {
    gap: spacing.sm,
  },
  compactBrand: {
    color: colors.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  banner: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.sm + spacing.xs,
  },
  noticeBanner: {
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySubtle,
  },
  errorBanner: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSubtle,
  },
  bannerText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  noticeText: {
    color: colors.primaryStrongText,
  },
  errorText: {
    color: colors.danger,
  },
});
