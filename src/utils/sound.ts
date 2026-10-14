import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

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

/**
 * Cấu hình phiên âm thanh 1 lần trước khi phát:
 * - mixWithOthers: phát chồng lên nhạc của app khác (Spotify, YouTube…) mà KHÔNG làm ngắt/nhỏ nhạc.
 *   Android: không xin audio focus. iOS: dùng category "ambient" + mix.
 * - playsInSilentMode: false → tôn trọng nút gạt im lặng của iPhone (hiệu ứng game không kêu khi tắt tiếng).
 */
let audioModeReady: Promise<void> | null = null;
function ensureAudioMode(): Promise<void> {
  if (!audioModeReady) {
    audioModeReady = setAudioModeAsync({
      interruptionMode: 'mixWithOthers',
      playsInSilentMode: false,
      shouldPlayInBackground: false,
      allowsRecording: false,
    }).catch(() => {});
  }
  return audioModeReady;
}

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
  void ensureAudioMode().then(() => {
    try {
      const p = getPlayer(kind);
      Promise.resolve(p.seekTo(0))
        .catch(() => {})
        .finally(() => p.play());
    } catch {
      // bỏ qua
    }
  });
}

// Cấu hình ngay khi app khởi động, trước cả lần phát đầu tiên
void ensureAudioMode();
