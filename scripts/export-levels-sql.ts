/**
 * In ra câu INSERT dữ liệu 240 màn (đề + lời giải) cho supabase/anticheat.sql.
 * Chỉ cần khi sửa assets/levels.json:  npx tsx scripts/export-levels-sql.ts > levels.sql
 */
import levels from '../assets/levels.json';
import { parseGrid } from '../src/core/grid';
import { solve } from '../src/core/solver';

const rows: string[] = [];
for (const [d, list] of Object.entries(levels as Record<string, string[]>)) {
  list.forEach((p, i) => {
    const sol = solve(parseGrid(p));
    if (!sol) throw new Error(`Màn ${d}-${i + 1} không có lời giải`);
    rows.push(`  ('${d}-${i + 1}', '${p}', '${sol.join('')}')`);
  });
}
console.log('insert into private.levels (level_id, puzzle, solution) values');
console.log(rows.join(',\n'));
console.log('on conflict (level_id) do update set puzzle = excluded.puzzle, solution = excluded.solution;');
