import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { roleLabels } from '../auth/roles';
import { colors, radius, spacing, typography } from '../theme';
import type { SessionUser } from '../types/session-user';
import { Avatar } from './Avatar';
import { getPageTrail } from './page-trail';

type HeaderBarProps = {
  user: SessionUser;
  isCompact: boolean;
  onOpenNavigation: () => void;
};

function getTodayLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

/** Top bar: breadcrumb and today's date on the left, the signed-in user on the right. */
export function HeaderBar({ user, isCompact, onOpenNavigation }: HeaderBarProps) {
  const insets = useSafeAreaInsets();
  const trail = getPageTrail(usePathname());

  return (
    <View style={[styles.bar, { paddingTop: insets.top }]}>
      {isCompact && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open navigation menu"
          hitSlop={spacing.sm}
          onPress={onOpenNavigation}
          style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}
        >
          <Ionicons name="menu" size={22} color={colors.textPrimary} />
        </Pressable>
      )}
      <View style={styles.trail} accessibilityLabel={`You are here: ${trail.join(', ')}`}>
        {trail.map((label, index) => {
          const isCurrent = index === trail.length - 1;
          return (
            <View key={label} style={styles.crumb}>
              {index > 0 && <Text style={styles.separator}>/</Text>}
              <Text style={[styles.crumbText, isCurrent && styles.crumbCurrent]} numberOfLines={1}>
                {label}
              </Text>
            </View>
          );
        })}
      </View>
      {!isCompact && (
        <View style={styles.date}>
          <Text style={styles.dateText}>{getTodayLabel(new Date())}</Text>
        </View>
      )}
      <View style={styles.user}>
        <Avatar name={user.fullName} size={32} />
        {!isCompact && (
          <View>
            <Text style={styles.userName} numberOfLines={1}>
              {user.fullName}
            </Text>
            <Text style={styles.userRole}>{roleLabels[user.role]}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const barHeight = 64;
const menuButtonSize = 38;

const styles = StyleSheet.create({
  bar: {
    minHeight: barHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuButton: {
    width: menuButtonSize,
    height: menuButtonSize,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  menuButtonPressed: {
    backgroundColor: colors.surfaceHover,
  },
  trail: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  crumb: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  separator: {
    color: colors.placeholder,
    fontSize: typography.fontSize.sm,
  },
  crumbText: {
    flexShrink: 1,
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
  },
  crumbCurrent: {
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
  },
  date: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.sm + spacing.xs,
    paddingVertical: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  dateText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  user: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  userName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  userRole: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
  },
});
