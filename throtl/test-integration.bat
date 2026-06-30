@echo off
echo.
echo ===========================================
echo   NetGuardian Frontend-Backend Integration
echo ===========================================
echo.

:: Test frontend
echo [1/4] Testing Frontend Server...
curl -s http://localhost:5174 >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Frontend running on http://localhost:5174
) else (
    echo ❌ Frontend not accessible - run: npm run dev
)

echo.
:: Test backend health
echo [2/4] Testing Backend API...
curl -s http://localhost:8002/api/health/ >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Backend API running on http://localhost:8002
    echo.
    echo    Health Check:
    curl -s http://localhost:8002/api/health/
) else (
    echo ❌ Backend API not accessible
    echo    Make sure NetGuardian Django backend is running on port 8002
)

echo.
echo.
:: Test devices endpoint
echo [3/4] Testing Devices Endpoint...
curl -s http://localhost:8002/api/devices/ >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Devices endpoint accessible
) else (
    echo ❌ Devices endpoint not accessible
)

echo.
:: Check environment
echo [4/4] Checking Configuration...
if exist .env (
    echo ✅ Environment file exists
    findstr "VITE_API_BASE_URL" .env >nul && echo    ✓ API URL configured
    findstr "VITE_WS_BASE_URL" .env >nul && echo    ✓ WebSocket URL configured
) else (
    echo ⚠️  No .env file found - copy .env.example to .env
)

echo.
echo ===========================================
echo   Integration Summary
echo ===========================================
echo Frontend:    http://localhost:5174
echo Backend API: http://localhost:8002
echo WebSocket:   ws://localhost:8002/ws/stats/
echo.
echo 📱 Open http://localhost:5174 in your browser
echo 🔧 Ensure NetGuardian backend is running with Redis
echo.

set /p openBrowser="Open frontend in browser? (y/n): "
if /i "%openBrowser%"=="y" start http://localhost:5174

pause