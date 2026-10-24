import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { SegmentedControl } from '../../components/SegmentedControl';
import { colors, radius, spacing, typography } from '../../theme';
import { FilterChip } from './FilterChip';
import type { StatusFilter } from './use-employee-directory';

const statusOptions: readonly { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

// GET /employees rejects a q longer than this.
const searchMaxLength = 100;

type EmployeeFiltersProps = {
  departments: readonly string[];
  searchText: string;
  department: string | null;
  statusFilter: StatusFilter;
  onSearchTextChange: (text: string) => void;
  onDepartmentChange: (department: string | null) => void;
  onStatusFilterChange: (statusFilter: StatusFilter) => void;
};

export function EmployeeFilters({
  departments,
  searchText,
  department,
  statusFilter,
  onSearchTextChange,
  onDepartmentChange,
  onStatusFilterChange,
}: EmployeeFiltersProps) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.searchBox}>
          <TextInput
            accessibilityLabel="Search employees"
            placeholder="Search by name, email or employee code"
            placeholderTextColor={colors.placeholder}
            value={searchText}
            onChangeText={onSearchTextChange}
            maxLength={searchMaxLength}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
            style={styles.search}
          />
        </View>
        <SegmentedControl
          label="Filter by status"
          options={statusOptions}
          selectedValue={statusFilter}
          onChange={onStatusFilterChange}
        />
      </View>
      <View style={styles.departmentRow}>
        <Text style={styles.departmentLabel}>Department</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroller}
          contentContainerStyle={styles.chipScrollRow}
          accessibilityLabel="Filter by department"
        >
          <FilterChip label="All departments" isSelected={department === null} onPress={() => onDepartmentChange(null)} />
          {departments.map((departmentName) => (
            <FilterChip
              key={departmentName}
              label={departmentName}
              isSelected={department === departmentName}
              onPress={() => onDepartmentChange(departmentName)}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm + spacing.xs,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm + spacing.xs,
  },
  searchBox: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 260,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm + spacing.xs,
    backgroundColor: colors.surface,
  },
  search: {
    flex: 1,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
  },
  departmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + spacing.xs,
  },
  departmentLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipScroller: {
    flexGrow: 0,
    flexShrink: 1,
  },
  chipScrollRow: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
  },
});
