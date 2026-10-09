import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, FlatList, TextInput, TouchableOpacity } from "react-native";
import { getEmployees, type Employee } from "../../api/client";
import { useAuth, usePermissions } from "../../auth/auth-context";
import { useBreakpoint } from "../../hooks/use-breakpoint";
import { colors, spacing } from "../../theme";

function useDebounce(value: string, delay: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function EmployeesScreen() {
  const { state } = useAuth();
  const permissions = usePermissions();
  const breakpoint = useBreakpoint();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const loadEmployees = React.useCallback(async () => {
    if (state.status !== "authenticated") return;

    setLoading(true);
    setError(null);

    const result = await getEmployees({ q: debouncedSearchQuery, page, page_size: 10 });
    if (result.success) {
      setEmployees(result.data.items);
      setTotal(result.data.total);
    } else {
      setError(result.error.message);
    }
    setLoading(false);
  }, [state.status, debouncedSearchQuery, page]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const canCreate = permissions.includes("EMPLOYEE_CREATE");

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadEmployees}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (breakpoint === "mobile") {
    return (
      <View style={styles.container}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search employees..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {canCreate && (
          <TouchableOpacity style={styles.createButton}>
            <Text style={styles.createButtonText}>New Employee</Text>
          </TouchableOpacity>
        )}
        <FlatList
          data={employees}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EmployeeCard employee={item} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState />}
        />
        <PaginationControls page={page} total={total} onPageChange={setPage} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search employees..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      {canCreate && (
        <TouchableOpacity style={styles.createButton}>
          <Text style={styles.createButtonText}>New Employee</Text>
        </TouchableOpacity>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <EmployeeTable employees={employees} />
      </ScrollView>
      <PaginationControls page={page} total={total} onPageChange={setPage} />
    </View>
  );
}

function EmployeeCard({ employee }: { employee: Employee }) {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{employee.first_name} {employee.last_name}</Text>
      <Text style={styles.detail}>{employee.email}</Text>
      <Text style={styles.detail}>{employee.department}</Text>
      <Text style={styles.detail}>{employee.job_title}</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{employee.employment_type}</Text>
      </View>
    </View>
  );
}

function EmployeeTable({ employees }: { employees: Employee[] }) {
  if (employees.length === 0) {
    return <EmptyState />;
  }

  return (
    <View style={styles.tableContainer}>
      <View style={styles.tableHeader}>
        <Text style={styles.headerCell}>Name</Text>
        <Text style={styles.headerCell}>Email</Text>
        <Text style={styles.headerCell}>Department</Text>
        <Text style={styles.headerCell}>Type</Text>
      </View>
      {employees.map((emp) => (
        <View key={emp.id} style={styles.tableRow}>
          <Text style={styles.cell}>{emp.first_name} {emp.last_name}</Text>
          <Text style={styles.cell}>{emp.email}</Text>
          <Text style={styles.cell}>{emp.department}</Text>
          <Text style={styles.cell}>{emp.employment_type}</Text>
        </View>
      ))}
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>No employees found</Text>
    </View>
  );
}

function PaginationControls({ page, total, onPageChange }: { page: number; total: number; onPageChange: (p: number) => void }) {
  const totalPages = Math.ceil(total / 10);
  if (totalPages <= 1) return null;

  return (
    <View style={styles.pagination}>
      <TouchableOpacity
        style={[styles.pageButton, page === 1 && styles.pageButtonDisabled]}
        onPress={() => onPageChange(page - 1)}
        disabled={page === 1}
      >
        <Text style={styles.pageButtonText}>Previous</Text>
      </TouchableOpacity>
      <Text style={styles.pageInfo}>{page} / {totalPages}</Text>
      <TouchableOpacity
        style={[styles.pageButton, page === totalPages && styles.pageButtonDisabled]}
        onPress={() => onPageChange(page + 1)}
        disabled={page === totalPages}
      >
        <Text style={styles.pageButtonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  error: {
    color: colors.error,
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
  },
  searchInput: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  listContent: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  detail: {
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    marginTop: spacing.sm,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
  },
  tableContainer: {
    minWidth: 600,
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerCell: {
    flex: 1,
    fontWeight: "bold",
    color: colors.text,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  cell: {
    flex: 1,
    color: colors.text,
  },
  createButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  pageButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  pageButtonDisabled: {
    backgroundColor: colors.border,
  },
  pageButtonText: {
    color: "#fff",
  },
  pageInfo: {
    color: colors.text,
  },
});
