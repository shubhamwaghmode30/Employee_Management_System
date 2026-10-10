import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, typography } from '../theme';

type AvatarProps = {
  name: string;
  size?: number;
};

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter((part) => part !== '')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

/** Initials on a light sky tile; decorative, so hidden from screen readers. */
export function Avatar({ name, size = 40 }: AvatarProps) {
  return (
    <View
      aria-hidden
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: radius.lg },
      ]}
    >
      <Text style={[styles.initials, { fontSize: Math.round(size * 0.38) }]}>{getInitials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySubtle,
  },
  initials: {
    color: colors.primaryStrongText,
    fontWeight: typography.fontWeight.semibold,
  },
});
