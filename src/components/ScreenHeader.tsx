import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme';

interface Props {
  title: string;
  subtitle?: string;
  onBack: () => void;
  right?: ReactNode;
}

/** Thanh tiêu đề dùng chung: nút quay lại – tiêu đề – nút phụ bên phải. */
export function ScreenHeader({ title, subtitle, onBack, right }: Props) {
  const t = useTheme();
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={12} accessibilityLabel="Quay lại" style={styles.side}>
        <Ionicons name="chevron-back" size={28} color={t.text} />
      </Pressable>
      <View style={styles.center}>
        <Text style={[styles.title, { color: t.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ color: t.textMuted, fontSize: 12 }} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={[styles.side, { alignItems: 'flex-end' }]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  side: { width: 44 },
  center: { flex: 1, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
});
