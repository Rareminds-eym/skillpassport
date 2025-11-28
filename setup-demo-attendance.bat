@echo off
echo ========================================
echo  Generate Demo Attendance Data
echo ========================================
echo.
echo This will generate 30 days of attendance data
echo for all students in Delhi Public School
echo.
pause

node generate-demo-attendance.js

echo.
echo ========================================
echo  Done!
echo ========================================
pause
