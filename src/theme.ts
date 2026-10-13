import { useColorScheme } from 'react-native';

import { useSettingsStore } from './store/settingsStore';

export interface Theme {
  dark: boolean;
  bg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  border: string;
  borderStrong: string;
  primary: string;
  primaryText: string;
  given: string;
  userValue: string;
  error: string;
  errorBg: string;
  cellSelected: string;
  cellRelated: string;
  cellSame: string;
  flash: string;
  note: string;
}

const light: Theme = {
  dark: false,
  bg: '#F4F6FB',
  surface: '#FFFFFF',
  surfaceAlt: '#E9EDF5',
  text: '#1B2333',
  textMuted: '#6B7486',
  border: '#C9D0DE',
  borderStrong: '#3A4357',
  primary: '#3B6FE0',
  primaryText: '#FFFFFF',
  given: '#1B2333',
  userValue: '#2F62D6',
  error: '#D63B3B',
  errorBg: '#FBE3E3',
  cellSelected: '#BBD0FB',
  cellRelated: '#E4EBF9',
  cellSame: '#C9D8F7',
  flash: '#FFE59A',
  note: '#5B6578',
};

const dark: Theme = {
  dark: true,
  bg: '#10141C',
  surface: '#1A202B',
  surfaceAlt: '#252D3B',
  text: '#E6EAF2',
  textMuted: '#8E97A8',
  border: '#343D4E',
  borderStrong: '#9AA6BC',
  primary: '#5B8CFF',
  primaryText: '#FFFFFF',
  given: '#E6EAF2',
  userValue: '#7FA6FF',
  error: '#FF6B6B',
  errorBg: '#4A2228',
  cellSelected: '#2E4A86',
  cellRelated: '#212A3A',
  cellSame: '#2A3B60',
  flash: '#6B5A1E',
  note: '#A4ADBE',
};

export function useTheme(): Theme {
  const system = useColorScheme();
  const mode = useSettingsStore((s) => s.settings.theme);
  const isDark = mode === 'system' ? system === 'dark' : mode === 'dark';
  return isDark ? dark : light;
}
