import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../theme';

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  isConfirming: boolean;
  errorMessage: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Asks the user to confirm a destructive action before it runs. */
export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  isConfirming,
  errorMessage,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  function handleCancel() {
    if (!isConfirming) {
      onCancel();
    }
  }

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={handleCancel}>
      <View style={styles.backdrop}>
        <View role="alertdialog" aria-modal aria-label={title} style={styles.dialog}>
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          <Text style={styles.message}>{message}</Text>
          {errorMessage !== null && (
            <Text role="alert" style={styles.error}>
              {errorMessage}
            </Text>
          )}
          <View style={styles.buttons}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: isConfirming }}
              disabled={isConfirming}
              onPress={handleCancel}
              style={({ pressed }) => [styles.button, styles.cancelButton, pressed && styles.pressed]}
            >
              <Text style={styles.cancelLabel}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: isConfirming, busy: isConfirming }}
              disabled={isConfirming}
              onPress={onConfirm}
              style={({ pressed }) => [styles.button, styles.confirmButton, pressed && styles.pressed]}
            >
              {isConfirming ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={styles.confirmLabel}>{confirmLabel}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.overlay,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: spacing.md,
    backgroundColor: colors.surface,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  message: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.md,
  },
  error: {
    color: colors.danger,
    fontSize: typography.fontSize.sm,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  button: {
    minWidth: 96,
    alignItems: 'center',
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmButton: {
    backgroundColor: colors.danger,
  },
  pressed: {
    opacity: 0.8,
  },
  cancelLabel: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  confirmLabel: {
    color: colors.onPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
});
