/**
 * Logic trạng thái ván chơi – thuần TypeScript (không phụ thuộc React),
 * nên test được bằng Jest và tái sử dụng cho Zustand store.
 */
import { BOXES, COLS, PEERS, ROWS, boxOf, colOf, rowOf } from '../core/grid';
import type { Difficulty, Grid, Puzzle } from '../core/types';
import { MAX_AD_HINTS, MAX_HINTS, MAX_MISTAKES, type Settings } from './settings';

export type GameStatus = 'playing' | 'won' | 'lost';
export type GameMode = 'classic' | 'daily' | 'level';

interface Snapshot {
  board: Grid;
  notes: number[];
}

export interface GameState {
  id: string;
  mode: GameMode;
  dailyKey?: string;
  /** "easy-12" khi chơi theo màn */
  levelId?: string;
  /** Vé xếp hạng từ máy chủ: undefined = đang lấy, null = không lấy được (ván không tính xếp hạng) */
  levelToken?: string | null;
  /** Thời điểm bắt đầu (ms) – màn xếp hạng tính giờ theo thời gian thực, giống máy chủ */
  startedAtMs?: number;
  difficulty: Difficulty;
  puzzle: Grid; // đề gốc (ô ≠ 0 là ô cố định)
  solution: Grid;
  board: Grid; // trạng thái hiện tại
  notes: number[]; // bitmask ghi chú mỗi ô (bit 1..9)
  selected: number | null;
  noteMode: boolean;
  mistakes: number;
  hintsUsed: number;
  /** Gợi ý thưởng nhận được nhờ xem quảng cáo (ván cũ đã lưu có thể thiếu → coi là 0) */
  bonusHints?: number;
  history: Snapshot[];
  elapsed: number; // giây
  status: GameStatus;
  /** Các ô thuộc hàng/cột/khối vừa hoàn thành – dùng cho animation */
  flash: number[];
  flashId: number;
}

export type GameAction =
  | { type: 'select'; index: number }
  | { type: 'move'; dir: 'up' | 'down' | 'left' | 'right' }
  | { type: 'input'; value: number }
  | { type: 'erase' }
  | { type: 'toggleNoteMode' }
  | { type: 'undo' }
  | { type: 'hint' }
  /** Cộng 1 gợi ý sau khi xem xong quảng cáo có thưởng */
  | { type: 'grantBonusHint' }
  | { type: 'tick'; seconds: number }
  /** Đặt thời gian tuyệt đối (màn xếp hạng: tính từ startedAtMs) */
  | { type: 'sync'; elapsed: number };

export type LogicOptions = Pick<Settings, 'autoCheck' | 'mistakeLimit'>;

const HISTORY_LIMIT = 300;

export function createGame(
  p: Puzzle,
  opts: { mode?: GameMode; dailyKey?: string; levelId?: string; id?: string } = {},
): GameState {
  return {
    id: opts.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    mode: opts.mode ?? 'classic',
    dailyKey: opts.dailyKey,
    levelId: opts.levelId,
    startedAtMs: opts.levelId ? Date.now() : undefined,
    difficulty: p.difficulty,
    puzzle: p.puzzle.slice(),
    solution: p.solution.slice(),
    board: p.puzzle.slice(),
    notes: new Array(81).fill(0),
    selected: null,
    noteMode: false,
    mistakes: 0,
    hintsUsed: 0,
    bonusHints: 0,
    history: [],
    elapsed: 0,
    status: 'playing',
    flash: [],
    flashId: 0,
  };
}

const isGiven = (s: GameState, i: number) => s.puzzle[i] !== 0;
const isSolved = (s: GameState) => s.board.every((v, i) => v === s.solution[i]);

function pushHistory(s: GameState): Snapshot[] {
  const h = [...s.history, { board: s.board, notes: s.notes }];
  return h.length > HISTORY_LIMIT ? h.slice(h.length - HISTORY_LIMIT) : h;
}

/** Xóa ghi chú `value` khỏi các ô hàng xóm của `index`. */
function clearPeerNotes(notes: number[], index: number, value: number): number[] {
  const out = notes.slice();
  const bit = 1 << value;
  for (const p of PEERS[index]) out[p] &= ~bit;
  out[index] = 0;
  return out;
}

/** Các đơn vị (hàng/cột/khối) chứa ô `index` vừa được điền đúng hết. */
function completedUnits(board: Grid, solution: Grid, index: number): number[] {
  const units = [ROWS[rowOf(index)], COLS[colOf(index)], BOXES[boxOf(index)]];
  const cells = new Set<number>();
  for (const u of units) if (u.every((i) => board[i] === solution[i])) u.forEach((i) => cells.add(i));
  return [...cells];
}

/** Đặt giá trị đúng/sai vào ô và tính lại trạng thái. */
function placeValue(
  s: GameState,
  index: number,
  value: number,
  opts: LogicOptions,
  isHint = false,
): GameState {
  const board = s.board.slice();
  board[index] = value;
  const correct = value === s.solution[index];

  let notes = s.notes.slice();
  notes[index] = 0;
  if (correct || !opts.autoCheck) notes = clearPeerNotes(notes, index, value);

  let mistakes = s.mistakes;
  let status: GameStatus = s.status;
  if (opts.autoCheck && !correct && !isHint) {
    mistakes += 1;
    if (opts.mistakeLimit && mistakes >= MAX_MISTAKES) status = 'lost';
  }

  const next: GameState = {
    ...s,
    board,
    notes,
    mistakes,
    status,
    history: pushHistory(s),
    hintsUsed: s.hintsUsed + (isHint ? 1 : 0),
  };
  if (isSolved(next)) next.status = 'won';

  if (correct) {
    const flash = completedUnits(board, s.solution, index);
    if (flash.length) {
      next.flash = flash;
      next.flashId = s.flashId + 1;
    }
  }
  return next;
}

export function gameReducer(s: GameState, a: GameAction, opts: LogicOptions): GameState {
  switch (a.type) {
    case 'select':
      if (a.index < 0 || a.index > 80) return s;
      return { ...s, selected: a.index };

    case 'move': {
      const cur = s.selected ?? 40;
      let r = rowOf(cur);
      let c = colOf(cur);
      if (a.dir === 'up') r = (r + 8) % 9;
      if (a.dir === 'down') r = (r + 1) % 9;
      if (a.dir === 'left') c = (c + 8) % 9;
      if (a.dir === 'right') c = (c + 1) % 9;
      return { ...s, selected: r * 9 + c };
    }

    case 'toggleNoteMode':
      return { ...s, noteMode: !s.noteMode };

    case 'tick':
      return s.status === 'playing' ? { ...s, elapsed: s.elapsed + a.seconds } : s;

    case 'sync':
      return s.status === 'playing' && a.elapsed !== s.elapsed ? { ...s, elapsed: Math.max(0, a.elapsed) } : s;

    case 'undo': {
      if (s.status !== 'playing' || s.history.length === 0) return s;
      const last = s.history[s.history.length - 1];
      return { ...s, board: last.board, notes: last.notes, history: s.history.slice(0, -1) };
    }

    case 'input': {
      const i = s.selected;
      if (s.status !== 'playing' || i === null || isGiven(s, i)) return s;
      if (a.value < 1 || a.value > 9) return s;

      if (s.noteMode) {
        if (s.board[i] !== 0) return s;
        const notes = s.notes.slice();
        notes[i] ^= 1 << a.value;
        return { ...s, notes, history: pushHistory(s) };
      }
      if (s.board[i] === a.value) return s;
      // Ô đã điền đúng thì không cho ghi đè khi bật autoCheck
      if (opts.autoCheck && s.board[i] === s.solution[i]) return s;
      return placeValue(s, i, a.value, opts);
    }

    case 'erase': {
      const i = s.selected;
      if (s.status !== 'playing' || i === null || isGiven(s, i)) return s;
      if (s.board[i] === 0 && s.notes[i] === 0) return s;
      if (opts.autoCheck && s.board[i] !== 0 && s.board[i] === s.solution[i]) return s;
      const board = s.board.slice();
      const notes = s.notes.slice();
      board[i] = 0;
      notes[i] = 0;
      return { ...s, board, notes, history: pushHistory(s) };
    }

    case 'grantBonusHint':
      if (!canEarnBonusHint(s)) return s;
      return { ...s, bonusHints: (s.bonusHints ?? 0) + 1 };

    case 'hint': {
      if (s.status !== 'playing' || s.hintsUsed >= hintLimit(s)) return s;
      const wrongOrEmpty = (i: number) => s.board[i] !== s.solution[i];
      let target = s.selected !== null && wrongOrEmpty(s.selected) ? s.selected : -1;
      if (target === -1) target = s.board.findIndex((_, i) => wrongOrEmpty(i));
      if (target === -1) return s;
      return { ...placeValue(s, target, s.solution[target], opts, true), selected: target };
    }
  }
}

// ---------- Selectors cho UI ----------

export interface CellView {
  value: number;
  notes: number;
  given: boolean;
  selected: boolean;
  related: boolean; // cùng hàng/cột/khối với ô chọn
  sameValue: boolean;
  error: boolean;
}

/** Tính trạng thái hiển thị của cả 81 ô một lần. */
export function computeCellViews(
  s: GameState,
  settings: Pick<Settings, 'highlightRelated' | 'highlightSame' | 'autoCheck'>,
): CellView[] {
  const sel = s.selected;
  const selValue = sel !== null ? s.board[sel] : 0;
  const views: CellView[] = new Array(81);

  // Lỗi: autoCheck → sai so với lời giải; ngược lại → trùng hàng/cột/khối
  const error = new Array<boolean>(81).fill(false);
  for (let i = 0; i < 81; i++) {
    const v = s.board[i];
    if (!v || isGiven(s, i)) continue;
    if (settings.autoCheck) error[i] = v !== s.solution[i];
    else error[i] = PEERS[i].some((p) => s.board[p] === v);
  }

  for (let i = 0; i < 81; i++) {
    const related =
      settings.highlightRelated &&
      sel !== null &&
      i !== sel &&
      (rowOf(i) === rowOf(sel) || colOf(i) === colOf(sel) || boxOf(i) === boxOf(sel));
    views[i] = {
      value: s.board[i],
      notes: s.notes[i],
      given: isGiven(s, i),
      selected: i === sel,
      related,
      sameValue: settings.highlightSame && selValue !== 0 && i !== sel && s.board[i] === selValue,
      error: error[i],
    };
  }
  return views;
}

/** Số gợi ý còn lại trong ván. */
/** Tổng số gợi ý được dùng trong ván (3 + gợi ý thưởng). */
export const hintLimit = (s: GameState): number => MAX_HINTS + (s.bonusHints ?? 0);

export const hintsLeft = (s: GameState): number => Math.max(0, hintLimit(s) - s.hintsUsed);

/**
 * Được xem quảng cáo để nhận thêm gợi ý không:
 * chỉ ván ngẫu nhiên / thử thách hằng ngày (màn xếp hạng giữ tối đa 3 để công bằng),
 * đang chơi, đã hết gợi ý, chưa nhận đủ MAX_AD_HINTS.
 */
export const canEarnBonusHint = (s: GameState): boolean =>
  s.status === 'playing' &&
  s.mode !== 'level' &&
  hintsLeft(s) === 0 &&
  (s.bonusHints ?? 0) < MAX_AD_HINTS;

/** Số lần mỗi chữ số đã được điền đúng (index 1..9) – để ẩn số đã đủ 9. */
export function digitCounts(s: GameState): number[] {
  const counts = new Array(10).fill(0);
  s.board.forEach((v, i) => {
    if (v && v === s.solution[i]) counts[v]++;
  });
  return counts;
}
