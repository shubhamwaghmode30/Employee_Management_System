import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { colors, radius, spacing, typography } from '../../theme';
import { type SubmitPasswordChange, usePasswordChange } from './use-password-change';

type ChangePasswordFormProps = {
  submitPasswordChange: SubmitPasswordChange;
};

export function ChangePasswordForm({ submitPasswordChange }: ChangePasswordFormProps) {
  const form = usePasswordChange(submitPasswordChange);
  const { values, fieldErrors } = form;

  return (
    <Card title="Change password">
      <Text style={styles.hint}>Use at least 8 characters. You stay signed in after changing it.</Text>
      {form.isSaved && (
        <View role="status" style={[styles.banner, styles.successBanner]}>
          <Text style={[styles.bannerText, styles.successText]}>Your password has been changed.</Text>
        </View>
      )}
      {form.submitError !== null && (
        <View role="alert" style={[styles.banner, styles.errorBanner]}>
          <Text style={[styles.bannerText, styles.errorText]}>{form.submitError.message}</Text>
        </View>
      )}
      <TextField
        label="Current password"
        value={values.currentPassword}
        onChangeText={(text) => form.changeValue('currentPassword', text)}
        error={fieldErrors.currentPassword}
        isSecure
        autoCapitalize="none"
        autoComplete="current-password"
      />
      <TextField
        label="New password"
        value={values.newPassword}
        onChangeText={(text) => form.changeValue('newPassword', text)}
        error={fieldErrors.newPassword}
        isSecure
        autoCapitalize="none"
        autoComplete="new-password"
      />
      <TextField
        label="Confirm new password"
        value={values.confirmPassword}
        onChangeText={(text) => form.changeValue('confirmPassword', text)}
        error={fieldErrors.confirmPassword}
        isSecure
        autoCapitalize="none"
        autoComplete="new-password"
      />
      <View style={styles.actions}>
        <Button
          label="Update password"
          isLoading={form.isSubmitting}
          onPress={() => void form.submit()}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  hint: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.sm + spacing.xs,
  },
  successBanner: {
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySubtle,
  },
  errorBanner: {
    backgroundColor: colors.dangerSubtle,
  },
  bannerText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  successText: {
    color: colors.primaryStrongText,
  },
  errorText: {
    color: colors.danger,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
