import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../theme';
import { FilterChip } from './FilterChip';
import type { StatusFilter } from './use-employee-directory';

const statusOptions: readonly { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

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
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          accessibilityLabel="Search employees"
          placeholder="Search by name, email or employee code"
          placeholderTextColor={colors.placeholder}
          value={searchText}
          onChangeText={onSearchTextChange}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          style={styles.search}
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroller}
        contentContainerStyle={styles.chipScrollRow}
        accessibilityLabel="Filter by department"
      >
        <FilterChip
          label="All departments"
          isSelected={department === null}
          onPress={() => onDepartmentChange(null)}
        />
        {departments.map((departmentName) => (
          <FilterChip
            key={departmentName}
            label={departmentName}
            isSelected={department === departmentName}
            onPress={() => onDepartmentChange(departmentName)}
          />
        ))}
      </ScrollView>
      <View style={styles.chipRow} accessibilityLabel="Filter by status">
        {statusOptions.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            isSelected={statusFilter === option.value}
            onPress={() => onStatusFilterChange(option.value)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm + spacing.xs,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  search: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
  },
  chipScroller: {
    flexGrow: 0,
  },
  chipScrollRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
