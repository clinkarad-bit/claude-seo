@echo off
setlocal enabledelayedexpansion

echo ============================================
echo   Background Remover - Build Script
echo   Erstellt eine standalone .exe Datei
echo ============================================
echo.

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [FEHLER] Python wurde nicht gefunden!
    echo.
    echo Bitte Python 3.9+ installieren von:
    echo   https://www.python.org/downloads/
    echo.
    echo WICHTIG: Bei der Installation "Add Python to PATH" ankreuzen!
    echo.
    pause
    exit /b 1
)

echo [1/4] Erstelle virtuelle Umgebung...
if exist venv rmdir /s /q venv
python -m venv venv
call venv\Scripts\activate.bat

echo [2/4] Installiere Abhaengigkeiten...
pip install --quiet -r requirements.txt
pip install --quiet pyinstaller

echo [3/4] Lade AI-Modell vor (u2net)...
python -c "from rembg import new_session; new_session('u2net')"

echo [4/4] Erstelle .exe Datei...
pyinstaller ^
    --noconfirm ^
    --onedir ^
    --windowed ^
    --name "BackgroundRemover" ^
    --add-data "%USERPROFILE%\.u2net;.u2net" ^
    --hidden-import=rembg ^
    --hidden-import=onnxruntime ^
    --hidden-import=PIL ^
    --hidden-import=PIL.Image ^
    --collect-all rembg ^
    background_remover.py

echo.
echo ============================================
echo   BUILD ERFOLGREICH!
echo ============================================
echo.
echo Die fertige Anwendung liegt in:
echo   dist\BackgroundRemover\BackgroundRemover.exe
echo.
echo Du kannst den gesamten Ordner "dist\BackgroundRemover"
echo auf jeden Windows-PC kopieren und dort starten.
echo Kein Python noetig!
echo.

pause
