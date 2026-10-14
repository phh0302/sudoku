import type { Difficulty } from '../core/types';

export type Route =
  | { name: 'home' }
  | { name: 'game' }
  | { name: 'settings' }
  | { name: 'stats' }
  | { name: 'levels'; difficulty: Difficulty }
  | { name: 'leaderboard'; levelId?: string };

export interface ScreenProps {
  /** Mở màn hình mới (route 'home' sẽ xóa lịch sử điều hướng) */
  navigate: (route: Route) => void;
  /** Quay lại màn hình trước */
  goBack: () => void;
}
