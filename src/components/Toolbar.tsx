import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme, type Theme } from '../theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface Props {
  noteMode: boolean;
  canUndo: boolean;
  hintsLeft: number;
  disabled?: boolean;
  onUndo: () => void;
  onErase: () => void;
  onToggleNotes: () => void;
  onHint: () => void;
}

export function Toolbar(p: Props) {
  const t = useTheme();
  const off = !!p.disabled;
  return (
    <View style={styles.row}>
      <Tool t={t} icon="arrow-undo-outline" label="Hoàn tác" onPress={p.onUndo} enabled={p.canUndo && !off} />
      <Tool t={t} icon="backspace-outline" label="Xóa" onPress={p.onErase} enabled={!off} />
      <Tool
        t={t}
        icon={p.noteMode ? 'pencil' : 'pencil-outline'}
        label="Ghi chú"
        onPress={p.onToggleNotes}
        enabled={!off}
        active={p.noteMode}
        badge={p.noteMode ? 'BẬT' : 'TẮT'}
      />
      <Tool
        t={t}
        icon="bulb-outline"
        label="Gợi ý"
        onPress={p.onHint}
        enabled={!off && p.hintsLeft > 0}
        badge={String(p.hintsLeft)}
      />
    </View>
  );
}

interface ToolProps {
  t: Theme;
  icon: IconName;
  label: string;
  onPress: () => void;
  enabled: boolean;
  active?: boolean;
  badge?: string;
}

function Tool({ t, icon, label, onPress, enabled, active, badge }: ToolProps) {
  const color = active ? t.primary : enabled ? t.text : t.textMuted;
  return (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      accessibilityLabel={label}
      style={({ pressed }) => [styles.tool, { opacity: pressed ? 0.5 : enabled ? 1 : 0.4 }]}
    >
      <View>
        <Ionicons name={icon} size={26} color={color} />
        {badge ? (
          <Text
            style={[
              styles.badge,
              { backgroundColor: active ? t.primary : t.textMuted, color: t.primaryText },
            ]}
          >
            {badge}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-around' },
  tool: { alignItems: 'center', minWidth: 64, paddingVertical: 6 },
  label: { fontSize: 12, marginTop: 4 },
  badge: {
    position: 'absolute',
    top: -6,
    right: -18,
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
});
