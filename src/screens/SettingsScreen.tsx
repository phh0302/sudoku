import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { NameModal } from '../components/NameModal';
import { isOnlineConfigured } from '../online/supabase';
import { useProfileStore } from '../store/profileStore';

import type { Settings, ThemeMode } from '../store/settings';
import { useSettingsStore } from '../store/settingsStore';
import { useStatsStore } from '../store/statsStore';
import { useTheme } from '../theme';
import { confirmAction } from '../utils/dialog';
import type { ScreenProps } from './types';

type BoolKey = {
  [K in keyof Settings]: Settings[K] extends boolean ? K : never;
}[keyof Settings];

const TOGGLES: { key: BoolKey; label: string; desc?: string }[] = [
  { key: 'autoCheck', label: 'Tự kiểm tra lỗi', desc: 'Báo đỏ ngay khi điền sai so với lời giải' },
  { key: 'mistakeLimit', label: 'Giới hạn 3 lỗi', desc: 'Thua khi sai 3 lần (cần bật tự kiểm tra)' },
  { key: 'highlightRelated', label: 'Tô sáng hàng, cột, khối' },
  { key: 'highlightSame', label: 'Tô sáng số giống nhau' },
  { key: 'showTimer', label: 'Hiện đồng hồ' },
  { key: 'sound', label: 'Âm thanh' },
  { key: 'haptics', label: 'Rung khi chạm' },
];

const THEMES: { key: ThemeMode; label: string }[] = [
  { key: 'system', label: 'Theo máy' },
  { key: 'light', label: 'Sáng' },
  { key: 'dark', label: 'Tối' },
];

export function SettingsScreen({ goBack }: ScreenProps) {
  const t = useTheme();
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const resetStats = useStatsStore((s) => s.reset);
  const name = useProfileStore((s) => s.name);
  const setName = useProfileStore((s) => s.setName);
  const [editingName, setEditingName] = useState(false);

  const confirmReset = () =>
    confirmAction(
      'Xóa thống kê?',
      'Toàn bộ số liệu thống kê sẽ bị xóa và không thể khôi phục.',
      'Xóa',
      resetStats,
    );

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={12} accessibilityLabel="Quay lại">
          <Ionicons name="chevron-back" size={28} color={t.text} />
        </Pressable>
        <Text style={[styles.title, { color: t.text }]}>Cài đặt</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.section, { color: t.textMuted }]}>NGƯỜI CHƠI</Text>
        <Pressable
          onPress={() => setEditingName(true)}
          style={[styles.card, styles.toggleRow, { backgroundColor: t.surface, borderColor: t.border }]}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontSize: 16 }}>Tên hiển thị</Text>
            <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 2 }}>
              {isOnlineConfigured ? 'Hiện trên bảng xếp hạng' : 'Chưa kết nối máy chủ bảng xếp hạng'}
            </Text>
          </View>
          <Text style={{ color: name ? t.primary : t.textMuted, fontSize: 16 }}>{name || 'Chưa đặt'}</Text>
          <Ionicons name="chevron-forward" size={20} color={t.textMuted} />
        </Pressable>

        <Text style={[styles.section, { color: t.textMuted }]}>GIAO DIỆN</Text>
        <View style={[styles.segment, { backgroundColor: t.surfaceAlt }]}>
          {THEMES.map((th) => {
            const active = settings.theme === th.key;
            return (
              <Pressable
                key={th.key}
                onPress={() => update({ theme: th.key })}
                style={[styles.segItem, active && { backgroundColor: t.surface }]}
              >
                <Text style={{ color: active ? t.primary : t.text, fontWeight: active ? '700' : '400' }}>
                  {th.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.section, { color: t.textMuted }]}>CÁCH CHƠI</Text>
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          {TOGGLES.map((item, idx) => (
            <View
              key={item.key}
              style={[
                styles.toggleRow,
                idx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border },
              ]}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ color: t.text, fontSize: 16 }}>{item.label}</Text>
                {item.desc ? (
                  <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 2 }}>{item.desc}</Text>
                ) : null}
              </View>
              <Switch
                value={settings[item.key]}
                onValueChange={(v) => update({ [item.key]: v } as Partial<Settings>)}
                trackColor={{ true: t.primary, false: t.border }}
              />
            </View>
          ))}
        </View>

        <Text style={[styles.section, { color: t.textMuted }]}>DỮ LIỆU</Text>
        <Pressable
          onPress={confirmReset}
          style={[styles.card, styles.danger, { backgroundColor: t.surface, borderColor: t.border }]}
        >
          <Text style={{ color: t.error, fontSize: 16 }}>Xóa thống kê</Text>
        </Pressable>

        <Text style={[styles.version, { color: t.textMuted }]}>Sudoku v1.0.0</Text>
      </ScrollView>

      {editingName ? (
        <NameModal
          visible
          initial={name}
          onCancel={() => setEditingName(false)}
          onSave={(n) => {
            setEditingName(false);
            void setName(n);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  title: { fontSize: 20, fontWeight: '700' },
  content: { padding: 16, gap: 10 },
  section: { fontSize: 13, fontWeight: '600', letterSpacing: 1, marginTop: 12 },
  segment: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  segItem: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 9 },
  card: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 8 },
  danger: { padding: 14, alignItems: 'center' },
  version: { textAlign: 'center', marginTop: 24, fontSize: 12 },
});
