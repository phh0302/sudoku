import { useEffect, useState } from 'react';
import { Animated, Modal, StyleSheet, Text, View } from 'react-native';

import { parseLevelId } from '../core/levels';
import { DIFFICULTY_LABEL } from '../core/types';
import type { GameState } from '../store/gameLogic';
import type { SubmitState } from '../store/profileStore';
import { useTheme } from '../theme';
import { formatTime } from '../utils/format';
import { Button } from './Button';

interface Props {
  game: GameState;
  visible: boolean;
  bestTime: number | null;
  onNewGame: () => void;
  onRetry: () => void;
  onHome: () => void;
  /** Trạng thái gửi điểm lên bảng xếp hạng (chỉ chế độ màn) */
  submit?: SubmitState | null;
  onLeaderboard?: () => void;
  onNextLevel?: () => void;
}

export function ResultModal({
  game,
  visible,
  bestTime,
  onNewGame,
  onRetry,
  onHome,
  submit,
  onLeaderboard,
  onNextLevel,
}: Props) {
  const t = useTheme();
  const won = game.status === 'won';
  const [scale] = useState(() => new Animated.Value(0.6));
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0.6);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [visible, scale, opacity]);

  const level = game.levelId ? parseLevelId(game.levelId) : null;
  const onlineText = won && submit ? submitText(submit) : null;
  const isRecord = won && bestTime !== null && game.elapsed <= bestTime;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onHome}>
      <View style={styles.backdrop}>
        <Animated.View
          style={[styles.card, { backgroundColor: t.surface, opacity, transform: [{ scale }] }]}
        >
          <Text style={styles.emoji}>{won ? '🎉' : '😢'}</Text>
          <Text style={[styles.title, { color: t.text }]}>{won ? 'Xuất sắc!' : 'Thua rồi'}</Text>
          <Text style={[styles.sub, { color: t.textMuted }]}>
            {game.mode === 'daily' ? `Thử thách ${game.dailyKey} · ` : ''}
            {level ? `Màn ${level.n} · ` : ''}
            {DIFFICULTY_LABEL[game.difficulty]}
          </Text>

          <View style={[styles.stats, { borderColor: t.border }]}>
            <Stat label="Thời gian" value={formatTime(game.elapsed)} color={t.text} muted={t.textMuted} />
            <Stat label="Lỗi" value={String(game.mistakes)} color={t.text} muted={t.textMuted} />
            <Stat label="Gợi ý" value={String(game.hintsUsed)} color={t.text} muted={t.textMuted} />
          </View>
          {isRecord ? (
            <Text style={[styles.record, { color: t.primary }]}>🏆 Kỷ lục mới!</Text>
          ) : null}
          {onlineText ? (
            <Text style={[styles.online, { color: submit?.status === 'done' ? t.primary : t.textMuted }]}>
              {onlineText}
            </Text>
          ) : null}

          <View style={styles.actions}>
            {game.mode === 'classic' ? (
              <Button title="Ván mới" variant="primary" onPress={onNewGame} />
            ) : null}
            {won && onNextLevel ? (
              <Button title="Màn tiếp theo" variant="primary" onPress={onNextLevel} />
            ) : null}
            {!won ? <Button title="Chơi lại đề này" onPress={onRetry} /> : null}
            {onLeaderboard ? <Button title="Bảng xếp hạng" onPress={onLeaderboard} /> : null}
            <Button title="Về trang chủ" onPress={onHome} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function submitText(s: SubmitState): string | null {
  switch (s.status) {
    case 'sending':
      return 'Đang gửi kết quả lên bảng xếp hạng…';
    case 'done': {
      const time = s.time !== undefined ? `Thời gian xếp hạng ${formatTime(s.time)}` : '';
      const rank = s.rank ? `🌍 Hạng #${s.rank} / ${s.total} người chơi` : 'Đã lên bảng xếp hạng';
      return time ? `${rank}\n${time}` : rank;
    }
    case 'unranked':
      return 'Ván này không tính xếp hạng (không có mạng lúc bắt đầu)';
    case 'rejected':
      return `Kết quả bị máy chủ từ chối: ${s.reason ?? ''}`;
    case 'queued':
      return 'Chưa gửi được kết quả (mất mạng?) – sẽ tự gửi lại sau';
    case 'noname':
      return 'Đặt tên người chơi để lên bảng xếp hạng';
    default:
      return null;
  }
}

function Stat({ label, value, color, muted }: { label: string; value: string; color: string; muted: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: { width: '100%', maxWidth: 380, borderRadius: 20, padding: 24, alignItems: 'center' },
  emoji: { fontSize: 48 },
  title: { fontSize: 26, fontWeight: '700', marginTop: 8 },
  sub: { fontSize: 14, marginTop: 4 },
  stats: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    marginTop: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '600' },
  statLabel: { fontSize: 12, marginTop: 2 },
  record: { marginTop: 12, fontSize: 15, fontWeight: '600' },
  online: { marginTop: 10, fontSize: 14, textAlign: 'center' },
  actions: { alignSelf: 'stretch', gap: 10, marginTop: 20 },
});
