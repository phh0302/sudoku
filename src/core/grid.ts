import type { Grid } from './types';

export const CELLS = 81;

export const rowOf = (i: number): number => Math.floor(i / 9);
export const colOf = (i: number): number => i % 9;
export const boxOf = (i: number): number => Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3);
export const indexOf = (row: number, col: number): number => row * 9 + col;

/** Chỉ số các ô thuộc từng đơn vị (hàng, cột, khối). */
export const ROWS: number[][] = Array.from({ length: 9 }, (_, r) =>
  Array.from({ length: 9 }, (_, c) => indexOf(r, c)),
);
export const COLS: number[][] = Array.from({ length: 9 }, (_, c) =>
  Array.from({ length: 9 }, (_, r) => indexOf(r, c)),
);
export const BOXES: number[][] = Array.from({ length: 9 }, (_, b) => {
  const r0 = Math.floor(b / 3) * 3;
  const c0 = (b % 3) * 3;
  const cells: number[] = [];
  for (let r = r0; r < r0 + 3; r++) for (let c = c0; c < c0 + 3; c++) cells.push(indexOf(r, c));
  return cells;
});
export const UNITS: number[][] = [...ROWS, ...COLS, ...BOXES];

/** 20 ô "hàng xóm" của mỗi ô: cùng hàng, cột hoặc khối (không gồm chính nó). */
export const PEERS: number[][] = Array.from({ length: CELLS }, (_, i) => {
  const set = new Set<number>([...ROWS[rowOf(i)], ...COLS[colOf(i)], ...BOXES[boxOf(i)]]);
  set.delete(i);
  return [...set];
});

export const emptyGrid = (): Grid => new Array(CELLS).fill(0);

/** Đọc chuỗi 81 ký tự ('0' hoặc '.' là ô trống). */
export function parseGrid(s: string): Grid {
  const clean = s.replace(/\s+/g, '');
  if (clean.length !== CELLS) throw new Error(`Chuỗi phải có 81 ký tự, nhận ${clean.length}`);
  return [...clean].map((ch) => {
    if (ch === '.' || ch === '0') return 0;
    const v = Number(ch);
    if (!Number.isInteger(v) || v < 1 || v > 9) throw new Error(`Ký tự không hợp lệ: ${ch}`);
    return v;
  });
}

export const gridToString = (g: Grid): string => g.join('');

export const countClues = (g: Grid): number => g.reduce((n, v) => n + (v ? 1 : 0), 0);
