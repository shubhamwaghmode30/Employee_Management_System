import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';

export type BadgeTone = 'blue' | 'orange' | 'violet' | 'green' | 'neutral';

type BadgeProps = {
  label: string;
  tone: BadgeTone;
  hasDot?: boolean;
};

const tones: Record<BadgeTone, { text: string; background: string; dot: string }> = {
  blue: { text: colors.primary, background: colors.primarySubtle, dot: colors.primary },
  orange: { text: colors.accentOrange, background: colors.accentOrangeSubtle, dot: colors.accentOrange },
  violet: { text: colors.accentViolet, background: colors.accentVioletSubtle, dot: colors.accentViolet },
  green: { text: colors.success, background: colors.successSubtle, dot: colors.successMark },
  neutral: { text: colors.textSecondary, background: colors.neutralSubtle, dot: colors.neutralMark },
};

/** Small square label; colour supports the text, never replaces it. */
export function Badge({ label, tone, hasDot = false }: BadgeProps) {
  const toneColors = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: toneColors.background }]}>
      {hasDot && <View aria-hidden style={[styles.dot, { backgroundColor: toneColors.dot }]} />}
      <Text style={[styles.label, { color: toneColors.text }]}>{label}</Text>
    </View>
  );
}

const dotSize = 6;

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  dot: {
    width: dotSize,
    height: dotSize,
    borderRadius: dotSize / 2,
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
});
