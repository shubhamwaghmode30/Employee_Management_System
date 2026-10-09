import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../../theme';
import { FilterChip } from './FilterChip';

type ChoiceOption<Value extends string> = {
  value: Value;
  label: string;
};

type ChoiceFieldProps<Value extends string> = {
  label: string;
  options: readonly ChoiceOption<Value>[];
  selectedValue: Value | '';
  onChange: (value: Value) => void;
  error?: string | undefined;
};

/** A labelled single choice shown as chips, for short option lists. */
export function ChoiceField<Value extends string>({
  label,
  options,
  selectedValue,
  onChange,
  error,
}: ChoiceFieldProps<Value>) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View role="radiogroup" aria-label={label} style={styles.options}>
        {options.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            isSelected={selectedValue === option.value}
            onPress={() => onChange(option.value)}
          />
        ))}
      </View>
      {error !== undefined && (
        <Text role="alert" style={styles.error}>
          {error}
        </Text>
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
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  error: {
    color: colors.danger,
    fontSize: typography.fontSize.sm,
  },
});
