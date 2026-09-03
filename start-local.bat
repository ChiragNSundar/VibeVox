@echo off
setlocal enabledelayedexpansion
title VibeVox - Smart Pre-Flight Launcher

echo ======================================================================
echo                     VIBEVOX - SMART LOCAL LAUNCHER              
echo ======================================================================
echo.

:: ----------------------------------------------------------------------
:: 1. CHECK RUNTIME (BUN OR NODE.JS)
:: ----------------------------------------------------------------------
set RUNNER=npm
where bun >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    set RUNNER=bun
    echo [OK] Bun detected as high-performance runtime.
) else (
    where node >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Neither Node.js nor Bun is installed on your computer!
        echo.
        echo FIX: Please download and install Node.js (LTS version) from:
        echo      https://nodejs.org/  or  https://bun.sh
        echo.
        echo Once installed, double-click start-local.bat again.
        echo ======================================================================
        pause
        exit /b 1
    )
    echo [OK] Node.js detected.
)

:: ----------------------------------------------------------------------
:: 2. CHECK NODE_MODULES / DEPENDENCIES
:: ----------------------------------------------------------------------
if not exist "node_modules\" (
    echo [INFO] First-time setup detected. Installing project dependencies...
    if "%RUNNER%"=="bun" (
        call bun install
    ) else (
        call npm install
    )
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Dependency installation failed! Please check your internet connection.
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed successfully.
    echo.
)

:: ----------------------------------------------------------------------
:: 3. CHECK PYTHON & AUTO-INSTALL REQUIREMENTS
:: ----------------------------------------------------------------------
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    if exist "docs\requirements.txt" (
        echo [INFO] Verifying Python AI dependencies from docs\requirements.txt...
        python -m pip install -q -r docs\requirements.txt >nul 2>nul
    )
) else (
    echo [NOTICE] Python is not installed in PATH. (Optional for local Whisper server).
)

:: ----------------------------------------------------------------------
:: 4. CHECK LOCAL LLM SERVER (PORT 1234 - LM Studio / PORT 11434 - Ollama)
:: ----------------------------------------------------------------------
powershell -NoProfile -Command "(New-Object Net.Sockets.TcpClient).Connect('127.0.0.1', 1234)" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Local LLM Server detected ^& active on port 1234 (LM Studio)!
) else (
    powershell -NoProfile -Command "(New-Object Net.Sockets.TcpClient).Connect('127.0.0.1', 11434)" >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Local LLM Server detected ^& active on port 11434 (Ollama)!
    ) else (
        echo [NOTICE] Local LLM server (LM Studio / Ollama) is not running yet.
        echo          * The app works offline with Zero-LLM RAG & algorithmic fallbacks.
        echo          * To connect an AI model: open LM Studio -^> Start Server (Port 1234).
    )
)
echo.

:: ----------------------------------------------------------------------
:: 5. CHECK & AUTO-START FASTER-WHISPER-SERVER (PORT 9000)
:: ----------------------------------------------------------------------
powershell -NoProfile -Command "(New-Object Net.Sockets.TcpClient).Connect('127.0.0.1', 9000)" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Local Whisper Transcription Server detected ^& active on port 9000!
) else (
    echo [INFO] Launching AMD GPU DirectML Whisper server in background on port 9000...
    start "VibeVox - Whisper STT Server (Port 9000)" cmd /k "python scripts\launch_whisper_directml.py"
    echo [OK] Whisper server launched!
)
echo.

:: ----------------------------------------------------------------------
:: 6. LAUNCH BROWSER & DEV SERVER
:: ----------------------------------------------------------------------
echo ======================================================================
echo [LAUNCHING] Opening VibeVox in your browser: http://localhost:8080/
echo ======================================================================
echo.

start "" "http://localhost:8080/"
if "%RUNNER%"=="bun" (
    call bun dev
) else (
    call npm run dev
)

:cleanup
echo.
echo ======================================================================
echo [CLEANUP] Terminating background AI processes...
echo ======================================================================
taskkill /F /FI "WINDOWTITLE eq VibeVox - Whisper STT Server*" >nul 2>nul
taskkill /F /FI "WINDOWTITLE eq Vocal Muse - Whisper STT Server*" >nul 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":9000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8080" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>nul
echo [OK] VibeVox processes terminated cleanly.
echo.
pause
