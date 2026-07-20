@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title TimeForge Commerce - Production Preview

cls
echo ============================================================
echo   TIMEFORGE COMMERCE - PRODUCTION PREVIEW
echo ============================================================
echo.

if not exist "package.json" (
  echo [LOI] Khong tim thay package.json.
  echo Hay giai nen TOAN BO file ZIP truoc khi chay.
  goto :error
)

where node.exe >nul 2>nul
if errorlevel 1 (
  echo [LOI] Chua cai Node.js hoac Node.js chua co trong PATH.
  goto :error
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo [LOI] Khong tim thay npm.cmd.
  goto :error
)

if not exist "node_modules" (
  echo Dang cai thu vien...
  call npm.cmd install
  if errorlevel 1 goto :error
)

echo Dang build production...
call npm.cmd run build
if errorlevel 1 goto :error

echo.
echo Dang mo production preview tai http://localhost:4173/
echo KHONG dong cua so nay khi dang su dung website.
echo.
call npm.cmd run preview
set "PREVIEW_EXIT=%ERRORLEVEL%"
echo.
echo Preview da dung voi ma %PREVIEW_EXIT%.
goto :finish

:error
echo.
echo [LOI] Khong the khoi dong production preview.

:finish
echo.
pause
exit /b
