import { type ReactNode, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useBreakpoint } from '../hooks/use-breakpoint';
import { colors } from '../theme';
import type { SessionUser } from '../types/session-user';
import { NavigationDrawer } from './NavigationDrawer';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

type AppShellProps = {
  user: SessionUser;
  onLogout: () => void;
  children: ReactNode;
};

/** Desktop gets a persistent sidebar; tablet and mobile get a top bar with a drawer. */
export function AppShell({ user, onLogout, children }: AppShellProps) {
  const breakpoint = useBreakpoint();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  if (breakpoint === 'desktop') {
    return (
      <View style={styles.desktop}>
        <Sidebar user={user} onLogout={onLogout} />
        <View style={styles.content}>{children}</View>
      </View>
    );
  }

  return (
    <View style={styles.compact}>
      <TopBar onOpenNavigation={() => setIsDrawerOpen(true)} />
      <View style={styles.content}>{children}</View>
      <NavigationDrawer
        isOpen={isDrawerOpen}
        user={user}
        onClose={() => setIsDrawerOpen(false)}
        onLogout={onLogout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  desktop: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
  },
  compact: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
});
