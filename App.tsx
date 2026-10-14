import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { GameScreen } from './src/screens/GameScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { LeaderboardScreen } from './src/screens/LeaderboardScreen';
import { LevelSelectScreen } from './src/screens/LevelSelectScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import type { Route, ScreenProps } from './src/screens/types';
import { useGameStore } from './src/store/gameStore';
import { useProfileStore } from './src/store/profileStore';
import { useSettingsStore } from './src/store/settingsStore';
import { useStatsStore } from './src/store/statsStore';
import { useTheme } from './src/theme';

const PERSISTED = [useGameStore, useSettingsStore, useStatsStore, useProfileStore];
const allHydrated = () => PERSISTED.every((s) => s.persist.hasHydrated());

/** Chờ dữ liệu đã lưu (ván dở, cài đặt, thống kê, hồ sơ) được nạp từ bộ nhớ máy. */
function subscribeHydration(onChange: () => void) {
  const unsubs = PERSISTED.map((s) => s.persist.onFinishHydration(onChange));
  return () => unsubs.forEach((u) => u());
}
function useHydrated() {
  return useSyncExternalStore(subscribeHydration, allHydrated, allHydrated);
}

function Root() {
  const t = useTheme();
  const ready = useHydrated();
  const [stack, setStack] = useState<Route[]>([{ name: 'home' }]);
  const route = stack[stack.length - 1];

  const navigate = useCallback((r: Route) => {
    setStack((s) => (r.name === 'home' ? [r] : [...s, r]));
  }, []);
  const goBack = useCallback(() => {
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  }, []);

  // Gửi lại kết quả còn chờ khi mở app
  useEffect(() => {
    if (!ready) return;
    const profile = useProfileStore.getState();
    void profile.flush().then(() => profile.refreshMaster());
  }, [ready]);

  // Nút Back của Android
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length <= 1) return false;
      goBack();
      return true;
    });
    return () => sub.remove();
  }, [stack.length, goBack]);

  const props: ScreenProps = { navigate, goBack };

  let screen;
  switch (route.name) {
    case 'game':
      screen = <GameScreen {...props} />;
      break;
    case 'levels':
      screen = <LevelSelectScreen {...props} difficulty={route.difficulty} />;
      break;
    case 'leaderboard':
      screen = <LeaderboardScreen {...props} levelId={route.levelId} />;
      break;
    case 'settings':
      screen = <SettingsScreen {...props} />;
      break;
    case 'stats':
      screen = <StatsScreen {...props} />;
      break;
    default:
      screen = <HomeScreen {...props} />;
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.bg }]}>
      <StatusBar style={t.dark ? 'light' : 'dark'} />
      {/* Giới hạn bề ngang để chơi trên máy tính (web) / máy tính bảng không bị kéo giãn */}
      <View style={styles.frame}>
        {ready ? (
          screen
        ) : (
          <View style={styles.center}>
            <ActivityIndicator color={t.primary} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Root />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  frame: { flex: 1, width: '100%', maxWidth: 640, alignSelf: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
