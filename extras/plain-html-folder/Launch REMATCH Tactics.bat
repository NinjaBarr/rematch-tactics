@echo off
rem Opens the tactics board in its own app window (no tabs, no address bar).
setlocal
set "HTML=%~dp0rematch-tactics.html"
set "URL=file:///%HTML:\=/%"
reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe" >nul 2>&1 && goto chrome
reg query "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe" >nul 2>&1 && goto chrome
start "" msedge --app="%URL%" --start-maximized
goto :eof
:chrome
start "" chrome --app="%URL%" --start-maximized
