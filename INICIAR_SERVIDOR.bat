@echo off
title IMony - Servidor Local
color 0A
echo.
echo ========================================
echo    🚀 IMony - Servidor Local
echo ========================================
echo.
echo Iniciando servidor en: http://localhost:8000
echo.
echo IMPORTANTE: Deja esta ventana abierta
echo Presiona Ctrl+C para detener el servidor
echo.
echo ========================================
echo.

cd /d "%~dp0"

REM Intentar con Python
python server.py 8000 2>nul

if %errorlevel% neq 0 (
    echo Python no encontrado. Intentando con Node.js...
    echo.
    npx -y http-server -p 8000 2>nul
    
    if %errorlevel% neq 0 (
        echo.
        echo ❌ ERROR: No se encontró Python ni Node.js
        echo.
        echo Por favor instala Python o Node.js:
        echo - Python: https://www.python.org/downloads/
        echo - Node.js: https://nodejs.org/
        echo.
        pause
        exit
    )
)

pause
