import { memo, useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Theme } from '../theme';

interface Props {
  index: number;
  size: number;
  value: number;
  notes: number;
  given: boolean;
  selected: boolean;
  related: boolean;
  sameValue: boolean;
  error: boolean;
  /** > 0 khi ô nằm trong hàng/cột/khối vừa hoàn thành; đổi giá trị để chạy lại animation */
  flashKey: number;
  theme: Theme;
  onPress: (index: number) => void;
}

const NOTE_DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function CellBase(p: Props) {
  const { index, size, theme: t } = p;
  const row = Math.floor(index / 9);
  const col = index % 9;
  const [flash] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (p.flashKey <= 0) return;
    // Trễ theo khoảng cách để tạo hiệu ứng "gợn sóng"
    const delay = (row + col) * 18;
    flash.setValue(0);
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(flash, { toValue: 1, duration: 140, useNativeDriver: true }),
      Animated.timing(flash, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start();
  }, [p.flashKey, flash, row, col]);

  let bg = t.surface;
  if (p.related) bg = t.cellRelated;
  if (p.sameValue) bg = t.cellSame;
  if (p.error && !p.selected) bg = t.errorBg;
  if (p.selected) bg = t.cellSelected;

  const color = p.given ? t.given : p.error ? t.error : t.userValue;

  return (
    <Pressable
      onPress={() => p.onPress(index)}
      accessibilityLabel={`Hàng ${row + 1} cột ${col + 1}${p.value ? `, số ${p.value}` : ', trống'}`}
      style={[
        styles.cell,
        {
          width: size,
          height: size,
          backgroundColor: bg,
          borderRightWidth: col === 8 ? 0 : col % 3 === 2 ? 2 : StyleSheet.hairlineWidth * 2,
          borderBottomWidth: row === 8 ? 0 : row % 3 === 2 ? 2 : StyleSheet.hairlineWidth * 2,
          borderRightColor: col % 3 === 2 ? t.borderStrong : t.border,
          borderBottomColor: row % 3 === 2 ? t.borderStrong : t.border,
        },
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: t.flash, opacity: flash }]}
      />
      {p.value ? (
        <Text
          style={{
            fontSize: size * 0.56,
            fontWeight: p.given ? '600' : '500',
            color,
          }}
        >
          {p.value}
        </Text>
      ) : p.notes ? (
        <View style={styles.notes}>
          {NOTE_DIGITS.map((d) => (
            <Text
              key={d}
              style={[styles.note, { fontSize: size * 0.24, lineHeight: size * 0.3, color: t.note }]}
            >
              {p.notes & (1 << d) ? d : ' '}
            </Text>
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

export const Cell = memo(CellBase);

const styles = StyleSheet.create({
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  notes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    height: '100%',
    padding: 1,
  },
  note: {
    width: '33.33%',
    textAlign: 'center',
  },
});
