import { Alert, Platform } from 'react-native';

/** window.alert / window.confirm khi chạy trên trình duyệt (Alert của React Native không hiện trên web). */
const browser = globalThis as unknown as {
  alert?: (msg: string) => void;
  confirm?: (msg: string) => boolean;
};

/** Hộp thông báo đơn giản, chạy được cả điện thoại lẫn web. */
export function showInfo(title: string, message: string): void {
  if (Platform.OS === 'web') {
    browser.alert?.(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

/** Hộp xác nhận (Hủy / nút hành động), chạy được cả điện thoại lẫn web. */
export function confirmAction(
  title: string,
  message: string,
  confirmText: string,
  onConfirm: () => void,
): void {
  if (Platform.OS === 'web') {
    if (browser.confirm?.(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Hủy', style: 'cancel' },
    { text: confirmText, style: 'destructive', onPress: onConfirm },
  ]);
}
