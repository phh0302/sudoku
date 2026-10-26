@echo off
REM Nang cap du an len Expo SDK 58 (khop voi Expo Go moi tren dien thoai), roi tu kiem tra.
cd /d "%~dp0"
if not exist logs mkdir logs
set CI=1
echo RUNNING > logs\status.txt
call npx expo install expo@^58.0.0 --fix > logs\upgrade.log 2>&1
echo UPGRADE_EXIT=%errorlevel% >> logs\upgrade.log
call npx expo install --fix >> logs\upgrade.log 2>&1
echo FIX_EXIT=%errorlevel% >> logs\upgrade.log
call npx expo install --check >> logs\upgrade.log 2>&1
echo CHECK_EXIT=%errorlevel% >> logs\upgrade.log
call npx tsc --noEmit > logs\tsc.log 2>&1
echo TSC_EXIT=%errorlevel% >> logs\tsc.log
call npx jest > logs\test.log 2>&1
echo TEST_EXIT=%errorlevel% >> logs\test.log
call npx expo export --platform ios --output-dir dist > logs\export.log 2>&1
echo EXPORT_EXIT=%errorlevel% >> logs\export.log
call npx expo export --platform web --output-dir dist-web > logs\webexport.log 2>&1
echo WEBEXPORT_EXIT=%errorlevel% >> logs\webexport.log
echo DONE > logs\status.txt
