@echo off
title VibeVox - Shutdown Server Processes
echo ======================================================================
echo           VIBEVOX - CLEAN SHUTDOWN UTILITY
echo ======================================================================
echo.
echo [1/3] Terminating background Whisper STT window...
taskkill /F /FI "WINDOWTITLE eq VibeVox - Whisper STT Server*" >nul 2>nul
taskkill /F /FI "WINDOWTITLE eq Vocal Muse - Whisper STT Server*" >nul 2>nul

echo [2/3] Freeing port 9000 (Whisper STT Server)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":9000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>nul

echo [3/3] Freeing port 8080 (Vite Dev Server)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8080" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>nul

echo.
echo ======================================================================
echo [OK] All VibeVox processes shut down cleanly!
echo ======================================================================
echo.
pause
