import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, typography } from '../theme';

type AvatarProps = {
  name: string;
  size?: number;
};

// Muted tones that all keep white initials above 4.5:1 contrast.
const avatarTones = ['#4F46E5', '#0F766E', '#B45309', '#BE185D', '#1D4ED8', '#7C3AED', '#047857'] as const;

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter((part) => part !== '')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function pickTone(name: string): string {
  let hash = 0;
  for (const character of name) {
    hash = (hash * 31 + character.charCodeAt(0)) % avatarTones.length;
  }
  return avatarTones[hash] ?? colors.primary;
}

/** Initials on a coloured tile; decorative, so hidden from screen readers. */
export function Avatar({ name, size = 40 }: AvatarProps) {
  return (
    <View
      aria-hidden
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: radius.lg, backgroundColor: pickTone(name) },
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
  },
  initials: {
    color: colors.onPrimary,
    fontWeight: typography.fontWeight.semibold,
  },
});
