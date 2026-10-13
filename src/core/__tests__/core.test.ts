import { CLUE_TARGET, generateFullGrid, generatePuzzle } from '../generator';
import { getLevelPuzzle, LEVEL_COUNT, levelId, parseLevelId } from '../levels';
import { BOXES, COLS, countClues, parseGrid, PEERS, ROWS } from '../grid';
import { solvableByIntermediate, solvableBySingles } from '../logical';
import { dateKey, getDailyPuzzle, getPuzzle } from '../puzzles';
import { mulberry32, shuffle } from '../random';
import { countSolutions, solve } from '../solver';
import { transformPuzzle } from '../transform';
import { DIFFICULTIES } from '../types';
import { findConflicts, isComplete, isValidGrid, isValidMove } from '../validator';

// Đề kinh điển (Wikipedia) và lời giải
const PUZZLE =
  '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
const SOLUTION =
  '534678912672195348198342567859761423426853791713924856961537284287419635345286179';
// Đề "khó nhất thế giới" của Arto Inkala
const HARD =
  '800000000003600000070090200050007000000045700000100030001000068068000090000000400';

describe('grid', () => {
  it('có 27 đơn vị 9 ô và mỗi ô 20 hàng xóm', () => {
    for (const u of [...ROWS, ...COLS, ...BOXES]) expect(new Set(u).size).toBe(9);
    for (const p of PEERS) expect(p.length).toBe(20);
  });
  it('parseGrid nhận cả "." và "0"', () => {
    expect(parseGrid('.'.repeat(81))).toEqual(new Array(81).fill(0));
    expect(() => parseGrid('123')).toThrow();
  });
});

describe('validator', () => {
  const g = parseGrid(PUZZLE);
  it('isValidMove phát hiện trùng hàng/cột/khối', () => {
    expect(isValidMove(g, 2, 4)).toBe(true); // ô (0,2) = 4 trong lời giải
    expect(isValidMove(g, 2, 5)).toBe(false); // trùng hàng
    expect(isValidMove(g, 2, 8)).toBe(false); // trùng khối
    expect(isValidMove(g, 2, 0)).toBe(false);
  });
  it('findConflicts / isComplete', () => {
    expect(isValidGrid(g)).toBe(true);
    const bad = g.slice();
    bad[2] = 5;
    const c = findConflicts(bad);
    expect(c[2]).toBe(true);
    expect(c[0]).toBe(true);
    expect(isComplete(parseGrid(SOLUTION))).toBe(true);
    expect(isComplete(g)).toBe(false);
  });
});

describe('solver', () => {
  it('giải đúng đề kinh điển', () => {
    expect(solve(parseGrid(PUZZLE))?.join('')).toBe(SOLUTION);
  });
  it('giải được đề rất khó', () => {
    const s = solve(parseGrid(HARD));
    expect(s && isComplete(s)).toBe(true);
  });
  it('đếm nghiệm', () => {
    expect(countSolutions(parseGrid(PUZZLE))).toBe(1);
    expect(countSolutions(new Array(81).fill(0), 2)).toBe(2);
    const contradiction = parseGrid(PUZZLE);
    contradiction[2] = 5;
    expect(countSolutions(contradiction)).toBe(0);
    expect(solve(contradiction)).toBeNull();
  });
});

describe('logical', () => {
  it('bộ giải trung cấp: giải được đề dễ, không giải được đề Inkala', () => {
    expect(solvableByIntermediate(parseGrid(PUZZLE))).toBe(true);
    expect(solvableByIntermediate(parseGrid(HARD))).toBe(false);
  });
  it('mọi màn Bậc thầy đều khó hơn mức trung cấp', () => {
    for (let n = 1; n <= LEVEL_COUNT; n++) {
      const p = getLevelPuzzle('master', n);
      expect(solvableByIntermediate(p.puzzle)).toBe(false);
      expect(countClues(p.puzzle)).toBeLessThanOrEqual(24);
    }
  });
  it('đề dễ giải được bằng single, đề rất khó thì không', () => {
    expect(solvableBySingles(parseGrid(PUZZLE))).toBe(true);
    expect(solvableBySingles(parseGrid(HARD))).toBe(false);
  });
});

describe('generator', () => {
  it('sinh lưới đầy đủ hợp lệ', () => {
    for (let i = 0; i < 5; i++) expect(isComplete(generateFullGrid())).toBe(true);
  });
  for (const d of DIFFICULTIES) {
    it(`đề ${d}: duy nhất 1 nghiệm, khớp lời giải, đúng số gợi ý`, () => {
      const p = generatePuzzle(d, mulberry32(42));
      expect(countSolutions(p.puzzle)).toBe(1);
      expect(solve(p.puzzle)).toEqual(p.solution);
      p.puzzle.forEach((v, i) => v && expect(v).toBe(p.solution[i]));
      expect(countClues(p.puzzle)).toBeLessThanOrEqual(CLUE_TARGET[d] + 3);
      if (d === 'easy' || d === 'medium') expect(solvableBySingles(p.puzzle)).toBe(true);
      if (d === 'expert') expect(solvableBySingles(p.puzzle)).toBe(false);
      if (d === 'master') expect(solvableByIntermediate(p.puzzle)).toBe(false);
    });
  }
});

describe('transform & kho đề', () => {
  it('biến đổi giữ tính hợp lệ và nghiệm duy nhất', () => {
    const base = { puzzle: parseGrid(PUZZLE), solution: parseGrid(SOLUTION) };
    for (let i = 0; i < 20; i++) {
      const t = transformPuzzle(base, mulberry32(i));
      expect(isComplete(t.solution)).toBe(true);
      expect(countClues(t.puzzle)).toBe(countClues(base.puzzle));
      expect(solve(t.puzzle)).toEqual(t.solution);
    }
  });
  it('getPuzzle trả đề hợp lệ cho mọi độ khó', () => {
    for (const d of DIFFICULTIES) {
      const p = getPuzzle(d);
      expect(p.difficulty).toBe(d);
      expect(countSolutions(p.puzzle)).toBe(1);
      expect(solve(p.puzzle)).toEqual(p.solution);
    }
  });
  it('daily: cùng ngày cùng đề, khác ngày khác đề', () => {
    const a = getDailyPuzzle(new Date(2026, 9, 12));
    const b = getDailyPuzzle(new Date(2026, 9, 12, 23, 59));
    const c = getDailyPuzzle(new Date(2026, 9, 13));
    expect(a.key).toBe('2026-10-12');
    expect(a.puzzle).toEqual(b.puzzle);
    expect(a.puzzle).not.toEqual(c.puzzle);
    expect(dateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
  it('shuffle giữ nguyên phần tử', () => {
    expect(shuffle([1, 2, 3, 4, 5]).sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('levels', () => {
  it('mỗi độ khó có 60 màn hợp lệ, nghiệm duy nhất, không trùng nhau', () => {
    const seen = new Set<string>();
    for (const d of DIFFICULTIES) {
      for (let n = 1; n <= LEVEL_COUNT; n++) {
        const p = getLevelPuzzle(d, n);
        expect(p.difficulty).toBe(d);
        expect(countSolutions(p.puzzle)).toBe(1);
        const key = p.puzzle.join('');
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    }
    expect(seen.size).toBe(300);
  });
  it('màn cố định: gọi lại vẫn ra đúng đề cũ', () => {
    expect(getLevelPuzzle('hard', 7).puzzle).toEqual(getLevelPuzzle('hard', 7).puzzle);
  });
  it('levelId / parseLevelId', () => {
    expect(levelId('expert', 60)).toBe('expert-60');
    expect(parseLevelId('medium-12')).toEqual({ difficulty: 'medium', n: 12 });
    expect(parseLevelId('medium-61')).toBeNull();
    expect(parseLevelId('abc-1')).toBeNull();
    expect(() => getLevelPuzzle('easy', 61)).toThrow();
  });
});
