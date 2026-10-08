@echo off
rem Keeps the local app (npm run pages:dev, port 8788) running for the E2E tests.
rem If pages:dev crashes or exits (the local Workers runtime sometimes crashes after a payment receipt is
rem generated), it is started again after a short pause. The pages:dev command itself is not changed.
rem
rem Start (Command Prompt, any folder):   scripts\pages-dev-loop.cmd      (from the skillpassport folder)
rem Stop:  press Ctrl+C, then answer Y to "Terminate batch job (Y/N)?"  (or just close the window).
cd /d "%~dp0.."

:loop
echo.
echo [%date% %time%] starting: npm run pages:dev
call npm run pages:dev
echo.
echo [%date% %time%] pages:dev exited (code %errorlevel%). Restarting in 3 seconds. Press Ctrl+C and answer Y to stop.
rem ping is used as the 3-second pause because it works in every shell (timeout.exe does not, e.g. in Git Bash).
ping -n 4 127.0.0.1 >nul
goto loop
