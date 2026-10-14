import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../theme';

interface Props {
  title: string;
  subtitle?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Button({ title, subtitle, onPress, variant = 'secondary', icon, style }: Props) {
  const t = useTheme();
  const primary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: primary ? t.primary : t.surface,
          borderColor: primary ? t.primary : t.border,
          opacity: pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      {icon}
      <Text style={[styles.title, { color: primary ? t.primaryText : t.text }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: primary ? t.primaryText : t.textMuted }]}>
          {subtitle}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  title: { fontSize: 17, fontWeight: '600' },
  subtitle: { fontSize: 13 },
});
