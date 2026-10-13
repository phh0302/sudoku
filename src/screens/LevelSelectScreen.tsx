import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Button } from '../components/Button';
import { ScreenHeader } from '../components/ScreenHeader';
import { LEVEL_COUNT, levelId } from '../core/levels';
import { DIFFICULTY_LABEL, LOCKED_DIFFICULTY, type Difficulty } from '../core/types';
import { useGameStore } from '../store/gameStore';
import { useProfileStore } from '../store/profileStore';
import { useStatsStore } from '../store/statsStore';
import { useTheme } from '../theme';
import { formatTime } from '../utils/format';
import type { ScreenProps } from './types';

const LEVELS = Array.from({ length: LEVEL_COUNT }, (_, i) => i + 1);
const COLUMNS = 5;
const GAP = 8;

export function LevelSelectScreen({ navigate, goBack, difficulty }: ScreenProps & { difficulty: Difficulty }) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const levelBest = useStatsStore((s) => s.levelBest);
  const current = useGameStore((s) => (s.game?.status === 'playing' ? s.game.levelId : undefined));
  const openLevel = useGameStore((s) => s.openLevel);
  const newGame = useGameStore((s) => s.newGame);

  const masterLocked = useProfileStore((s) => difficulty === LOCKED_DIFFICULTY && !s.masterUnlocked);
  const done = LEVELS.filter((n) => levelBest[levelId(difficulty, n)] !== undefined).length;
  const tile = Math.floor((Math.min(width, 560) - 32 - GAP * (COLUMNS - 1)) / COLUMNS);

  if (masterLocked) {
    return (
      <View style={{ flex: 1 }}>
        <ScreenHeader title={DIFFICULTY_LABEL[difficulty]} onBack={goBack} />
        <View style={styles.locked}>
          <Ionicons name="lock-closed" size={48} color={t.textMuted} />
          <Text style={{ color: t.text, fontSize: 16, textAlign: 'center', marginTop: 12 }}>
            Chế độ này mở khóa khi bạn lọt top 100 ở 1 màn {DIFFICULTY_LABEL.expert} bất kỳ.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader
        title={DIFFICULTY_LABEL[difficulty]}
        subtitle={`Đã giải ${done}/${LEVEL_COUNT} màn`}
        onBack={goBack}
        right={
          <Pressable
            hitSlop={12}
            onPress={() => navigate({ name: 'leaderboard' })}
            accessibilityLabel="Bảng xếp hạng"
          >
            <Ionicons name="trophy-outline" size={24} color={t.text} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.grid, { gap: GAP, width: tile * COLUMNS + GAP * (COLUMNS - 1) }]}>
          {LEVELS.map((n) => {
            const id = levelId(difficulty, n);
            const best = levelBest[id];
            const solved = best !== undefined;
            const playing = current === id;
            return (
              <Pressable
                key={n}
                onPress={() => {
                  openLevel(difficulty, n);
                  navigate({ name: 'game' });
                }}
                accessibilityLabel={`Màn ${n}${solved ? `, đã giải ${formatTime(best)}` : ''}`}
                style={({ pressed }) => [
                  styles.tile,
                  {
                    width: tile,
                    height: tile,
                    backgroundColor: solved ? t.cellSame : t.surface,
                    borderColor: playing ? t.primary : t.border,
                    borderWidth: playing ? 2 : 1,
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
              >
                <Text style={[styles.num, { color: solved ? t.primary : t.text }]}>{n}</Text>
                {solved ? (
                  <Text style={[styles.time, { color: t.textMuted }]}>{formatTime(best)}</Text>
                ) : playing ? (
                  <Text style={[styles.time, { color: t.primary }]}>đang chơi</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <Button
          title="Ván ngẫu nhiên"
          subtitle="Không tính bảng xếp hạng"
          onPress={() => {
            newGame(difficulty);
            navigate({ name: 'game' });
          }}
          style={{ marginTop: 20, alignSelf: 'stretch' }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32, alignItems: 'center' },
  locked: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  tile: { borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  num: { fontSize: 20, fontWeight: '700' },
  time: { fontSize: 10, marginTop: 2 },
});
