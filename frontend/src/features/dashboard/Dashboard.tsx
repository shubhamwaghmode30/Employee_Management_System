import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { hasPermission } from '../../auth/permissions';
import { roleLabels } from '../../auth/roles';
import { useSessionUser } from '../../auth/session-user-context';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PageHeader } from '../../components/PageHeader';
import { StatusMessage } from '../../components/StatusMessage';
import { colors, spacing, typography } from '../../theme';
import { useEmployeeDataSource } from '../employees/employee-data-source-context';
import { DepartmentBreakdown } from './DepartmentBreakdown';
import { StatCard } from './StatCard';
import { useDashboardStats } from './use-dashboard-stats';

type DashboardProps = {
  onAddEmployee: () => void;
  onOpenDirectory: () => void;
  onOpenProfile: () => void;
};

function getGreeting(hour: number): string {
  if (hour < 12) {
    return 'Good morning';
  }
  return hour < 17 ? 'Good afternoon' : 'Good evening';
}

export function Dashboard({ onAddEmployee, onOpenDirectory, onOpenProfile }: DashboardProps) {
  const user = useSessionUser();
  const dashboard = useDashboardStats(useEmployeeDataSource());
  const canCreate = hasPermission(user, 'EMPLOYEE_CREATE');

  function renderStats() {
    const { state } = dashboard;
    if (state.status === 'loading') {
      return <StatusMessage title="Loading dashboard…" isLoading />;
    }
    if (state.status === 'error') {
      return (
        <StatusMessage
          title="Dashboard could not be loaded"
          description={state.error.message}
          actionLabel="Try again"
          onAction={dashboard.reload}
        />
      );
    }
    const { stats } = state;
    return (
      <>
        <View style={styles.statGrid}>
          <StatCard
            label="Total employees"
            value={stats.total}
            icon="people"
            tone={{ foreground: colors.primary, background: colors.primarySubtle }}
          />
          <StatCard
            label="Active"
            value={stats.active}
            icon="checkmark-circle"
            tone={{ foreground: colors.success, background: colors.successSubtle }}
          />
          <StatCard
            label="Inactive"
            value={stats.inactive}
            icon="pause-circle"
            tone={{ foreground: colors.warning, background: colors.warningSubtle }}
          />
          <StatCard
            label="Departments"
            value={stats.departments.length}
            icon="business"
            tone={{ foreground: colors.textSecondary, background: colors.background }}
          />
        </View>
        <View style={styles.panels}>
          <View style={styles.widePanel}>
            <Card title="Headcount by department">
              <DepartmentBreakdown departments={stats.departments} total={stats.total} />
            </Card>
          </View>
          <View style={styles.narrowPanel}>
            <Card title="Quick actions">
              <Text style={styles.hint}>Jump straight to the tasks you do most.</Text>
              {canCreate && <Button label="Add employee" icon="person-add-outline" onPress={onAddEmployee} />}
              <Button
                label="Browse directory"
                icon="people-outline"
                variant="secondary"
                onPress={onOpenDirectory}
              />
              <Button
                label="My profile"
                icon="person-circle-outline"
                variant="secondary"
                onPress={onOpenProfile}
              />
            </Card>
          </View>
        </View>
      </>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <PageHeader
        title={`${getGreeting(new Date().getHours())}, ${user.firstName}`}
        subtitle={`Signed in as ${roleLabels[user.role]}. Here is how the organisation looks today.`}
      />
      {renderStats()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 1280,
    alignSelf: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  panels: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  // flexShrink lets each panel take the full width on phones instead of overflowing.
  widePanel: {
    flexGrow: 2,
    flexShrink: 1,
    flexBasis: 420,
  },
  narrowPanel: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 260,
  },
  hint: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
  },
});
