import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '../../theme';

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
          hitSlop={spacing.xs}
          onPress={onEdit}
          style={({ pressed }) => [styles.button, pressed && styles.editPressed]}
        >
          <Ionicons name="create-outline" size={18} color={colors.primary} />
        </Pressable>
      )}
      {canDelete && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete ${employeeName}`}
          hitSlop={spacing.xs}
          onPress={onDelete}
          style={({ pressed }) => [styles.button, pressed && styles.deletePressed]}
        >
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
        </Pressable>
      )}
    </View>
  );
}

const buttonSize = 34;

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  button: {
    width: buttonSize,
    height: buttonSize,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  editPressed: {
    backgroundColor: colors.primarySubtle,
  },
  deletePressed: {
    backgroundColor: colors.dangerSubtle,
  },
});
