import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { CardHeader } from '../../components/Card';
import { PageHeader } from '../../components/PageHeader';
import { StatusMessage } from '../../components/StatusMessage';
import { colors, elevation, radius, spacing, typography } from '../../theme';
import { useEmployeeDataSource } from './employee-data-source-context';
import { formatDate, getFullName } from './employee-labels';
import type { DeletedEmployee, Employee } from './employee-schemas';
import { type DeletedEmployeesState, useDeletedEmployees } from './use-deleted-employees';

type DeletedEmployeesProps = {
  onBack: () => void;
  onRestored: (employee: Employee) => void;
};

const noEmployees: readonly DeletedEmployee[] = [];

/** Soft-deleted employees, kept in the database so an admin can bring them back. */
export function DeletedEmployees({ onBack, onRestored }: DeletedEmployeesProps) {
  const deleted = useDeletedEmployees(useEmployeeDataSource(), onRestored);
  const { state } = deleted;
  const employees = state.status === 'success' ? state.data.items : noEmployees;

  function renderStatus(currentState: DeletedEmployeesState) {
    if (currentState.status === 'loading') {
      return <StatusMessage title="Loading deleted employees…" isLoading />;
    }
    if (currentState.status === 'error') {
      return (
        <StatusMessage
          title="Deleted employees could not be loaded"
          description={currentState.error.message}
          actionLabel="Try again"
          onAction={deleted.reload}
        />
      );
    }
    return currentState.data.items.length === 0 ? (
      <StatusMessage title="No deleted employees" description="Employees you delete can be restored from here." />
    ) : null;
  }

  return (
    <FlatList
      role="list"
      aria-label="Deleted employees"
      data={employees}
      keyExtractor={(employee) => employee.id}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View style={styles.header}>
          <Pressable accessibilityRole="link" onPress={onBack} style={styles.backLink}>
            <Text style={styles.backLabel}>Back to employees</Text>
          </Pressable>
          <PageHeader
            title="Deleted employees"
            subtitle="Restoring brings back the record and lets the employee sign in again."
          />
          {deleted.restoreError !== null && (
            <View role="alert" style={styles.errorBanner}>
              <Text style={styles.errorText}>{deleted.restoreError.message}</Text>
            </View>
          )}
          <View style={styles.panelTop}>
            <CardHeader
              title="Deleted records"
              subtitle={state.status === 'success' ? `${state.data.total} total` : 'Loading records'}
            />
            {renderStatus(state)}
          </View>
        </View>
      }
      renderItem={({ item }) => {
        const fullName = getFullName(item);
        return (
          <View role="listitem" style={styles.row}>
            <Avatar name={fullName} size={32} />
            <View style={styles.identity}>
              <Text style={styles.name}>{fullName}</Text>
              <Text style={styles.secondary}>
                {item.email} · {item.department}
              </Text>
            </View>
            <Text style={styles.secondary}>Deleted {formatDate(item.deleted_at)}</Text>
            <Button
              label="Restore"
              accessibilityLabel={`Restore ${fullName}`}
              variant="secondary"
              isCompact
              isLoading={deleted.restoringId === item.id}
              isDisabled={deleted.restoringId !== null}
              onPress={() => void deleted.restore(item)}
            />
          </View>
        );
      }}
      ListFooterComponent={
        <View style={styles.panelBottom}>
          {state.status === 'success' && deleted.totalPages > 1 && (
            <View style={styles.pagination}>
              <Button
                label="Previous"
                accessibilityLabel="Previous page"
                variant="secondary"
                isCompact
                isDisabled={deleted.page <= 1}
                onPress={deleted.goToPreviousPage}
              />
              <Text style={styles.secondary}>
                Page {deleted.page} of {deleted.totalPages}
              </Text>
              <Button
                label="Next"
                accessibilityLabel="Next page"
                variant="secondary"
                isCompact
                isDisabled={deleted.page >= deleted.totalPages}
                onPress={deleted.goToNextPage}
              />
            </View>
          )}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
    padding: spacing.lg,
  },
  header: {
    gap: spacing.lg - spacing.xs,
  },
  backLink: {
    alignSelf: 'flex-start',
  },
  backLabel: {
    color: colors.primary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  errorBanner: {
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.dangerSubtle,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.fontSize.md,
  },
  panelTop: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    boxShadow: elevation.card,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg - spacing.xs,
    paddingVertical: spacing.sm + 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  identity: {
    flex: 1,
    minWidth: 180,
    gap: 2,
  },
  name: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  secondary: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
  },
  panelBottom: {
    minHeight: radius.lg,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    padding: spacing.sm + 2,
    backgroundColor: colors.surfaceMuted,
  },
});
