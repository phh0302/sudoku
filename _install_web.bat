@echo off
REM Cai thu vien de chay game tren trinh duyet (web) + build thu
cd /d "%~dp0"
if not exist logs mkdir logs
set CI=1
echo RUNNING > logs\status.txt
call npx expo install react-dom react-native-web @expo/metro-runtime > logs\web.log 2>&1
echo INSTALL_EXIT=%errorlevel% >> logs\web.log
call npx expo export --platform web --output-dir dist-web > logs\webexport.log 2>&1
echo EXPORT_EXIT=%errorlevel% >> logs\webexport.log
echo DONE > logs\status.txt
