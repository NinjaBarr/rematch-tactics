#!/bin/bash
# Builds out/REMATCH-Tactics-Setup.exe (Electron app + NSIS installer). Runs on Linux (GitHub Actions or locally).
# Needs: node, npm, unzip, curl, makensis (apt install nsis).
set -e
cd "$(dirname "$0")/.."
ROOT=$(pwd); VER=$(tr -d ' \n\r' < VERSION); ELECTRON=38.2.0
bash scripts/build-html.sh
mkdir -p build out
[ -f "build/electron-win.zip" ] || curl -sSL -o build/electron-win.zip "https://github.com/electron/electron/releases/download/v$ELECTRON/electron-v$ELECTRON-win32-x64.zip"
W=build/win; rm -rf "$W"; mkdir -p "$W"; (cd "$W" && unzip -q ../electron-win.zip)
rm -f "$W/resources/default_app.asar"; mkdir -p "$W/resources/app"
cp desktop/main.js desktop/preload.js desktop/icon.png "$W/resources/app/"
cp build/rematch-tactics.html "$W/resources/app/index.html"
node -e "const f='desktop/package.json',p=require('./'+f);p.version='$VER';require('fs').writeFileSync('$W/resources/app/package.json',JSON.stringify(p,null,2))"
mv "$W/electron.exe" "$W/REMATCH Tactics.exe"
[ -d node_modules/resedit ] || npm install --no-save --silent resedit@2
node desktop/set-exe-info.mjs "$W/REMATCH Tactics.exe" desktop/rematch-tactics.ico "$VER"
makensis -V2 -DVER="$VER" -DSRC="$ROOT/$W" -DOUT="$ROOT/out/REMATCH-Tactics-Setup.exe" -DICO="$ROOT/desktop/rematch-tactics.ico" desktop/installer.nsi
ls -la out
