@echo off
title MD_monthly Fullstack Project Starter
color 0b

echo ====================================================================
echo 🚀ระบบตรวจสอบสิทธิ์และรายงานส่วนผู้บริหาร (MD_monthly)
echo    [พัฒนาโดยทีมระบบหลังบ้าน / Node.js + Next.js Monorepo]
echo ====================================================================
echo.
echo กำลังเริ่มต้นเตรียมเปิดระบบในเครื่องนี้...
echo.

:: 1. ตรวจสอบว่ามี Node.js ในเครื่องหรือไม่
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0c
    echo [ERR] ตรวจไม่พบโปรแกรม Node.js ในเครื่องนี้!
    echo กรุณาติดตั้ง Node.js (เวอร์ชัน LTS แนะนํา) ก่อนเริ่มใช้งานระบบ
    echo ดาวน์โหลดได้ที่: https://nodejs.org/
    echo.
    pause
    exit /b
)

echo [OK] ตรวจพบ Node.js ในระบบแล้วเรียบร้อย
echo.

:: 2. รันหลังบ้านในหน้าต่างใหม่ (Port 5000)
echo [Backend] กำลังรัน API Server (Port 5000) ในหน้าต่างใหม่...
start "MD_monthly BACKEND (Port 5000)" cmd /k "cd backend && echo [1/2] กำลังตรวจสอบและติดตั้ง Library หลังบ้าน... && npm install && echo. && echo [2/2] กำลังเริ่มรัน API Server... && npm run dev"

:: 3. รอสักครู่แล้วรันหน้าบ้านในหน้าต่างใหม่ (Port 3000)
timeout /t 3 /nobreak >nul
echo [Frontend] กำลังรัน Web App (Port 3000) ในหน้าต่างใหม่...
start "MD_monthly FRONTEND (Port 3000)" cmd /k "cd frontend && echo [1/2] กำลังตรวจสอบและติดตั้ง Library หน้าบ้าน... && npm install && echo. && echo [2/2] กำลังเริ่มรัน Next.js Web App... && npm run dev"

echo.
echo ====================================================================
echo 🎉 เปิดระบบสำเร็จแล้ว! หน้าต่างเทอร์มินัลย่อยกำลังทำงานในเบื้องหลัง
echo.
echo 🔗 หน้าบ้านหลัก (Frontend): http://localhost:3000
echo 🔗 หลังบ้านหลัก (API Docs):  http://localhost:5000/api-docs
echo ====================================================================
echo.
echo * หมายเหตุ: ห้ามปิดหน้าต่างดำย่อยที่เด้งขึ้นมาจนกว่าจะเลิกใช้งานระบบ
echo.
pause
