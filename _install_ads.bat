@echo off
REM Cai thu vien quang cao (AdMob) + dev client, roi tu kiem tra. Nhap dup de chay.
cd /d "%~dp0"
if not exist logs mkdir logs
set CI=1
echo RUNNING > logs\status.txt
call npx expo install react-native-google-mobile-ads expo-dev-client expo-constants > logs\ads.log 2>&1
echo INSTALL_EXIT=%errorlevel% >> logs\ads.log
call npx tsc --noEmit > logs\tsc.log 2>&1
echo TSC_EXIT=%errorlevel% >> logs\tsc.log
call npx expo export --platform android --output-dir dist > logs\export.log 2>&1
echo EXPORT_EXIT=%errorlevel% >> logs\export.log
call npx expo export --platform web --output-dir dist-web > logs\webexport.log 2>&1
echo WEBEXPORT_EXIT=%errorlevel% >> logs\webexport.log
echo DONE > logs\status.txt
