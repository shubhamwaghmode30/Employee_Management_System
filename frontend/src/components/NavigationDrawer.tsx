import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, elevation } from '../theme';
import type { SessionUser } from '../types/session-user';
import { BrandMark } from './BrandMark';
import { NavigationList } from './NavigationList';
import { UserMenu } from './UserMenu';

type NavigationDrawerProps = {
  isOpen: boolean;
  user: SessionUser;
  onClose: () => void;
  onLogout: () => void;
};

export function NavigationDrawer({ isOpen, user, onClose, onLogout }: NavigationDrawerProps) {
  const insets = useSafeAreaInsets();

  function handleLogout() {
    onClose();
    onLogout();
  }

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View aria-modal style={styles.container}>
        <View style={[styles.panel, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <BrandMark />
          <View style={styles.navigation}>
            <NavigationList onNavigate={onClose} />
          </View>
          <UserMenu user={user} onLogout={handleLogout} />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close navigation menu"
          onPress={onClose}
          style={styles.backdrop}
        />
      </View>
    </Modal>
  );
}

const panelWidth = 280;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  panel: {
    width: panelWidth,
    maxWidth: '85%',
    backgroundColor: colors.surface,
    boxShadow: elevation.raised,
  },
  navigation: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
});
