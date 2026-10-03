import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../../theme';

type EmployeeActionsProps = {
  employeeName: string;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

export function EmployeeActions({ employeeName, canEdit, canDelete, onEdit, onDelete }: EmployeeActionsProps) {
  if (!canEdit && !canDelete) {
    return null;
  }

  return (
    <View style={styles.actions}>
      {canEdit && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit ${employeeName}`}
          onPress={onEdit}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.editLabel}>Edit</Text>
        </Pressable>
      )}
      {canDelete && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete ${employeeName}`}
          onPress={onDelete}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.deleteLabel}>Delete</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  button: {
    borderRadius: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  pressed: {
    backgroundColor: colors.background,
  },
  editLabel: {
    color: colors.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  deleteLabel: {
    color: colors.danger,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
});
