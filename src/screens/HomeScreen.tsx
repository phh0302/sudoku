import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { NameModal } from '../components/NameModal';
import { LEVEL_COUNT, levelId, parseLevelId } from '../core/levels';
import { dateKey } from '../core/puzzles';
import { DIFFICULTIES, DIFFICULTY_LABEL, LOCKED_DIFFICULTY, type Difficulty } from '../core/types';
import { isOnlineConfigured } from '../online/supabase';
import { useGameStore } from '../store/gameStore';
import { useProfileStore } from '../store/profileStore';
import { useStatsStore } from '../store/statsStore';
import { useTheme } from '../theme';
import { showInfo } from '../utils/dialog';
import { formatTime } from '../utils/format';
import type { ScreenProps } from './types';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Đã hỏi tên trong lần mở app này chưa (bấm "Để sau" thì không hỏi lại cho tới lần mở app sau) */
let namePromptShown = false;

export function HomeScreen({ navigate }: ScreenProps) {
  const t = useTheme();
  const game = useGameStore((s) => s.game);
  const openDaily = useGameStore((s) => s.openDaily);
  const dailyCompleted = useStatsStore((s) => s.dailyCompleted);
  const levelBest = useStatsStore((s) => s.levelBest);
  const name = useProfileStore((s) => s.name);
  const setName = useProfileStore((s) => s.setName);
  const [askName, setAskName] = useState(false);

  // Hỏi tên 1 lần mỗi lần mở app (mở sau khi màn hình đã hiện – tránh lỗi hộp thoại không hiện trên web)
  useEffect(() => {
    if (namePromptShown || !isOnlineConfigured || useProfileStore.getState().name) return;
    const id = setTimeout(() => {
      namePromptShown = true;
      setAskName(true);
    }, 400);
    return () => clearTimeout(id);
  }, []);
  const masterUnlocked = useProfileStore((s) => s.masterUnlocked);
  const masterProgress = useProfileStore((s) => s.masterProgress);
  const refreshMaster = useProfileStore((s) => s.refreshMaster);

  // Cập nhật tiến độ mở khóa mỗi lần về trang chủ
  useEffect(() => {
    void refreshMaster();
  }, [refreshMaster]);

  const today = dateKey(new Date());
  const todayDone = dailyCompleted[today];
  const canContinue = game?.status === 'playing';

  const continueLabel = () => {
    if (!game) return '';
    if (game.mode === 'daily') return 'Thử thách hôm nay';
    const lv = game.levelId ? parseLevelId(game.levelId) : null;
    if (lv) return `${DIFFICULTY_LABEL[lv.difficulty]} · Màn ${lv.n}`;
    return `${DIFFICULTY_LABEL[game.difficulty]} · ngẫu nhiên`;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.logo, { color: t.primary }]}>Sudoku</Text>
        <Text style={[styles.tagline, { color: t.textMuted }]}>
          {name ? `Xin chào, ${name}!` : 'Rèn luyện trí não mỗi ngày'}
        </Text>
      </View>

      {canContinue && game ? (
        <Button
          variant="primary"
          title="Tiếp tục"
          subtitle={`${continueLabel()} · ${formatTime(game.elapsed)}`}
          onPress={() => navigate({ name: 'game' })}
        />
      ) : null}

      <Pressable
        onPress={() => {
          openDaily();
          navigate({ name: 'game' });
        }}
        style={({ pressed }) => [
          styles.daily,
          { backgroundColor: t.surface, borderColor: t.border, opacity: pressed ? 0.75 : 1 },
        ]}
      >
        <Ionicons name="calendar" size={28} color={t.primary} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.dailyTitle, { color: t.text }]}>Thử thách hôm nay</Text>
          <Text style={{ color: t.textMuted }}>
            {todayDone !== undefined ? `Đã hoàn thành · ${formatTime(todayDone)}` : today}
          </Text>
        </View>
        {todayDone !== undefined ? (
          <Ionicons name="checkmark-circle" size={26} color="#2EAD5B" />
        ) : (
          <Ionicons name="chevron-forward" size={22} color={t.textMuted} />
        )}
      </Pressable>

      <Text style={[styles.section, { color: t.textMuted }]}>CHỌN ĐỘ KHÓ</Text>
      <View style={styles.grid}>
        {DIFFICULTIES.filter((d) => d !== LOCKED_DIFFICULTY).map((d) => {
          const done = countSolved(levelBest, d);
          return (
            <Button
              key={d}
              title={DIFFICULTY_LABEL[d]}
              subtitle={`${done}/${LEVEL_COUNT} màn`}
              style={styles.gridItem}
              onPress={() => navigate({ name: 'levels', difficulty: d })}
            />
          );
        })}
      </View>

      <MasterCard
        unlocked={masterUnlocked}
        progress={masterProgress}
        solved={countSolved(levelBest, LOCKED_DIFFICULTY)}
        onOpen={() => navigate({ name: 'levels', difficulty: LOCKED_DIFFICULTY })}
      />

      <View style={styles.footer}>
        <FooterLink icon="trophy-outline" label="Xếp hạng" onPress={() => navigate({ name: 'leaderboard' })} />
        <FooterLink icon="stats-chart" label="Thống kê" onPress={() => navigate({ name: 'stats' })} />
        <FooterLink icon="settings-outline" label="Cài đặt" onPress={() => navigate({ name: 'settings' })} />
      </View>

      {askName ? (
        <NameModal
          visible
          onCancel={() => setAskName(false)}
          onSave={(n) => {
            setAskName(false);
            void setName(n);
          }}
        />
      ) : null}
    </ScrollView>
  );
}

function countSolved(levelBest: Record<string, number>, d: Difficulty): number {
  let done = 0;
  for (let n = 1; n <= LEVEL_COUNT; n++) if (levelBest[levelId(d, n)] !== undefined) done++;
  return done;
}

/** Thẻ chế độ Bậc thầy: khóa cho tới khi lọt top 100 ở 1 màn Chuyên gia bất kỳ. */
function MasterCard({
  unlocked,
  progress,
  solved,
  onOpen,
}: {
  unlocked: boolean;
  progress: { qualified: number; required: number; top: number } | null;
  solved: number;
  onOpen: () => void;
}) {
  const t = useTheme();
  const top = progress?.top ?? 100;

  const explain = () =>
    showInfo(
      '🔒 Chế độ Bậc thầy',
      `Mở khóa khi bạn lọt TOP ${top} ở ít nhất 1 màn ${DIFFICULTY_LABEL.expert} bất kỳ.\n\n` +
        'Hãy giải thật nhanh một màn Chuyên gia để lên bảng xếp hạng!\n\n' +
        (isOnlineConfigured
          ? 'Thứ hạng do máy chủ bảng xếp hạng tính.'
          : 'Cần kết nối máy chủ bảng xếp hạng (xem SUPABASE.md).'),
    );

  return (
    <Pressable
      onPress={unlocked ? onOpen : explain}
      style={({ pressed }) => [
        styles.master,
        {
          backgroundColor: unlocked ? '#2B1D52' : t.surface,
          borderColor: unlocked ? '#B48CFF' : t.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Ionicons
        name={unlocked ? 'diamond' : 'lock-closed'}
        size={28}
        color={unlocked ? '#D9C2FF' : t.textMuted}
      />
      <View style={{ flex: 1 }}>
        <Text style={[styles.masterTitle, { color: unlocked ? '#FFFFFF' : t.text }]}>
          {DIFFICULTY_LABEL.master}
        </Text>
        {unlocked ? (
          <Text style={{ color: '#D9C2FF' }}>{`${solved}/${LEVEL_COUNT} màn · đề khó nhất`}</Text>
        ) : (
          <Text style={{ color: t.textMuted, fontSize: 13 }}>
            {`🔒 Lọt top ${top} ở 1 màn ${DIFFICULTY_LABEL.expert} bất kỳ để mở khóa`}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={22} color={unlocked ? '#D9C2FF' : t.textMuted} />
    </Pressable>
  );
}

function FooterLink({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.link, { opacity: pressed ? 0.5 : 1 }]}>
      <Ionicons name={icon} size={24} color={t.text} />
      <Text style={{ color: t.text, marginTop: 4 }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 14, flexGrow: 1, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 16 },
  logo: { fontSize: 44, fontWeight: '800', letterSpacing: 1 },
  tagline: { fontSize: 15, marginTop: 4 },
  daily: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  dailyTitle: { fontSize: 17, fontWeight: '600' },
  section: { fontSize: 13, fontWeight: '600', letterSpacing: 1, marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: { flexBasis: '47%', flexGrow: 1 },
  footer: { flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 20 },
  master: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  masterTitle: { fontSize: 17, fontWeight: '700' },
  link: { alignItems: 'center', padding: 8 },
});
