# REMATCH Tactics — notes for Claude

Tactics board for the 5v5 football game REMATCH, made by BlueWing (Joseph). One self-contained HTML app.

## Layout
- `src/app.html` — the whole app (HTML, CSS, JS in one IIFE; Firebase SDK bundled as `text/plain#fbsdk`). This is the file to edit.
- `src/coop.js` — reference copy of the co-op module (already pasted into app.html; app.html is canonical).
- `desktop/` — Electron wrapper (main.js, preload.js with the plays-folder IPC), NSIS installer script, exe icon/version stamper.
- `web/` — website / phone home-screen app assets (manifest, service worker, icons). `index.html` is generated.
- `extras/plain-html-folder/` — launchers + README for the plain HTML zip.
- `scripts/build-html.sh` — builds `build/rematch-tactics.html` and `build/web/` (stamps VERSION + update repo).
- `scripts/build-windows.sh` — builds `out/REMATCH-Tactics-Setup.exe` (Electron 38.2.0 + NSIS). Linux; needs nsis, node.
- `notes/vX.Y.Z.md` — optional release notes used by the workflow.

## Releasing (Joseph only uses the Windows installer)
1. Edit `src/app.html` (and `desktop/` if needed); bump `VERSION`; optionally add `notes/vX.Y.Z.md`.
2. Commit, push to main, then push tag `vX.Y.Z` (must equal VERSION).
3. `.github/workflows/release.yml` builds the installer and publishes the GitHub release. Installed apps see it via the update check (`checkForUpdate` in app.html, GitHub releases API) and show a Download bar.
The session cannot upload release assets directly (binary uploads are blocked); the workflow does it.

## Conventions
- Asset name stays `REMATCH-Tactics-Setup.exe` (README links use releases/latest/download/...).
- Also publish the built page to the claude.ai artifact when asked.
