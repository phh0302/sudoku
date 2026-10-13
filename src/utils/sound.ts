import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

export type SoundKind = 'tap' | 'error' | 'success' | 'win' | 'lose';

const SOURCES: Record<SoundKind, number> = {
  tap: require('../../assets/sounds/tap.wav'),
  error: require('../../assets/sounds/error.wav'),
  success: require('../../assets/sounds/success.wav'),
  win: require('../../assets/sounds/win.wav'),
  lose: require('../../assets/sounds/lose.wav'),
};

const VOLUME: Record<SoundKind, number> = { tap: 0.35, error: 0.6, success: 0.6, win: 0.8, lose: 0.7 };

const players: Partial<Record<SoundKind, AudioPlayer>> = {};

function getPlayer(kind: SoundKind): AudioPlayer {
  let p = players[kind];
  if (!p) {
    p = createAudioPlayer(SOURCES[kind]);
    p.volume = VOLUME[kind];
    players[kind] = p;
  }
  return p;
}

/** Phát hiệu ứng âm thanh (lỗi được bỏ qua để không ảnh hưởng game). */
export function playSound(kind: SoundKind): void {
  try {
    const p = getPlayer(kind);
    Promise.resolve(p.seekTo(0))
      .catch(() => {})
      .finally(() => p.play());
  } catch {
    // bỏ qua
  }
}
