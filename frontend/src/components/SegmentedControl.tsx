import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';

export type SegmentOption<Value extends string> = {
  value: Value;
  label: string;
};

type SegmentedControlProps<Value extends string> = {
  label: string;
  options: readonly SegmentOption<Value>[];
  selectedValue: Value | '';
  onChange: (value: Value) => void;
};

/** Joined square buttons for picking one of a few options. */
export function SegmentedControl<Value extends string>({
  label,
  options,
  selectedValue,
  onChange,
}: SegmentedControlProps<Value>) {
  return (
    <View role="radiogroup" aria-label={label} style={styles.group}>
      {options.map((option, index) => {
        const isSelected = option.value === selectedValue;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityState={{ selected: isSelected }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.segment,
              index > 0 && styles.divided,
              isSelected && styles.selected,
              pressed && !isSelected && styles.pressed,
            ]}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  segment: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  divided: {
    borderLeftWidth: 1,
    borderLeftColor: colors.borderStrong,
  },
  selected: {
    backgroundColor: colors.primary,
  },
  pressed: {
    backgroundColor: colors.surfaceHover,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  labelSelected: {
    color: colors.onPrimary,
    fontWeight: typography.fontWeight.semibold,
  },
});
