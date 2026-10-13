@echo off
REM Chay game tren dien thoai: mo app Expo Go va quet ma QR hien ra ben duoi.
REM Dien thoai va may tinh phai cung mang Wi-Fi va cung dang nhap 1 tai khoan Expo.
cd /d "%~dp0"
call npx expo whoami >nul 2>&1
if errorlevel 1 (
  echo Ban chua dang nhap Expo. Nhap email/username va mat khau tai khoan expo.dev:
  call npx expo login
)
call npx expo start
pause
