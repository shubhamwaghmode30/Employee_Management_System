import { type ReactNode, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useBreakpoint } from '../hooks/use-breakpoint';
import { colors } from '../theme';
import type { SessionUser } from '../types/session-user';
import { HeaderBar } from './HeaderBar';
import { NavigationDrawer } from './NavigationDrawer';
import { Sidebar } from './Sidebar';

type AppShellProps = {
  user: SessionUser;
  onLogout: () => void;
  children: ReactNode;
};

/** Desktop gets a persistent sidebar; tablet and mobile open the same navigation in a drawer. */
export function AppShell({ user, onLogout, children }: AppShellProps) {
  const isDesktop = useBreakpoint() === 'desktop';
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <View style={styles.shell}>
      {isDesktop && <Sidebar user={user} onLogout={onLogout} />}
      <View style={styles.main}>
        <HeaderBar user={user} isCompact={!isDesktop} onOpenNavigation={() => setIsDrawerOpen(true)} />
        <View style={styles.content}>{children}</View>
      </View>
      {!isDesktop && (
        <NavigationDrawer
          isOpen={isDrawerOpen}
          user={user}
          onClose={() => setIsDrawerOpen(false)}
          onLogout={onLogout}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
  },
  main: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
