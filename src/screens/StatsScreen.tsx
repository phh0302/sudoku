import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DIFFICULTIES, DIFFICULTY_LABEL, type Difficulty } from '../core/types';
import { averageTime, emptyDifficultyStats, winRate } from '../store/stats';
import { useStatsStore } from '../store/statsStore';
import { useTheme } from '../theme';
import { formatTime } from '../utils/format';
import type { ScreenProps } from './types';

export function StatsScreen({ goBack }: ScreenProps) {
  const t = useTheme();
  const [tab, setTab] = useState<Difficulty>('easy');
  const stats = useStatsStore((s) => s.stats);
  const dailyCount = useStatsStore((s) => Object.keys(s.dailyCompleted).length);
  const s = stats[tab] ?? emptyDifficultyStats();

  const items: { label: string; value: string }[] = [
    { label: 'Đã chơi', value: String(s.played) },
    { label: 'Thắng', value: String(s.won) },
    { label: 'Tỉ lệ thắng', value: `${Math.round(winRate(s) * 100)}%` },
    { label: 'Nhanh nhất', value: formatTime(s.bestTime) },
    { label: 'Trung bình', value: formatTime(averageTime(s)) },
    { label: 'Chuỗi thắng', value: `${s.currentStreak} (cao nhất ${s.bestStreak})` },
  ];

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={12} accessibilityLabel="Quay lại">
          <Ionicons name="chevron-back" size={28} color={t.text} />
        </Pressable>
        <Text style={[styles.title, { color: t.text }]}>Thống kê</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.tabs, { backgroundColor: t.surfaceAlt }]}>
          {DIFFICULTIES.map((d) => {
            const active = d === tab;
            return (
              <Pressable
                key={d}
                onPress={() => setTab(d)}
                style={[styles.tab, active && { backgroundColor: t.surface }]}
              >
                <Text
                  numberOfLines={1}
                  style={{ color: active ? t.primary : t.text, fontWeight: active ? '700' : '400', fontSize: 13 }}
                >
                  {DIFFICULTY_LABEL[d]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.grid}>
          {items.map((it) => (
            <View key={it.label} style={[styles.box, { backgroundColor: t.surface, borderColor: t.border }]}>
              <Text style={[styles.value, { color: t.text }]}>{it.value}</Text>
              <Text style={{ color: t.textMuted, marginTop: 4 }}>{it.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.box, styles.daily, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Ionicons name="calendar" size={24} color={t.primary} />
          <Text style={{ color: t.text, fontSize: 16 }}>
            Đã hoàn thành <Text style={{ fontWeight: '700' }}>{dailyCount}</Text> thử thách hằng ngày
          </Text>
        </View>
      </ScrollView>
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
  content: { padding: 16, gap: 14 },
  tabs: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 9 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  box: { flexBasis: '47%', flexGrow: 1, borderRadius: 14, borderWidth: 1, padding: 16 },
  value: { fontSize: 22, fontWeight: '700' },
  daily: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
