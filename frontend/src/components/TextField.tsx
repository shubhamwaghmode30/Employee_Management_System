import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';

type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string | undefined;
  hint?: string;
  placeholder?: string;
  isSecure?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoComplete?: TextInputProps['autoComplete'];
  onSubmitEditing?: () => void;
};

export function TextField({
  label,
  value,
  onChangeText,
  error,
  hint,
  placeholder,
  isSecure = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoComplete = 'off',
  onSubmitEditing,
}: TextFieldProps) {
  const hasError = error !== undefined;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={hasError ? error : hint}
        aria-invalid={hasError}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        secureTextEntry={isSecure}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        autoCorrect={false}
        onSubmitEditing={onSubmitEditing}
        style={[styles.input, hasError && styles.inputError]}
      />
      {hasError ? (
        <Text role="alert" style={styles.error}>
          {error}
        </Text>
      ) : (
        hint !== undefined && <Text style={styles.hint}>{hint}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
  },
  label: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    color: colors.danger,
    fontSize: typography.fontSize.sm,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
});
