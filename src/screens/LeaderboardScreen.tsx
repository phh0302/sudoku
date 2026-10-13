import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button } from '../components/Button';
import { NameModal } from '../components/NameModal';
import { ScreenHeader } from '../components/ScreenHeader';
import { parseLevelId } from '../core/levels';
import { DIFFICULTY_LABEL } from '../core/types';
import * as api from '../online/api';
import { isOnlineConfigured } from '../online/supabase';
import { useProfileStore } from '../store/profileStore';
import { useTheme, type Theme } from '../theme';
import { formatTime } from '../utils/format';
import type { ScreenProps } from './types';

type Tab = 'level' | 'overall';

interface Row {
  key: string;
  rank: number;
  name: string;
  main: string; // cột chính (thời gian hoặc số màn)
  sub?: string;
  me: boolean;
}

export function LeaderboardScreen({ goBack, levelId }: ScreenProps & { levelId?: string }) {
  const t = useTheme();
  const level = levelId ? parseLevelId(levelId) : null;
  const [tab, setTab] = useState<Tab>(level ? 'level' : 'overall');
  const [rows, setRows] = useState<Row[]>([]);
  const [myRank, setMyRank] = useState<api.MyRank | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const name = useProfileStore((s) => s.name);
  const setName = useProfileStore((s) => s.setName);

  const load = useCallback(async () => {
    if (!isOnlineConfigured) return;
    setLoading(true);
    setError(null);
    try {
      await useProfileStore.getState().flush();
      const myId = await api.getMyUserId();
      if (tab === 'level' && levelId) {
        const [list, mine] = await Promise.all([
          api.fetchLevelLeaderboard(levelId),
          api.fetchMyLevelRank(levelId),
        ]);
        setMyRank(mine);
        setRows(
          list.map((e, i) => ({
            key: e.playerId,
            rank: i + 1,
            name: e.name,
            main: formatTime(e.time),
            sub: e.hints ? `${e.hints} gợi ý` : undefined,
            me: e.playerId === myId,
          })),
        );
      } else {
        const list = await api.fetchOverallLeaderboard();
        setMyRank(null);
        setRows(
          list.map((e, i) => ({
            key: e.playerId,
            rank: i + 1,
            name: e.name,
            main: `${e.levels} màn`,
            sub: formatTime(e.totalTime),
            me: e.playerId === myId,
          })),
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [tab, levelId]);

  useEffect(() => {
    // Tải dữ liệu từ máy chủ khi mở màn hình / đổi tab
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const title = 'Bảng xếp hạng';
  const subtitle =
    tab === 'level' && level ? `${DIFFICULTY_LABEL[level.difficulty]} · Màn ${level.n}` : 'Tất cả các màn';

  if (!isOnlineConfigured) {
    return (
      <View style={{ flex: 1 }}>
        <ScreenHeader title={title} onBack={goBack} />
        <Message t={t} icon="☁️" text="Chưa kết nối máy chủ bảng xếp hạng. Xem hướng dẫn trong file SUPABASE.md." />
      </View>
    );
  }

  const meInList = rows.some((r) => r.me);

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader title={title} subtitle={subtitle} onBack={goBack} />

      {level ? (
        <View style={[styles.tabs, { backgroundColor: t.surfaceAlt }]}>
          {(['level', 'overall'] as Tab[]).map((k) => (
            <Pressable
              key={k}
              onPress={() => setTab(k)}
              style={[styles.tab, tab === k && { backgroundColor: t.surface }]}
            >
              <Text style={{ color: tab === k ? t.primary : t.text, fontWeight: tab === k ? '700' : '400' }}>
                {k === 'level' ? `Màn ${level.n}` : 'Tổng'}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {!name ? (
        <View style={[styles.banner, { backgroundColor: t.cellRelated }]}>
          <Text style={{ color: t.text, flex: 1 }}>Đặt tên để kết quả của bạn hiện trên bảng.</Text>
          <Button title="Đặt tên" variant="primary" onPress={() => setEditingName(true)} />
        </View>
      ) : null}

      {loading && rows.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={t.primary} />
      ) : error ? (
        <View style={{ padding: 24, gap: 12 }}>
          <Message t={t} icon="⚠️" text={`Lỗi: ${error}`} />
          <Button title="Thử lại" onPress={load} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.key}
          contentContainerStyle={{ padding: 16, gap: 6 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={t.primary} />}
          ListEmptyComponent={
            <Message t={t} icon="🏁" text="Chưa có ai giải màn này. Hãy là người đầu tiên!" />
          }
          renderItem={({ item }) => <RankRow t={t} row={item} />}
        />
      )}

      {tab === 'level' && myRank && !meInList ? (
        <View style={[styles.footer, { borderTopColor: t.border, backgroundColor: t.surface }]}>
          <RankRow
            t={t}
            row={{ key: 'me', rank: myRank.rank, name: name || 'Bạn', main: formatTime(myRank.time), me: true }}
          />
          <Text style={{ color: t.textMuted, textAlign: 'center', marginTop: 4, fontSize: 12 }}>
            trên tổng {myRank.total} người chơi
          </Text>
        </View>
      ) : null}

      {editingName ? (
        <NameModal
          visible
          initial={name}
          onCancel={() => setEditingName(false)}
          onSave={async (n) => {
            setEditingName(false);
            await setName(n);
            void load();
          }}
        />
      ) : null}
    </View>
  );
}

const MEDALS = ['🥇', '🥈', '🥉'];

function RankRow({ t, row }: { t: Theme; row: Row }) {
  return (
    <View
      style={[
        styles.row,
        { backgroundColor: row.me ? t.cellSelected : t.surface, borderColor: t.border },
      ]}
    >
      <Text style={[styles.rank, { color: t.textMuted }]}>
        {row.rank <= 3 ? MEDALS[row.rank - 1] : `#${row.rank}`}
      </Text>
      <Text style={[styles.name, { color: t.text }]} numberOfLines={1}>
        {row.name}
        {row.me ? ' (bạn)' : ''}
      </Text>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.main, { color: t.text }]}>{row.main}</Text>
        {row.sub ? <Text style={{ color: t.textMuted, fontSize: 11 }}>{row.sub}</Text> : null}
      </View>
    </View>
  );
}

function Message({ t, icon, text }: { t: Theme; icon: string; text: string }) {
  return (
    <View style={styles.message}>
      <Text style={{ fontSize: 40 }}>{icon}</Text>
      <Text style={{ color: t.textMuted, textAlign: 'center', marginTop: 8 }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', borderRadius: 12, padding: 4, marginHorizontal: 16 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 9 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  rank: { width: 40, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  name: { flex: 1, fontSize: 16, fontWeight: '500' },
  main: { fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] },
  footer: { padding: 12, borderTopWidth: 1 },
  message: { alignItems: 'center', padding: 32 },
});
