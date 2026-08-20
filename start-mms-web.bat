@echo off
title MMS Full Frontend Web (Port 5173)
echo =======================================================
echo   KHOI DONG MMS FULL FRONTEND WEB & PDA (React 19 + Vite)
echo   Desktop & PDA: http://localhost:5173
echo =======================================================
cd /d %~dp0\apps\web
powershell -ExecutionPolicy Bypass -Command "npm.cmd run dev -- --host 0.0.0.0 --port 5173"
pause
