import { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { computeCellViews, type GameState } from '../store/gameLogic';
import { useGameStore } from '../store/gameStore';
import { useSettingsStore } from '../store/settingsStore';
import { useTheme } from '../theme';
import { Cell } from './Cell';

interface Props {
  game: GameState;
  size: number; // chiều rộng toàn bàn cờ (px)
}

const BORDER = 2;

export function Board({ game, size }: Props) {
  const t = useTheme();
  const settings = useSettingsStore((s) => s.settings);
  const dispatch = useGameStore((s) => s.dispatch);

  const cellSize = Math.floor((size - BORDER * 2) / 9);
  const views = useMemo(() => computeCellViews(game, settings), [game, settings]);
  const flashSet = useMemo(() => new Set(game.flash), [game.flash]);

  const onPress = useCallback((index: number) => dispatch({ type: 'select', index }), [dispatch]);

  return (
    <View
      style={[
        styles.board,
        { width: cellSize * 9 + BORDER * 2, borderColor: t.borderStrong, backgroundColor: t.surface },
      ]}
    >
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((r) => (
        <View key={r} style={styles.row}>
          {views.slice(r * 9, r * 9 + 9).map((v, c) => {
            const i = r * 9 + c;
            return (
              <Cell
                key={i}
                index={i}
                size={cellSize}
                value={v.value}
                notes={v.notes}
                given={v.given}
                selected={v.selected}
                related={v.related}
                sameValue={v.sameValue}
                error={v.error}
                flashKey={flashSet.has(i) ? game.flashId : 0}
                theme={t}
                onPress={onPress}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    borderWidth: BORDER,
    borderRadius: 6,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  row: { flexDirection: 'row' },
});
