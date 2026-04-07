@echo off
echo ============================================
echo   Background Remover - Windows Installer
echo ============================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo [FEHLER] Node.js wurde nicht gefunden!
    echo.
    echo Bitte Node.js installieren von:
    echo   https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [1/3] Installiere Abhaengigkeiten...
call npm install

echo [2/3] Erstelle Windows Installer...
call npm run build

echo [3/3] Fertig!
echo.
echo ============================================
echo   Die Installationsdatei liegt in:
echo   dist\Background Remover Setup *.exe
echo ============================================
echo.
pause
