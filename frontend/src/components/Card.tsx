import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, elevation, radius, spacing, typography } from '../theme';

type CardProps = {
  title?: string;
  children: ReactNode;
};

/** White panel with a soft shadow, optionally headed by a section title. */
export function Card({ title, children }: CardProps) {
  return (
    <View style={styles.card}>
      {title !== undefined && (
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    boxShadow: elevation.card,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
});
