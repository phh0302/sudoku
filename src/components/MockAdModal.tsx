import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { finishMockAd, MOCK_AD_SECONDS, useMockAdStore } from '../ads/mockAd';

/** Màn hình quảng cáo giả lập (Expo Go): đếm ngược, đóng sớm = không nhận thưởng. */
export function MockAdModal() {
  const visible = useMockAdStore((s) => s.visible);
  return visible ? <MockAdContent /> : null;
}

function MockAdContent() {
  const [left, setLeft] = useState(MOCK_AD_SECONDS);
  const done = left <= 0;

  useEffect(() => {
    if (done) return;
    const id = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [left, done]);

  return (
    <Modal visible animationType="fade" onRequestClose={() => finishMockAd(done)}>
      <View style={styles.root}>
        <View style={styles.top}>
          <Text style={styles.badge}>QUẢNG CÁO GIẢ LẬP · EXPO GO</Text>
          <Pressable
            onPress={() => finishMockAd(done)}
            hitSlop={12}
            accessibilityLabel={done ? 'Đóng và nhận thưởng' : 'Đóng (không nhận thưởng)'}
            style={styles.close}
          >
            {done ? (
              <Ionicons name="close" size={26} color="#fff" />
            ) : (
              <Text style={styles.count}>{left}</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.center}>
          <Ionicons name="megaphone-outline" size={72} color="#fff" />
          <Text style={styles.title}>Đây là quảng cáo thử</Text>
          <Text style={styles.sub}>
            {done
              ? 'Đã xem xong! Bấm ✕ để nhận +1 gợi ý.'
              : `Xem thêm ${left} giây để nhận +1 gợi ý.\nĐóng sớm sẽ không được thưởng.`}
          </Text>
        </View>

        <Text style={styles.note}>
          Bản build thật sẽ hiện quảng cáo AdMob thay cho màn hình này.
        </Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1E2A44', padding: 20, paddingTop: 56 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: {
    color: '#FFD45C',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: { color: '#fff', fontSize: 18, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700' },
  sub: { color: '#C9D6F5', fontSize: 16, textAlign: 'center', lineHeight: 24 },
  note: { color: '#8E9BB8', fontSize: 12, textAlign: 'center' },
});
