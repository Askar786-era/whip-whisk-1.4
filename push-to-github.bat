@echo off
echo ===================================================
echo   Whip ^& Whisk - Push to GitHub Repository
echo ===================================================
echo Repository: https://github.com/Askar786-era/whip-whisk-1.4.git
echo Branch:     main
echo.
git push -u origin main
echo.
if %errorlevel% equ 0 (
    echo ===================================================
    echo  [SUCCESS] Pushed to GitHub successfully!
    echo ===================================================
) else (
    echo ===================================================
    echo  [NOTICE] Please ensure you sign in with your
    echo  GitHub account: Askar786-era
    echo ===================================================
)
echo.
pause
