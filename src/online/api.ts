/**
 * Gọi máy chủ Supabase: đăng nhập ẩn danh, lưu tên, gửi điểm, đọc bảng xếp hạng.
 * Cấu trúc database: supabase/schema.sql
 */
import { supabase } from './supabase';

/** Bài nộp của 1 màn xếp hạng. Máy chủ tự kiểm tra lời giải và tự tính thời gian. */
export interface ScoreInput {
  levelId: string;
  /** Vé nhận từ start_level khi bắt đầu màn */
  token: string;
  /** Bàn cờ đã giải (81 chữ số) */
  board: string;
  mistakes: number;
  hints: number;
}

export interface SubmitResult {
  /** Thời gian tốt nhất của bạn trên màn này (giây) */
  best: number;
  /** Thời gian máy chủ tính cho lần này (giây) */
  time: number;
}

export interface LevelEntry {
  playerId: string;
  name: string;
  time: number;
  mistakes: number;
  hints: number;
}

export interface OverallEntry {
  playerId: string;
  name: string;
  levels: number;
  totalTime: number;
}

export interface MyRank {
  rank: number;
  time: number;
  total: number;
}

function client() {
  if (!supabase) throw new Error('Chưa cấu hình máy chủ (xem SUPABASE.md)');
  return supabase;
}

/** Mỗi máy là một tài khoản ẩn danh, phiên đăng nhập được lưu trong AsyncStorage. */
async function ensureUserId(): Promise<string> {
  const sb = client();
  const { data } = await sb.auth.getSession();
  if (data.session?.user) return data.session.user.id;
  const { data: signed, error } = await sb.auth.signInAnonymously();
  if (error) throw error;
  if (!signed.user) throw new Error('Không đăng nhập được');
  return signed.user.id;
}

export async function getMyUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export async function savePlayerName(name: string): Promise<void> {
  const id = await ensureUserId();
  const { error } = await client().from('players').upsert({ id, name });
  if (error) throw error;
}

/** Bắt đầu màn xếp hạng: máy chủ cấp vé và bắt đầu tính giờ. */
export async function startLevel(levelId: string): Promise<string> {
  await ensureUserId();
  const { data, error } = await client().rpc('start_level', { p_level_id: levelId });
  if (error) throw error;
  if (typeof data !== 'string') throw new Error('Máy chủ không trả về vé');
  return data;
}

/** Nộp lời giải. Máy chủ kiểm tra bàn cờ, tính giờ, chỉ giữ thời gian tốt nhất. */
export async function submitSolution(s: ScoreInput): Promise<SubmitResult> {
  await ensureUserId();
  const { data, error } = await client().rpc('submit_solution', {
    p_token: s.token,
    p_board: s.board,
    p_mistakes: s.mistakes,
    p_hints: s.hints,
  });
  if (error) throw error;
  const row = (data as { best: number; time_seconds: number }[] | null)?.[0];
  if (!row) throw new Error('Máy chủ không trả kết quả');
  return { best: Number(row.best), time: Number(row.time_seconds) };
}

type NameJoin = { name: string } | { name: string }[] | null;
const joinedName = (p: NameJoin): string =>
  (Array.isArray(p) ? p[0]?.name : p?.name) ?? '???';

interface LevelRow {
  player_id: string;
  time_seconds: number;
  mistakes: number;
  hints: number;
  players: NameJoin;
}

export async function fetchLevelLeaderboard(levelId: string, limit = 50): Promise<LevelEntry[]> {
  const { data, error } = await client()
    .from('level_scores')
    .select('player_id, time_seconds, mistakes, hints, players(name)')
    .eq('level_id', levelId)
    .order('time_seconds', { ascending: true })
    .order('updated_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as unknown as LevelRow[]).map((r) => ({
    playerId: r.player_id,
    name: joinedName(r.players),
    time: r.time_seconds,
    mistakes: r.mistakes,
    hints: r.hints,
  }));
}

export async function fetchMyLevelRank(levelId: string): Promise<MyRank | null> {
  if (!(await getMyUserId())) return null;
  const { data, error } = await client().rpc('level_rank', { p_level_id: levelId });
  if (error) throw error;
  const row = (data as { rank: number; time_seconds: number; total: number }[] | null)?.[0];
  return row ? { rank: Number(row.rank), time: row.time_seconds, total: Number(row.total) } : null;
}

interface OverallRow {
  player_id: string;
  name: string;
  levels: number;
  total_time: number;
}

/** Xếp theo số màn đã giải (nhiều trước), bằng nhau thì tổng thời gian ít hơn đứng trên. */
export async function fetchOverallLeaderboard(limit = 50): Promise<OverallEntry[]> {
  const { data, error } = await client()
    .from('leaderboard_overall')
    .select('player_id, name, levels, total_time')
    .order('levels', { ascending: false })
    .order('total_time', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as OverallRow[]).map((r) => ({
    playerId: r.player_id,
    name: r.name,
    levels: Number(r.levels),
    totalTime: Number(r.total_time),
  }));
}

export interface MasterStatus {
  unlocked: boolean;
  /** Số màn Chuyên gia mà bạn đang trong top */
  qualified: number;
  /** Số màn cần đạt (60) */
  required: number;
  /** Ngưỡng hạng (100) */
  top: number;
}

/** Tiến độ mở khóa chế độ Bậc thầy (máy chủ tự mở khóa khi đủ điều kiện). */
export async function fetchMasterStatus(): Promise<MasterStatus> {
  await ensureUserId();
  const { data, error } = await client().rpc('master_status', {});
  if (error) throw error;
  const row = (data as MasterStatus[] | null)?.[0];
  if (!row) throw new Error('Máy chủ không trả kết quả');
  return {
    unlocked: Boolean(row.unlocked),
    qualified: Number(row.qualified),
    required: Number(row.required),
    top: Number(row.top),
  };
}
