import { Ionicons } from '@expo/vector-icons';
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
  { icon: 'people-outline', text: 'One directory for every employee and contractor' },
  { icon: 'shield-checkmark-outline', text: 'Role-based access for admins, HR and staff' },
  { icon: 'stats-chart-outline', text: 'Live headcount by department and status' },
] as const;

export function LoginScreen({ signIn, notice }: LoginScreenProps) {
  const form = useLoginForm(signIn);
  const breakpoint = useBreakpoint();
  const isWide = breakpoint === 'desktop';

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.layout}>
        {isWide && (
          <View style={styles.brandPanel}>
            <View style={styles.brandHeader}>
              <View aria-hidden style={styles.logo}>
                <Ionicons name="briefcase" size={22} color={colors.onPrimary} />
              </View>
              <Text style={styles.brandName}>Employee Management System</Text>
            </View>
            <View style={styles.pitch}>
              <Text style={styles.pitchTitle}>Your people, organised.</Text>
              {highlights.map((highlight) => (
                <View key={highlight.text} style={styles.highlight}>
                  <Ionicons name={highlight.icon} size={20} color={colors.sidebarText} />
                  <Text style={styles.highlightText}>{highlight.text}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        <ScrollView contentContainerStyle={styles.formArea} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              {!isWide && (
                <View aria-hidden style={styles.logo}>
                  <Ionicons name="briefcase" size={22} color={colors.onPrimary} />
                </View>
              )}
              <Text accessibilityRole="header" style={styles.title}>
                Sign in
              </Text>
              <Text style={styles.subtitle}>Use the email and password your administrator gave you.</Text>
            </View>

            {notice !== null && (
              <View role="status" style={[styles.banner, styles.noticeBanner]}>
                <Ionicons name="time-outline" size={20} color={colors.warning} />
                <Text style={[styles.bannerText, styles.noticeText]}>{notice}</Text>
              </View>
            )}
            {form.submitError !== null && (
              <View role="alert" style={[styles.banner, styles.errorBanner]}>
                <Ionicons name="alert-circle" size={20} color={colors.danger} />
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
            <Button
              label="Sign in"
              icon="log-in-outline"
              isLoading={form.isSubmitting}
              onPress={() => void form.submit()}
            />
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
    backgroundColor: colors.sidebar,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + spacing.xs,
  },
  brandName: {
    color: colors.onPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  pitch: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  pitchTitle: {
    color: colors.onPrimary,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
  },
  highlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + spacing.xs,
  },
  highlightText: {
    flex: 1,
    color: colors.sidebarText,
    fontSize: typography.fontSize.md,
  },
  logo: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primary,
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    boxShadow: elevation.raised,
  },
  cardHeader: {
    gap: spacing.sm,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.sm + spacing.xs,
  },
  noticeBanner: {
    backgroundColor: colors.warningSubtle,
  },
  errorBanner: {
    backgroundColor: colors.dangerSubtle,
  },
  bannerText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  noticeText: {
    color: colors.warning,
  },
  errorText: {
    color: colors.danger,
  },
});
