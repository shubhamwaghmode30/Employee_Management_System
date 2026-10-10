import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, elevation, radius, spacing, typography } from '../theme';

type CardProps = {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  isFlush?: boolean;
  children: ReactNode;
};

/** White panel with a hairline border; a title bar when titled, flush when it holds a table. */
export function Card({ title, subtitle, action, isFlush = false, children }: CardProps) {
  return (
    <View style={styles.card}>
      {title !== undefined && (
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
            {subtitle !== undefined && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          {action}
        </View>
      )}
      <View style={isFlush ? undefined : styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    boxShadow: elevation.card,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg - spacing.xs,
    paddingVertical: spacing.sm + spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: {
    flexShrink: 1,
    gap: 2,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
  },
  body: {
    gap: spacing.md,
    padding: spacing.lg - spacing.xs,
  },
});
