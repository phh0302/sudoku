import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme';

interface Props {
  counts: number[]; // counts[d] = số ô đã điền đúng chữ số d
  noteMode: boolean;
  disabled?: boolean;
  onPress: (digit: number) => void;
}

export function NumberPad({ counts, noteMode, disabled, onPress }: Props) {
  const t = useTheme();
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => {
        const remaining = 9 - (counts[d] ?? 0);
        const done = remaining <= 0;
        return (
          <Pressable
            key={d}
            disabled={done || disabled}
            onPress={() => onPress(d)}
            accessibilityLabel={`Số ${d}, còn ${remaining}`}
            style={({ pressed }) => [
              styles.key,
              { backgroundColor: pressed ? t.cellSelected : t.surface, opacity: done ? 0 : 1 },
            ]}
          >
            <Text style={[styles.digit, { color: noteMode ? t.textMuted : t.primary }]}>{d}</Text>
            <Text style={[styles.remaining, { color: t.textMuted }]}>{remaining}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4 },
  key: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  digit: { fontSize: 28, fontWeight: '500' },
  remaining: { fontSize: 11, marginTop: -2 },
});
