@echo off
REM Cai thu vien cho bang xep hang + kiem tra (ghi log vao thu muc logs)
cd /d "%~dp0"
if not exist logs mkdir logs
set CI=1
echo RUNNING > logs\status.txt
call npx expo install @supabase/supabase-js react-native-url-polyfill > logs\online.log 2>&1
echo INSTALL_EXIT=%errorlevel% >> logs\online.log
call npx tsc --noEmit > logs\tsc.log 2>&1
echo TSC_EXIT=%errorlevel% >> logs\tsc.log
call npx expo export --platform android --output-dir dist > logs\export.log 2>&1
echo EXPORT_EXIT=%errorlevel% >> logs\export.log
echo DONE > logs\status.txt
