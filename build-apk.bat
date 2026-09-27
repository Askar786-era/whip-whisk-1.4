@echo off
setlocal enabledelayedexpansion
title Whip & Whisk - Android APK Builder

echo ========================================================
echo       WHIP ^& WHISK - NATIVE ANDROID APK BUILDER
echo ========================================================
echo.

echo [1/3] Synchronizing static web assets to www...
node copy-www.js
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to copy web assets.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Syncing Capacitor Android Native Project...
node "node_modules/@capacitor/cli/bin/capacitor" sync android
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Capacitor sync failed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/3] Checking Build Tools...

:: Check if JAVA_HOME is set
if defined JAVA_HOME (
    echo [*] Found JAVA_HOME: %JAVA_HOME%
    goto BUILD_GRADLE
)

:: Check common Android Studio JBR locations
set "AS_JBR1=C:\Program Files\Android\Android Studio\jbr"
set "AS_JBR2=C:\Program Files\Android\Android Studio\jre"
set "LOCAL_JBR=%LOCALAPPDATA%\Programs\Android Studio\jbr"

if exist "%AS_JBR1%\bin\java.exe" (
    set "JAVA_HOME=%AS_JBR1%"
    set "PATH=%AS_JBR1%\bin;%PATH%"
    echo [*] Detected Android Studio Java: %AS_JBR1%
    goto BUILD_GRADLE
)

if exist "%AS_JBR2%\bin\java.exe" (
    set "JAVA_HOME=%AS_JBR2%"
    set "PATH=%AS_JBR2%\bin;%PATH%"
    echo [*] Detected Android Studio Java: %AS_JBR2%
    goto BUILD_GRADLE
)

if exist "%LOCAL_JBR%\bin\java.exe" (
    set "JAVA_HOME=%LOCAL_JBR%"
    set "PATH=%LOCAL_JBR%\bin;%PATH%"
    echo [*] Detected Android Studio Java: %LOCAL_JBR%
    goto BUILD_GRADLE
)

echo.
echo [!] Standalone Java / JDK not in system PATH.
echo [*] Launching Android Studio to build APK via GUI...
node "node_modules/@capacitor/cli/bin/capacitor" open android
echo.
echo ========================================================
echo INSTRUCTIONS TO EXPORT APK IN ANDROID STUDIO:
echo 1. Wait for Android Studio to finish indexing.
echo 2. Click menu: "Build" -> "Build Bundle(s) / APK(s)" -> "Build APK(s)"
echo 3. Once finished, click "locate" in the bottom-right popup!
echo    Your APK will be ready at:
echo    android\app\build\outputs\apk\debug\app-debug.apk
echo ========================================================
pause
exit /b 0

:BUILD_GRADLE
echo [*] Building Debug APK with Gradle...
cd android
call gradlew.bat assembleDebug
cd ..

if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    echo.
    echo ========================================================
    echo [SUCCESS] APK compiled successfully!
    echo Location: android\app\build\outputs\apk\debug\app-debug.apk
    echo ========================================================
    explorer /select,"android\app\build\outputs\apk\debug\app-debug.apk"
) else (
    echo.
    echo [NOTICE] If gradle build requires Android SDK setup,
    echo opening project in Android Studio...
    node "node_modules/@capacitor/cli/bin/capacitor" open android
)

pause
