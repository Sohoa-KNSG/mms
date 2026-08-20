@echo off
title Khoi Dong Toan Bo He Thong MMS
echo =======================================================
echo   KHOI DONG TOAN BO HE THONG MMS (API + WEB REACT 19)
echo   Backend API: http://localhost:5080
echo   Frontend Web: http://localhost:5173
echo =======================================================
start "MMS Full Backend API" cmd /c "%~dp0start-mms-api.bat"
timeout /t 2 /nobreak >nul
start "MMS Full Frontend Web" cmd /c "%~dp0start-mms-web.bat"
echo Da khoi dong xong cac dich vu MMS!
