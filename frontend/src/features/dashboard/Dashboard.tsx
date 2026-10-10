import { ScrollView, StyleSheet, View } from 'react-native';

import { hasPermission } from '../../auth/permissions';
import { roleLabels } from '../../auth/roles';
import { useSessionUser } from '../../auth/session-user-context';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PageHeader } from '../../components/PageHeader';
import { StatusMessage } from '../../components/StatusMessage';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { colors, spacing } from '../../theme';
import { useEmployeeDataSource } from '../employees/employee-data-source-context';
import type { Employee } from '../employees/employee-schemas';
import type { EmployeeStats } from '../employees/employee-stats-schema';
import { ActiveRateMeter } from './ActiveRateMeter';
import { CompositionBar } from './CompositionBar';
import { DepartmentBarChart } from './DepartmentBarChart';
import { RecentHires } from './RecentHires';
import { StatCard } from './StatCard';
import { useDashboardStats } from './use-dashboard-stats';

type DashboardProps = {
  onAddEmployee: () => void;
  onOpenDirectory: () => void;
  onViewEmployee: (employee: Employee) => void;
};

function getGreeting(hour: number): string {
  if (hour < 12) {
    return 'Good morning';
  }
  return hour < 17 ? 'Good afternoon' : 'Good evening';
}

function percentOf(part: number, total: number): string {
  return `${total === 0 ? 0 : Math.round((part / total) * 100)}%`;
}

export function Dashboard({ onAddEmployee, onOpenDirectory, onViewEmployee }: DashboardProps) {
  const user = useSessionUser();
  const isCompact = useBreakpoint() === 'mobile';
  const dashboard = useDashboardStats(useEmployeeDataSource());
  const canCreate = hasPermission(user, 'EMPLOYEE_CREATE');

  function renderStats(stats: EmployeeStats) {
    const largestDepartment = stats.by_department[0];
    return (
      <>
        <View style={styles.statGrid}>
          <StatCard
            label="Total employees"
            value={stats.total}
            caption={`${stats.full_time} full time · ${stats.contract} contract`}
          />
          <StatCard
            label="Active"
            value={stats.active}
            caption={`${percentOf(stats.active, stats.total)} of the workforce`}
          />
          <StatCard
            label="Inactive"
            value={stats.inactive}
            caption="Cannot sign in until reactivated"
          />
          <StatCard
            label="Departments"
            value={stats.by_department.length}
            caption={
              largestDepartment === undefined ? 'None yet' : `Largest: ${largestDepartment.department}`
            }
          />
        </View>

        <View style={styles.panels}>
          <View style={styles.widePanel}>
            <Card title="Headcount by department" subtitle="Employees per department, excluding deleted records">
              <DepartmentBarChart departments={stats.by_department} total={stats.total} />
            </Card>
          </View>
          <View style={styles.narrowPanel}>
            <Card title="Workforce composition" subtitle="How the organisation is made up">
              <ActiveRateMeter active={stats.active} total={stats.total} />
              <View style={styles.divider} />
              <CompositionBar
                title="Employment type"
                segments={[
                  { label: 'Full time', count: stats.full_time },
                  { label: 'Contract', count: stats.contract },
                ]}
              />
              <View style={styles.divider} />
              <CompositionBar
                title="Roles"
                segments={(['ADMIN', 'HR_MANAGER', 'EMPLOYEE'] as const).map((role) => ({
                  label: roleLabels[role],
                  count: stats.by_role.find((entry) => entry.role === role)?.count ?? 0,
                }))}
              />
            </Card>
          </View>
        </View>

        <Card
          title="Recent hires"
          subtitle="The five most recent start dates"
          isFlush
          action={<Button label="View all" variant="ghost" isCompact onPress={onOpenDirectory} />}
        >
          <RecentHires employees={stats.recent_hires} isCompact={isCompact} onViewEmployee={onViewEmployee} />
        </Card>
      </>
    );
  }

  const { state } = dashboard;
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <PageHeader
        title={`${getGreeting(new Date().getHours())}, ${user.firstName}`}
        subtitle={`Signed in as ${roleLabels[user.role]}. Here is how the organisation looks today.`}
        actions={
          <>
            <Button label="Directory" variant="secondary" onPress={onOpenDirectory} />
            {canCreate && <Button label="Add employee" onPress={onAddEmployee} />}
          </>
        }
      />
      {state.status === 'loading' && <StatusMessage title="Loading dashboard…" isLoading />}
      {state.status === 'error' && (
        <StatusMessage
          title="Dashboard could not be loaded"
          description={state.error.message}
          actionLabel="Try again"
          onAction={dashboard.reload}
        />
      )}
      {state.status === 'success' && renderStats(state.stats)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 1320,
    alignSelf: 'center',
    gap: spacing.lg - spacing.xs,
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
    gap: spacing.lg - spacing.xs,
  },
  // flexShrink lets each panel take the full width on phones instead of overflowing.
  widePanel: {
    flexGrow: 3,
    flexShrink: 1,
    flexBasis: 440,
  },
  narrowPanel: {
    flexGrow: 2,
    flexShrink: 1,
    flexBasis: 300,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
});
