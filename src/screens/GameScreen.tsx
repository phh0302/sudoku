import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { isRewardedSupported, showRewardedAd } from '../ads/rewarded';
import { Board } from '../components/Board';
import { NumberPad } from '../components/NumberPad';
import { ResultModal } from '../components/ResultModal';
import { Toolbar } from '../components/Toolbar';
import { LEVEL_COUNT, parseLevelId } from '../core/levels';
import { DIFFICULTY_LABEL } from '../core/types';
import { canEarnBonusHint, digitCounts, hintLimit, hintsLeft } from '../store/gameLogic';
import { useGameStore } from '../store/gameStore';
import { MAX_MISTAKES } from '../store/settings';
import { useProfileStore } from '../store/profileStore';
import { useSettingsStore } from '../store/settingsStore';
import { useStatsStore } from '../store/statsStore';
import { useTheme, type Theme } from '../theme';
import { showInfo } from '../utils/dialog';
import { formatTime } from '../utils/format';
import type { ScreenProps } from './types';

export function GameScreen({ navigate, goBack }: ScreenProps) {
  const t = useTheme();
  const { width, height } = useWindowDimensions();
  const game = useGameStore((s) => s.game);
  const dispatch = useGameStore((s) => s.dispatch);
  const newGame = useGameStore((s) => s.newGame);
  const restart = useGameStore((s) => s.restart);
  const settings = useSettingsStore((s) => s.settings);
  const openLevel = useGameStore((s) => s.openLevel);
  const submit = useProfileStore((s) => s.submit);
  const bestTime = useStatsStore((s) => {
    if (!game) return null;
    if (game.levelId) return s.levelBest[game.levelId] ?? null;
    return s.stats[game.difficulty]?.bestTime ?? null;
  });
  const level = game?.levelId ? parseLevelId(game.levelId) : null;

  const [paused, setPaused] = useState(false);
  const [adLoading, setAdLoading] = useState(false);
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const playing = game?.status === 'playing';
  const adShowingRef = useRef(false);
  /** Màn xếp hạng: đồng hồ chạy theo thời gian thực (giống máy chủ), tạm dừng không dừng giờ */
  const startedAtMs = game?.levelId ? game.startedAtMs : undefined;

  // Tự tạm dừng khi app chuyển xuống nền
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      const active = state === 'active';
      setAppActive(active);
      if (!active && !adShowingRef.current) setPaused(true);
    });
    return () => sub.remove();
  }, []);

  // Đồng hồ
  useEffect(() => {
    if (!playing) return;
    if (startedAtMs !== undefined) {
      const sync = () =>
        dispatch({ type: 'sync', elapsed: Math.floor((Date.now() - startedAtMs) / 1000) });
      sync();
      const id = setInterval(sync, 1000);
      return () => clearInterval(id);
    }
    if (paused || !appActive || adLoading) return;
    const id = setInterval(() => dispatch({ type: 'tick', seconds: 1 }), 1000);
    return () => clearInterval(id);
  }, [playing, paused, appActive, adLoading, startedAtMs, dispatch]);

  /** Xem quảng cáo có thưởng → +1 gợi ý (chỉ ván ngẫu nhiên / thử thách ngày) */
  const watchAdForHint = async () => {
    if (adLoading) return;
    setAdLoading(true);
    adShowingRef.current = true;
    try {
      const earned = await showRewardedAd();
      if (earned) dispatch({ type: 'grantBonusHint' });
      else showInfo('Chưa có quảng cáo', 'Không tải được quảng cáo hoặc bạn đã đóng trước khi xem xong. Thử lại sau nhé!');
    } finally {
      adShowingRef.current = false;
      setAdLoading(false);
    }
  };

  const counts = useMemo(() => (game ? digitCounts(game) : []), [game]);

  if (!game) {
    return (
      <View style={styles.center}>
        <Text style={{ color: t.text }}>Chưa có ván nào.</Text>
      </View>
    );
  }

  const boardSize = Math.min(width - 16, height * 0.56, 560);
  const showMistakes = settings.autoCheck;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={12} accessibilityLabel="Quay lại">
          <Ionicons name="chevron-back" size={28} color={t.text} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: t.text }]}>
            {game.mode === 'daily'
              ? 'Thử thách hôm nay'
              : level
                ? `Màn ${level.n}`
                : DIFFICULTY_LABEL[game.difficulty]}
          </Text>
          {game.mode !== 'classic' ? (
            <Text style={{ color: t.textMuted, fontSize: 12 }}>{DIFFICULTY_LABEL[game.difficulty]}</Text>
          ) : null}
        </View>
        <Pressable
          onPress={() => setPaused((p) => !p)}
          hitSlop={12}
          disabled={!playing}
          accessibilityLabel={paused ? 'Tiếp tục' : 'Tạm dừng'}
        >
          <Ionicons name={paused ? 'play' : 'pause'} size={24} color={playing ? t.text : t.textMuted} />
        </Pressable>
      </View>

      <View style={styles.infoRow}>
        <Text style={{ color: t.textMuted }}>
          {showMistakes
            ? `Lỗi: ${game.mistakes}${settings.mistakeLimit ? `/${MAX_MISTAKES}` : ''}`
            : ' '}
        </Text>
        <Text style={{ color: t.textMuted }}>Gợi ý: {game.hintsUsed}/{hintLimit(game)}</Text>
        <Text style={{ color: t.textMuted, fontVariant: ['tabular-nums'] }}>
          {settings.showTimer ? formatTime(game.elapsed) : ' '}
        </Text>
      </View>

      {game.levelId ? <RankedBadge token={game.levelToken} t={t} /> : null}

      {/* Bàn cờ */}
      <View>
        <Board game={game} size={boardSize} />
        {paused && playing ? (
          <Pressable
            onPress={() => setPaused(false)}
            style={[styles.pauseOverlay, { backgroundColor: t.bg }]}
          >
            <Ionicons name="play-circle" size={72} color={t.primary} />
            <Text style={{ color: t.text, marginTop: 8, fontSize: 16 }}>Đang tạm dừng – chạm để chơi tiếp</Text>
            {startedAtMs !== undefined ? (
              <Text style={{ color: t.textMuted, marginTop: 4, fontSize: 13 }}>
                Màn xếp hạng: đồng hồ vẫn chạy
              </Text>
            ) : null}
          </Pressable>
        ) : null}
      </View>

      {/* Điều khiển */}
      <View style={styles.controls}>
        <Toolbar
          noteMode={game.noteMode}
          canUndo={game.history.length > 0}
          hintsLeft={hintsLeft(game)}
          disabled={!playing || paused}
          onUndo={() => dispatch({ type: 'undo' })}
          onErase={() => dispatch({ type: 'erase' })}
          onToggleNotes={() => dispatch({ type: 'toggleNoteMode' })}
          onHint={() => dispatch({ type: 'hint' })}
          adHint={
            isRewardedSupported() && canEarnBonusHint(game)
              ? { loading: adLoading, onPress: () => void watchAdForHint() }
              : null
          }
        />
        <NumberPad
          counts={counts}
          noteMode={game.noteMode}
          disabled={!playing || paused}
          onPress={(value) => dispatch({ type: 'input', value })}
        />
      </View>

      <ResultModal
        game={game}
        visible={!playing}
        bestTime={bestTime}
        onNewGame={() => newGame(game.difficulty)}
        onRetry={restart}
        onHome={() => navigate({ name: 'home' })}
        submit={game.levelId && submit?.levelId === game.levelId ? submit : null}
        onLeaderboard={
          game.levelId ? () => navigate({ name: 'leaderboard', levelId: game.levelId }) : undefined
        }
        onNextLevel={
          level && level.n < LEVEL_COUNT ? () => openLevel(level.difficulty, level.n + 1) : undefined
        }
      />
    </View>
  );
}

function RankedBadge({ token, t }: { token: string | null | undefined; t: Theme }) {
  const text =
    token === undefined
      ? '⏳ Đang kết nối bảng xếp hạng…'
      : token === null
        ? 'Ván này không tính xếp hạng (không có mạng lúc bắt đầu)'
        : '🏆 Màn xếp hạng · đồng hồ không dừng';
  return (
    <Text style={{ color: token ? t.primary : t.textMuted, fontSize: 12, textAlign: 'center', marginTop: -4 }}>
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 8, paddingBottom: 8, gap: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  headerInfo: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12 },
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  controls: { flex: 1, justifyContent: 'space-evenly', gap: 8 },
});
