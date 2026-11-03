; Wing-Board installer (formerly REMATCH Tactics): per-user install (no admin needed), Start menu + desktop shortcuts, uninstaller.
Unicode true
!include "MUI2.nsh"
!define APPNAME "Wing-Board"
!define OLDNAME "REMATCH Tactics"
!define COMPANY "BlueWing"
!ifdef VER
!define VERSION "${VER}"
!else
!define VERSION "1.0.0"
!endif
; paths come from the build script: makensis -DSRC=... -DOUT=... -DICO=...
!ifndef SRC
!error "pass -DSRC=<unpacked app folder>"
!endif
!define UNINSTKEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\WingBoard"
!define OLDUNINSTKEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\RematchTactics"

Name "${APPNAME}"
OutFile "${OUT}"
InstallDir "$LOCALAPPDATA\Programs\${APPNAME}"
InstallDirRegKey HKCU "Software\${COMPANY}\${APPNAME}" "InstallDir"
RequestExecutionLevel user
SetCompressor /SOLID lzma
BrandingText "${APPNAME} ${VERSION} · ${COMPANY}"
VIProductVersion "${VERSION}.0"
VIAddVersionKey "ProductName" "${APPNAME}"
VIAddVersionKey "CompanyName" "${COMPANY}"
VIAddVersionKey "FileDescription" "${APPNAME} Setup"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "ProductVersion" "${VERSION}"
VIAddVersionKey "LegalCopyright" "${COMPANY}"

!define MUI_ICON "${ICO}"
!define MUI_UNICON "${ICO}"
!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_RUN "$INSTDIR\${APPNAME}.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Open ${APPNAME} now"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"

Section "Install"
  ; close a running copy so its files can be replaced
  nsExec::Exec 'taskkill /F /IM "${APPNAME}.exe"'
  ; replace an older "REMATCH Tactics" install: close it, remove its program files, shortcuts and uninstall entry
  ; (its saved plays and settings are kept and the new app keeps using them)
  nsExec::Exec 'taskkill /F /IM "${OLDNAME}.exe"'
  ReadRegStr $0 HKCU "Software\${COMPANY}\${OLDNAME}" "InstallDir"
  StrCmp $0 "" 0 +2
  StrCpy $0 "$LOCALAPPDATA\Programs\${OLDNAME}"
  IfFileExists "$0\${OLDNAME}.exe" 0 +2
  RMDir /r "$0"
  Delete "$SMPROGRAMS\${OLDNAME}.lnk"
  Delete "$DESKTOP\${OLDNAME}.lnk"
  DeleteRegKey HKCU "${OLDUNINSTKEY}"
  DeleteRegKey HKCU "Software\${COMPANY}\${OLDNAME}"
  SetOutPath "$INSTDIR"
  File /r "${SRC}/*"
  File "${ICO}"
  WriteUninstaller "$INSTDIR\Uninstall ${APPNAME}.exe"
  CreateShortcut "$SMPROGRAMS\${APPNAME}.lnk" "$INSTDIR\${APPNAME}.exe" "" "$INSTDIR\${APPNAME}.exe" 0
  CreateShortcut "$DESKTOP\${APPNAME}.lnk" "$INSTDIR\${APPNAME}.exe" "" "$INSTDIR\${APPNAME}.exe" 0
  WriteRegStr HKCU "Software\${COMPANY}\${APPNAME}" "InstallDir" "$INSTDIR"
  WriteRegStr HKCU "${UNINSTKEY}" "DisplayName" "${APPNAME}"
  WriteRegStr HKCU "${UNINSTKEY}" "DisplayIcon" "$INSTDIR\${APPNAME}.exe"
  WriteRegStr HKCU "${UNINSTKEY}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${UNINSTKEY}" "Publisher" "${COMPANY}"
  WriteRegStr HKCU "${UNINSTKEY}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${UNINSTKEY}" "UninstallString" '"$INSTDIR\Uninstall ${APPNAME}.exe"'
  WriteRegDWORD HKCU "${UNINSTKEY}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINSTKEY}" "NoRepair" 1
  WriteRegDWORD HKCU "${UNINSTKEY}" "EstimatedSize" 290000
  ; a one-click update from inside the app runs this silently: open the new version when done
  IfSilent 0 +2
  Exec '"$INSTDIR\${APPNAME}.exe"'
SectionEnd

Section "Uninstall"
  nsExec::Exec 'taskkill /F /IM "${APPNAME}.exe"'
  Delete "$SMPROGRAMS\${APPNAME}.lnk"
  Delete "$DESKTOP\${APPNAME}.lnk"
  RMDir /r "$INSTDIR"
  DeleteRegKey HKCU "${UNINSTKEY}"
  DeleteRegKey HKCU "Software\${COMPANY}\${APPNAME}"
  ; saved plays and settings (in %APPDATA%) are kept
SectionEnd
