@echo off
REM Shop POS System - Quick Start Script for Windows

echo.
echo ========================================
echo   SHOP POS SYSTEM - QUICK START
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Checking Node.js version...
node --version

echo.
echo Step 1: Installing backend dependencies...
cd backend
if exist node_modules (
    echo Backend dependencies already installed
) else (
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install backend dependencies
        pause
        exit /b 1
    )
)

echo.
echo Step 2: Installing frontend dependencies...
cd ..\frontend
if exist node_modules (
    echo Frontend dependencies already installed
) else (
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install frontend dependencies
        pause
        exit /b 1
    )
)

cd ..

echo.
echo ========================================
echo SETUP COMPLETE!
echo ========================================
echo.
echo To start the POS system, run these commands in different terminal windows:
echo.
echo Terminal 1 (Backend):
echo   cd backend
echo   npm start
echo.
echo Terminal 2 (Frontend):
echo   cd frontend
echo   npm start
echo.
echo Terminal 3 (Seed Data - Optional):
echo   cd backend
echo   npm run seed
echo.
echo Press any key to exit...
pause
