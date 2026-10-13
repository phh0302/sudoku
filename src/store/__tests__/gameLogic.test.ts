import { parseGrid } from '../../core/grid';
import { formatTime } from '../../utils/format';
import {
  computeCellViews,
  createGame,
  digitCounts,
  gameReducer,
  hintsLeft,
  type GameAction,
  type GameState,
  type LogicOptions,
} from '../gameLogic';
import { DEFAULT_SETTINGS } from '../settings';
import { averageTime, emptyStats, recordGame, winRate } from '../stats';

const PUZZLE = parseGrid(
  '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
);
const SOLUTION = parseGrid(
  '534678912672195348198342567859761423426853791713924856961537284287419635345286179',
);
const ON: LogicOptions = { autoCheck: true, mistakeLimit: true };
const OFF: LogicOptions = { autoCheck: false, mistakeLimit: false };

const newGame = () => createGame({ puzzle: PUZZLE, solution: SOLUTION, difficulty: 'easy' });
const run = (s: GameState, actions: GameAction[], o = ON) =>
  actions.reduce((st, a) => gameReducer(st, a, o), s);

// Ô (0,2) index 2: đáp án 4. Ô (0,3) index 3: đáp án 6.
describe('nhập số', () => {
  it('điền đúng', () => {
    const s = run(newGame(), [{ type: 'select', index: 2 }, { type: 'input', value: 4 }]);
    expect(s.board[2]).toBe(4);
    expect(s.mistakes).toBe(0);
    expect(s.history.length).toBe(1);
  });
  it('không sửa được ô đề', () => {
    const g = newGame();
    const s = run(g, [{ type: 'select', index: 0 }, { type: 'input', value: 1 }]);
    expect(s.board).toEqual(g.board);
  });
  it('điền sai → tăng lỗi, 3 lỗi → thua', () => {
    let s = run(newGame(), [{ type: 'select', index: 2 }, { type: 'input', value: 1 }]);
    expect(s.mistakes).toBe(1);
    expect(s.status).toBe('playing');
    s = run(s, [{ type: 'input', value: 2 }, { type: 'input', value: 6 }]);
    expect(s.mistakes).toBe(3);
    expect(s.status).toBe('lost');
    // Thua rồi thì không nhập được nữa
    expect(run(s, [{ type: 'input', value: 4 }]).board[2]).toBe(6);
  });
  it('tắt giới hạn lỗi thì không thua', () => {
    const s = run(
      newGame(),
      [{ type: 'select', index: 2 }, ...[1, 2, 6, 7].map((v) => ({ type: 'input', value: v }) as GameAction)],
      { autoCheck: true, mistakeLimit: false },
    );
    expect(s.mistakes).toBe(4);
    expect(s.status).toBe('playing');
  });
  it('tắt autoCheck thì không đếm lỗi', () => {
    const s = run(newGame(), [{ type: 'select', index: 2 }, { type: 'input', value: 1 }], OFF);
    expect(s.mistakes).toBe(0);
  });
  it('không ghi đè ô đã đúng khi bật autoCheck', () => {
    const s = run(newGame(), [{ type: 'select', index: 2 }, { type: 'input', value: 4 }, { type: 'input', value: 1 }]);
    expect(s.board[2]).toBe(4);
  });
});

describe('ghi chú', () => {
  it('bật/tắt ghi chú và tự xóa ghi chú hàng xóm khi điền đúng', () => {
    let s = run(newGame(), [
      { type: 'toggleNoteMode' },
      { type: 'select', index: 3 },
      { type: 'input', value: 4 },
      { type: 'input', value: 6 },
    ]);
    expect(s.notes[3]).toBe((1 << 4) | (1 << 6));
    s = run(s, [{ type: 'input', value: 6 }]);
    expect(s.notes[3]).toBe(1 << 4);
    // điền 4 vào ô 2 (cùng hàng) → xóa note 4 ở ô 3
    s = run(s, [{ type: 'toggleNoteMode' }, { type: 'select', index: 2 }, { type: 'input', value: 4 }]);
    expect(s.notes[3]).toBe(0);
  });
});

describe('xóa, undo, gợi ý', () => {
  it('xóa số sai và undo', () => {
    let s = run(newGame(), [{ type: 'select', index: 2 }, { type: 'input', value: 1 }]);
    s = run(s, [{ type: 'erase' }]);
    expect(s.board[2]).toBe(0);
    s = run(s, [{ type: 'undo' }]);
    expect(s.board[2]).toBe(1);
    s = run(s, [{ type: 'undo' }]);
    expect(s.board[2]).toBe(0);
    expect(s.mistakes).toBe(1); // undo không xóa lỗi
    expect(run(s, [{ type: 'undo' }])).toBe(s); // hết lịch sử
  });
  it('gợi ý điền ô đang chọn, hoặc ô trống đầu tiên', () => {
    let s = run(newGame(), [{ type: 'select', index: 3 }, { type: 'hint' }]);
    expect(s.board[3]).toBe(6);
    expect(s.hintsUsed).toBe(1);
    s = run(s, [{ type: 'select', index: 0 }, { type: 'hint' }]);
    expect(s.board[2]).toBe(4);
    expect(s.selected).toBe(2);
    expect(s.mistakes).toBe(0);
  });
  it('thắng khi điền đủ, có hiệu ứng flash khi hoàn thành hàng', () => {
    let s = newGame();
    const empties = PUZZLE.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
    for (const i of empties.slice(0, -1)) s = run(s, [{ type: 'select', index: i }, { type: 'input', value: SOLUTION[i] }]);
    expect(s.status).toBe('playing');
    expect(s.flashId).toBeGreaterThan(0);
    const last = empties[empties.length - 1];
    s = run(s, [{ type: 'select', index: last }, { type: 'input', value: SOLUTION[last] }]);
    expect(s.status).toBe('won');
    expect(digitCounts(s).slice(1)).toEqual(new Array(9).fill(9));
  });
});

describe('giới hạn gợi ý', () => {
  it('chỉ dùng được tối đa 3 gợi ý mỗi ván', () => {
    let s = newGame();
    for (let k = 0; k < 5; k++) s = run(s, [{ type: 'select', index: 0 }, { type: 'hint' }]);
    expect(s.hintsUsed).toBe(3);
    expect(hintsLeft(s)).toBe(0);
    const filled = s.board.filter((v, i) => v && !PUZZLE[i]).length;
    expect(filled).toBe(3);
  });
});

describe('màn xếp hạng', () => {
  it('sync đặt thời gian tuyệt đối, dừng khi kết thúc', () => {
    let s = createGame({ puzzle: PUZZLE, solution: SOLUTION, difficulty: 'easy' }, { mode: 'level', levelId: 'easy-1' });
    expect(s.startedAtMs).toBeGreaterThan(0);
    s = run(s, [{ type: 'sync', elapsed: 125 }]);
    expect(s.elapsed).toBe(125);
    expect(run({ ...s, status: 'won' }, [{ type: 'sync', elapsed: 999 }]).elapsed).toBe(125);
    expect(newGame().startedAtMs).toBeUndefined();
  });
});

describe('khác', () => {
  it('tick chỉ chạy khi đang chơi; di chuyển vòng quanh', () => {
    let s = run(newGame(), [{ type: 'tick', seconds: 5 }]);
    expect(s.elapsed).toBe(5);
    s = run(s, [{ type: 'select', index: 0 }, { type: 'move', dir: 'up' }]);
    expect(s.selected).toBe(72);
    s = run(s, [{ type: 'move', dir: 'left' }]);
    expect(s.selected).toBe(80);
  });
  it('computeCellViews', () => {
    const s = run(newGame(), [{ type: 'select', index: 2 }, { type: 'input', value: 1 }]);
    const v = computeCellViews(s, DEFAULT_SETTINGS);
    expect(v[2].selected).toBe(true);
    expect(v[2].error).toBe(true);
    expect(v[0].related).toBe(true); // cùng hàng
    expect(v[80].related).toBe(false);
    expect(v[0].given).toBe(true);
    const off = computeCellViews(s, { ...DEFAULT_SETTINGS, autoCheck: false });
    expect(off[2].error).toBe(false); // số 1 không trùng hàng/cột/khối
  });
  it('thống kê', () => {
    let st = emptyStats();
    st = recordGame(st, 'easy', true, 100);
    st = recordGame(st, 'easy', true, 80);
    st = recordGame(st, 'easy', false, 50);
    expect(st.easy.played).toBe(3);
    expect(st.easy.bestTime).toBe(80);
    expect(st.easy.bestStreak).toBe(2);
    expect(st.easy.currentStreak).toBe(0);
    expect(averageTime(st.easy)).toBe(90);
    expect(winRate(st.easy)).toBeCloseTo(2 / 3);
    expect(st.hard.played).toBe(0);
  });
  it('formatTime', () => {
    expect(formatTime(75)).toBe('01:15');
    expect(formatTime(3725)).toBe('1:02:05');
    expect(formatTime(null)).toBe('--:--');
  });
});
