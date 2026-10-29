#!/bin/bash
# Builds the board pages from src/app.html:
#   build/rematch-tactics.html   the page the desktop app (and the plain HTML folder) loads
#   build/web/                   the hostable website / iPhone home-screen app
# VERSION is stamped in, and the GitHub repo used for update checks (REPO env var, default NinjaBarr/rematch-tactics).
set -e
cd "$(dirname "$0")/.."
VER=$(tr -d ' \n\r' < VERSION); REPO=${REPO:-NinjaBarr/rematch-tactics}
mkdir -p build/web
HEAD='<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
WEBHEAD='<meta name="description" content="Tactics board for REMATCH">\n<meta name="theme-color" content="#0d121a">\n<link rel="manifest" href="manifest.webmanifest">\n<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-status-bar-style" content="black">\n<meta name="apple-mobile-web-app-title" content="Tactics">\n<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">\n<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">\n<link rel="icon" type="image/png" sizes="64x64" href="icons/favicon.png">\n'
{ printf "$HEAD"; cat src/app.html; printf '\n</html>\n'; } > build/rematch-tactics.html
cp -r web/. build/web/
{ printf "$HEAD"; printf "$WEBHEAD"; sed -E '/<link rel="(icon|apple-touch-icon)"[^>]*href="data:/d' src/app.html; printf '\n</html>\n'; } > build/web/index.html
for f in build/rematch-tactics.html build/web/index.html; do
  sed -i -E "s#/\*APP_VERSION\*/'[^']*'/\*END\*/#/*APP_VERSION*/'$VER'/*END*/#; s#/\*UPDATE_REPO\*/'[^']*'/\*END\*/#/*UPDATE_REPO*/'$REPO'/*END*/#" "$f"
done
sed -i -E "s/const CACHE = 'rematch-tactics-[^']*'/const CACHE = 'rematch-tactics-$VER-$(date +%s)'/" build/web/sw.js
echo "built version $VER (update repo: $REPO)"
