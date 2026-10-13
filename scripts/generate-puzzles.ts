/**
 * Sinh sẵn kho đề -> assets/puzzles.json
 * Chạy: npm run gen:puzzles  (hoặc: npx tsx scripts/generate-puzzles.ts [số_đề_mỗi_mức])
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { generatePuzzle } from '../src/core/generator';
import { countClues, gridToString } from '../src/core/grid';
import { DIFFICULTIES, type Difficulty } from '../src/core/types';

const PER_LEVEL = Number(process.argv[2] ?? 60);
const MAX_CLUES: Record<Difficulty, number> = { easy: 41, medium: 34, hard: 29, expert: 26, master: 24 };

const bank: Record<string, string[]> = {};
for (const d of DIFFICULTIES) {
  const list = new Set<string>();
  const t0 = Date.now();
  while (list.size < PER_LEVEL) {
    const p = generatePuzzle(d);
    if (countClues(p.puzzle) <= MAX_CLUES[d]) list.add(gridToString(p.puzzle));
  }
  bank[d] = [...list];
  console.log(`${d}: ${list.size} đề trong ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

writeFileSync(join(__dirname, '..', 'assets', 'puzzles.json'), JSON.stringify(bank, null, 1));
console.log('Đã ghi assets/puzzles.json');
