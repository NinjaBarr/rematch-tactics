#!/bin/bash
# Opens the board in its own Chrome app window, sized to nearly fill the screen.
DIR="$(cd "$(dirname "$0")" && pwd)"
URL="file://$DIR/rematch-tactics.html"
B=$(osascript -e 'tell application "Finder" to get bounds of window of desktop' 2>/dev/null)
SW=$(echo "$B" | awk -F', ' '{print $3}'); SH=$(echo "$B" | awk -F', ' '{print $4}')
if [ -n "$SW" ] && [ -n "$SH" ]; then
  W=$((SW*94/100)); H=$(( (SH-25)*92/100 )); X=$(( (SW-W)/2 )); Y=$(( 25 + (SH-25-H)/2 ))
  SIZE="--window-size=$W,$H --window-position=$X,$Y"
else
  SIZE="--start-maximized"
fi
if [ -d "/Applications/Google Chrome.app" ]; then
  open -na "Google Chrome" --args --app="$URL" $SIZE
elif [ -d "/Applications/Microsoft Edge.app" ]; then
  open -na "Microsoft Edge" --args --app="$URL" $SIZE
else
  open "$URL"
fi
