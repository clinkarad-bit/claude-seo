@echo off
setlocal enabledelayedexpansion

echo ============================================
echo   Background Remover - Single-EXE Build
echo   Erstellt EINE einzelne .exe Datei
echo ============================================
echo.
echo HINWEIS: Die .exe wird ca. 200-300 MB gross,
echo da das AI-Modell eingebettet wird.
echo.

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [FEHLER] Python wurde nicht gefunden!
    echo Bitte Python 3.9+ installieren: https://www.python.org/downloads/
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

echo [4/4] Erstelle einzelne .exe Datei (dauert einige Minuten)...
pyinstaller ^
    --noconfirm ^
    --onefile ^
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
echo Die fertige .exe liegt in:
echo   dist\BackgroundRemover.exe
echo.
echo Diese einzelne Datei kann auf jeden Windows-PC
echo kopiert und direkt gestartet werden.
echo.

pause
