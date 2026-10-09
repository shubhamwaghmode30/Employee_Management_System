import { Tabs, useRouter } from "expo-router";
import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../../theme";
import { useAuth } from "../../auth/auth-context";
import { useBreakpoint } from "../../hooks/use-breakpoint";

export default function TabsLayout() {
  const { state } = useAuth();
  const router = useRouter();
  const breakpoint = useBreakpoint();

  useEffect(() => {
    if (state.status === "unauthenticated") {
      router.replace("/login");
    }
  }, [state.status, router]);

  if (state.status === "loading" || state.status === "unauthenticated") {
    return null;
  }

  const userName = state.status === "authenticated" 
    ? `${state.user.first_name} ${state.user.last_name}` 
    : "";

  if (breakpoint === "desktop") {
    return (
      <View style={styles.desktopLayout}>
        <View style={styles.sidebar}>
          <Text style={styles.sidebarTitle}>Employee Management</Text>
          <SidebarItem icon="people" label="Employees" active />
          <View style={styles.sidebarFooter}>
            <Text style={styles.userName}>{userName}</Text>
            <LogoutButton />
          </View>
        </View>
        <View style={styles.mainContent}>
          <Tabs
            screenOptions={{
              tabBarStyle: { display: "none" },
              headerShown: false,
            }}
          >
            <Tabs.Screen name="employees" />
          </Tabs>
        </View>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        headerShown: true,
        headerRight: () => (
          <View style={styles.headerRight}>
            <Text style={styles.userName}>{userName}</Text>
            <LogoutButton />
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="employees"
        options={{
          title: "Employees",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

function SidebarItem({ icon, label, active }: { icon: keyof typeof Ionicons.glyphMap; label: string; active?: boolean }) {
  return (
    <View style={[styles.sidebarItem, active && styles.sidebarItemActive]}>
      <Ionicons name={icon} size={24} color={active ? colors.primary : colors.text} />
      <Text style={[styles.sidebarItemText, active && styles.sidebarItemTextActive]}>{label}</Text>
    </View>
  );
}

function LogoutButton() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <Ionicons
      name="log-out-outline"
      size={24}
      color={colors.text}
      onPress={handleLogout}
      style={{ marginRight: 16 }}
    />
  );
}

const styles = StyleSheet.create({
  desktopLayout: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    width: 250,
    backgroundColor: colors.card,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    padding: spacing.lg,
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.xl,
  },
  sidebarItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 8,
  },
  sidebarItemActive: {
    backgroundColor: colors.background,
  },
  sidebarItemText: {
    marginLeft: spacing.md,
    color: colors.text,
  },
  sidebarItemTextActive: {
    fontWeight: "bold",
  },
  sidebarFooter: {
    marginTop: "auto",
  },
  userName: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  mainContent: {
    flex: 1,
  },
});
