@echo off
REM Chay setup + kiem tra, ghi ket qua vao thu muc logs (dung cho Claude doc lai)
cd /d "%~dp0"
if not exist logs mkdir logs
set CI=1
echo RUNNING > logs\status.txt
echo === node/npm === > logs\setup.log
call node -v >> logs\setup.log 2>&1
call npm -v >> logs\setup.log 2>&1
call setup.bat >> logs\setup.log 2>&1
echo SETUP_EXIT=%errorlevel% >> logs\setup.log
call npm test > logs\test.log 2>&1
echo TEST_EXIT=%errorlevel% >> logs\test.log
call npx tsc --noEmit > logs\tsc.log 2>&1
echo TSC_EXIT=%errorlevel% >> logs\tsc.log
call npx expo export --platform android --output-dir dist > logs\export.log 2>&1
echo EXPORT_EXIT=%errorlevel% >> logs\export.log
echo DONE > logs\status.txt
