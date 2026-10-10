import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../theme';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.text}>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {subtitle !== undefined && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {actions !== undefined && <View style={styles.actions}>{actions}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  text: {
    flexShrink: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
