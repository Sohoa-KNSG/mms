@echo off
title MMS Full Backend API (Port 5080)
echo =======================================================
echo   KHOI DONG MMS FULL BACKEND API (.NET 10)
echo   Ket noi CSDL: 192.168.1.17\KNSG_DATA_CENTER / MMS
echo =======================================================
cd /d %~dp0\apps\api
dotnet run --urls "http://0.0.0.0:5080"
pause
