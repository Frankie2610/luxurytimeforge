@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title TimeForge Commerce - Reset Dependencies
cls
echo ============================================================
echo   TIMEFORGE - RESET VA CAI LAI THU VIEN
 echo ============================================================
echo.
if exist "node_modules" (
  echo Dang xoa node_modules cu...
  rmdir /s /q "node_modules"
)
if exist "node_modules\.timeforge-install-ok" del /q "node_modules\.timeforge-install-ok" >nul 2>nul
echo Khoi dong lai trinh cai dat...
echo.
call start-dev.bat
