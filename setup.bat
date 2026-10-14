@echo off
REM ==========================================================
REM  Cai dat thu vien cho project Sudoku (chay 1 lan)
REM  Yeu cau: Node.js LTS da cai dat
REM ==========================================================
cd /d "%~dp0"

echo [1/5] Cai Expo SDK moi nhat (khop voi app Expo Go tren dien thoai)...
call npm install expo@latest zustand
if errorlevel 1 goto :error

echo [2/5] Cai thu vien React Native dung phien ban voi SDK...
call npx expo install react react-native expo-status-bar expo-haptics expo-audio @expo/vector-icons @react-native-async-storage/async-storage react-native-safe-area-context
if errorlevel 1 goto :error

echo [3/5] Cai cong cu phat trien (TypeScript, Jest)...
call npx expo install typescript @types/react jest jest-expo @types/jest -- --save-dev
if errorlevel 1 goto :error

echo [4/5] Cai ESLint + Prettier...
call npx expo install eslint eslint-config-expo -- --save-dev
if errorlevel 1 goto :error
call npm install --save-dev prettier
if errorlevel 1 goto :error

echo [5/5] Kiem tra phien ban cac goi...
call npx expo install --check

echo.
echo ==========================================================
echo  XONG! Chay "npm test" de kiem tra logic,
echo  roi "npx expo start" va quet QR bang app Expo Go.
echo ==========================================================
goto :eof

:error
echo.
echo Co loi khi cai dat. Hay chup lai thong bao loi o tren.
exit /b 1
