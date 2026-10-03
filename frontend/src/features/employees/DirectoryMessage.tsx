import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../../theme';

type DirectoryMessageProps = {
  title: string;
  description?: string;
  isLoading?: boolean;
  actionLabel?: string;
  onAction?: () => void;
};

/** Loading, empty and error states for the employee directory. */
export function DirectoryMessage({
  title,
  description,
  isLoading = false,
  actionLabel,
  onAction,
}: DirectoryMessageProps) {
  return (
    <View role={isLoading ? 'progressbar' : 'status'} style={styles.container}>
      {isLoading && <ActivityIndicator color={colors.primary} />}
      <Text style={styles.title}>{title}</Text>
      {description !== undefined && <Text style={styles.description}>{description}</Text>}
      {actionLabel !== undefined && onAction !== undefined && (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
        >
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.md,
    textAlign: 'center',
  },
  action: {
    marginTop: spacing.sm,
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
  },
  actionPressed: {
    opacity: 0.8,
  },
  actionLabel: {
    color: colors.onPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
});
