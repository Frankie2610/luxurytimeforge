@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
title TimeForge Commerce - Development Server

cls
echo ============================================================
echo   TIMEFORGE COMMERCE - DEVELOPMENT SERVER (PNPM FALLBACK)
echo ============================================================
echo.
echo Thu muc du an:
echo %CD%
echo.

if not exist "package.json" (
  echo [LOI] Khong tim thay package.json.
  echo Hay giai nen TOAN BO file ZIP truoc khi chay.
  echo Khong chay file BAT truc tiep ben trong WinRAR hoac 7-Zip.
  goto :error
)

where node.exe >nul 2>nul
if errorlevel 1 (
  echo [LOI] Chua cai Node.js hoac Node.js chua co trong PATH.
  echo Hay cai Node.js LTS, khoi dong lai may, roi chay lai file nay.
  goto :error
)

for /f "delims=" %%V in ('node --version') do set "NODE_VERSION=%%V"
echo Node.js: %NODE_VERSION%

set "PM_KIND="
set "PM_VERSION="

rem Uu tien pnpm da cai san.
where pnpm.cmd >nul 2>nul
if not errorlevel 1 (
  for /f "delims=" %%V in ('pnpm.cmd --version') do set "PM_VERSION=%%V"
  set "PM_KIND=pnpm"
  goto :manager_ready
)

rem Node 24 chinh thuc thuong co Corepack. Goi pnpm truc tiep qua Corepack
rem de tranh loi npm 11: "Exit handler never called".
where corepack.cmd >nul 2>nul
if not errorlevel 1 (
  echo Dang chuan bi pnpm 10.15.1 qua Corepack...
  call corepack.cmd pnpm --version > "%TEMP%\timeforge-pnpm-version.txt" 2> "%TEMP%\timeforge-pnpm-error.txt"
  if not errorlevel 1 (
    set /p PM_VERSION=<"%TEMP%\timeforge-pnpm-version.txt"
    set "PM_KIND=corepack"
    del /q "%TEMP%\timeforge-pnpm-version.txt" >nul 2>nul
    del /q "%TEMP%\timeforge-pnpm-error.txt" >nul 2>nul
    goto :manager_ready
  )
  echo [CANH BAO] Corepack khong khoi tao duoc pnpm.
  type "%TEMP%\timeforge-pnpm-error.txt" 2>nul
  del /q "%TEMP%\timeforge-pnpm-version.txt" >nul 2>nul
  del /q "%TEMP%\timeforge-pnpm-error.txt" >nul 2>nul
)

rem Fallback cuoi cung. Npm 11.13.0 tren mot so may Windows co the gap loi noi bo.
where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo [LOI] Khong tim thay pnpm, Corepack hoac npm.
  goto :manager_error
)
for /f "delims=" %%V in ('npm.cmd --version') do set "PM_VERSION=%%V"
set "PM_KIND=npm"

:manager_ready
echo Package manager: %PM_KIND% %PM_VERSION%
echo.

set "INSTALL_MARKER=node_modules\.timeforge-install-ok"
if exist "%INSTALL_MARKER%" (
  echo [1/2] Thu vien da cai dat day du, bo qua buoc cai dat.
  goto :start_server
)

if exist "node_modules" (
  echo [1/2] Phat hien node_modules dang do hoac cai dat chua hoan tat.
  echo Dang don thu muc cu...
  rmdir /s /q "node_modules"
)

echo [1/2] Dang cai thu vien. Vui long cho...
if /i "%PM_KIND%"=="pnpm" (
  call pnpm.cmd install --frozen-lockfile
) else if /i "%PM_KIND%"=="corepack" (
  call corepack.cmd pnpm install --frozen-lockfile
) else (
  echo Dang thu npm voi cache verify va tat audit...
  call npm.cmd cache verify
  call npm.cmd install --no-audit --no-fund
)

if errorlevel 1 (
  echo.
  echo [LOI] Cai thu vien that bai.
  if /i "%PM_KIND%"=="npm" (
    echo Npm tren may dang gap loi noi bo "Exit handler never called".
    echo Ban TimeForge V39 uu tien pnpm/Corepack de tranh loi nay.
  )
  goto :manager_error
)

if not exist "node_modules" (
  echo [LOI] Lenh cai dat ket thuc nhung khong tao node_modules.
  goto :manager_error
)

echo Installed by %PM_KIND% %PM_VERSION%> "%INSTALL_MARKER%"
echo [OK] Cai thu vien thanh cong.

:start_server
echo.
echo [2/2] Dang khoi dong TimeForge Sprint 39...
echo.
echo Website se mo tai:
echo http://localhost:5173/
echo.
echo KHONG dong cua so nay khi dang su dung website.
echo Nhan Ctrl+C de dung server.
echo ============================================================
echo.

start "" powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 4; Start-Process 'http://localhost:5173/'" >nul 2>nul

if /i "%PM_KIND%"=="pnpm" (
  call pnpm.cmd run dev
) else if /i "%PM_KIND%"=="corepack" (
  call corepack.cmd pnpm run dev
) else (
  call npm.cmd run dev
)
set "DEV_EXIT=%ERRORLEVEL%"

echo.
if not "%DEV_EXIT%"=="0" (
  echo [LOI] Development server da dung voi ma loi %DEV_EXIT%.
) else (
  echo Development server da dung.
)
goto :finish

:manager_error
echo.
echo Cach xu ly de xuat:
echo 1. Cap nhat Node.js 24 len ban LTS moi nhat, HOAC cai Node.js 22 LTS.
echo 2. Mo lai START_TIMEFORGE.bat.
echo 3. Neu van loi, gui anh toan bo cua so nay.
goto :error

:error
echo.
echo ============================================================
echo KHONG THE KHOI DONG TIMEFORGE.
echo Cua so duoc giu lai de ban xem va chup noi dung loi.
echo ============================================================

:finish
echo.
pause
exit /b
