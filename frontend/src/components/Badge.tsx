import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';

export type BadgeTone = 'accent' | 'neutral';

type BadgeProps = {
  label: string;
  tone: BadgeTone;
};

/** Small square label: sky for the one state worth highlighting, grey otherwise. */
export function Badge({ label, tone }: BadgeProps) {
  const isAccent = tone === 'accent';
  return (
    <View style={[styles.badge, isAccent ? styles.accent : styles.neutral]}>
      <Text style={[styles.label, isAccent ? styles.accentLabel : styles.neutralLabel]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  accent: {
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySubtle,
  },
  neutral: {
    borderColor: colors.border,
    backgroundColor: colors.neutralSubtle,
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  accentLabel: {
    color: colors.primaryStrongText,
  },
  neutralLabel: {
    color: colors.textSecondary,
  },
});
