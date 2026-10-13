import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

/** Bộ lưu trữ JSON dùng chung cho các Zustand store (lưu vào AsyncStorage của máy). */
export const appStorage = createJSONStorage(() => AsyncStorage);
