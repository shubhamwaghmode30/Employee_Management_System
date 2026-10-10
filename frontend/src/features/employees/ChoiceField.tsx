import { StyleSheet, Text, View } from 'react-native';

import { type SegmentOption, SegmentedControl } from '../../components/SegmentedControl';
import { colors, spacing, typography } from '../../theme';

type ChoiceFieldProps<Value extends string> = {
  label: string;
  options: readonly SegmentOption<Value>[];
  selectedValue: Value | '';
  onChange: (value: Value) => void;
  error?: string | undefined;
};

/** A labelled single choice shown as a segmented control, for short option lists. */
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
      <SegmentedControl label={label} options={options} selectedValue={selectedValue} onChange={onChange} />
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
    gap: spacing.xs + 2,
  },
  label: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  error: {
    color: colors.danger,
    fontSize: typography.fontSize.sm,
  },
});
