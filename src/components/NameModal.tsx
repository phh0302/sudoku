import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { cleanName, NAME_MAX, NAME_MIN } from '../store/profileStore';
import { useTheme } from '../theme';
import { Button } from './Button';

interface Props {
  visible: boolean;
  initial?: string;
  onSave: (name: string) => void;
  onCancel?: () => void;
}

/** Hộp thoại nhập tên hiển thị trên bảng xếp hạng. */
export function NameModal({ visible, initial = '', onSave, onCancel }: Props) {
  const t = useTheme();
  const [value, setValue] = useState(initial);
  const name = cleanName(value);
  const valid = name.length >= NAME_MIN;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={[styles.card, { backgroundColor: t.surface }]}>
          <Text style={[styles.title, { color: t.text }]}>Tên người chơi</Text>
          <Text style={{ color: t.textMuted, textAlign: 'center' }}>
            Tên này sẽ hiện trên bảng xếp hạng ({NAME_MIN}–{NAME_MAX} ký tự).
          </Text>
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder="VD: SudokuMaster"
            placeholderTextColor={t.textMuted}
            maxLength={NAME_MAX + 5}
            autoFocus
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={() => valid && onSave(name)}
            style={[styles.input, { color: t.text, borderColor: t.border, backgroundColor: t.bg }]}
          />
          <View style={styles.actions}>
            {onCancel ? <Button title="Để sau" onPress={onCancel} style={{ flex: 1 }} /> : null}
            <Button
              title="Lưu"
              variant="primary"
              onPress={() => valid && onSave(name)}
              style={{ flex: 1, opacity: valid ? 1 : 0.5 }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: { width: '100%', maxWidth: 380, borderRadius: 20, padding: 24, gap: 12 },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 17 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
});
