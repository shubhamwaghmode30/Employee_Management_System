import { StyleSheet, View } from 'react-native';

import { colors } from '../theme';
import type { SessionUser } from '../types/session-user';
import { BrandMark } from './BrandMark';
import { NavigationList } from './NavigationList';
import { UserMenu } from './UserMenu';

type SidebarProps = {
  user: SessionUser;
  onLogout: () => void;
};

export function Sidebar({ user, onLogout }: SidebarProps) {
  return (
    <View style={styles.sidebar}>
      <BrandMark />
      <View style={styles.navigation}>
        <NavigationList />
      </View>
      <UserMenu user={user} onLogout={onLogout} />
    </View>
  );
}

const sidebarWidth = 248;

const styles = StyleSheet.create({
  sidebar: {
    width: sidebarWidth,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  navigation: {
    flex: 1,
  },
});
