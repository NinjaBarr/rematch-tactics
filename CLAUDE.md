# Wing-Board (formerly REMATCH Tactics) — notes for Claude

Tactics board for the 5v5 football game REMATCH, made by BlueWing (Joseph). One self-contained HTML app.

## Layout
- `src/app.html` — the whole app (HTML, CSS, JS in one IIFE; Firebase SDK bundled as `text/plain#fbsdk`). This is the file to edit.
- `src/coop.js` — reference copy of the co-op module (already pasted into app.html; app.html is canonical).
- `desktop/` — Electron wrapper (main.js, preload.js with the plays-folder IPC), NSIS installer script, exe icon/version stamper.
- `web/` — website / phone home-screen app assets (manifest, service worker, icons). `index.html` is generated.
- `extras/plain-html-folder/` — launchers + README for the plain HTML zip.
- `scripts/build-html.sh` — builds `build/rematch-tactics.html` and `build/web/` (stamps VERSION + update repo).
- `scripts/build-windows.sh` — builds `out/Wing-Board-Setup.exe` (Electron 38.2.0 + NSIS). Linux; needs nsis, node.
- `notes/vX.Y.Z.md` — optional release notes used by the workflow.

## Releasing (Joseph only uses the Windows installer)
1. Edit `src/app.html` (and `desktop/` if needed); bump `VERSION`; optionally add `notes/vX.Y.Z.md`.
2. Commit and push to main.
3. Trigger the workflow: `gh api --method POST repos/NinjaBarr/rematch-tactics/actions/workflows/release.yml/dispatches -f ref=main` (Claude sessions can't push tags — 403). It builds the installer and publishes release `v<VERSION>` (creating the tag). Pushing a tag from a normal git client also works. Installed apps see it via the update check (`checkForUpdate` in app.html, GitHub releases API) and show a Download bar.
The session cannot upload release assets directly (binary uploads are blocked); the workflow does it.

## Conventions
- Assets: `Wing-Board-Setup.exe` plus an identical `REMATCH-Tactics-Setup.exe` for links shared before the rename. The in-app updater matches any `Setup.exe`.
- Renamed to Wing-Board in v1.0.21. Internal ids stay: repo name, localStorage keys (`rematch-tactics.*`), `.rematch.json` files. Desktop keeps using an existing `%APPDATA%/REMATCH Tactics` data folder and `Documents/REMATCH Tactics Plays`; the installer removes the old `REMATCH Tactics` install/shortcuts/uninstall entry.
- Also publish the built page to the claude.ai artifact when asked.

## Real-time speeds (from Joseph, Oct 31) — `SPEED` in app.html
Sprint 10 m (10.437 units) / 1.15 s · Extra Effort 10 m / 1 s, lasts 1.5 s · full-power shot 33.4 units / 1 s · full-power tap pass 33.4 units / 1.15 s.
Estimates: dribble = 0.78 × sprint, lob = tap pass speed, keeper dive 9 units/s. Playback is real time (constant speed); the ruler shows run/EE/pass/shot times.

- Shot curve (measured in game): full curve on a full-power shot drifts 4.05 units off the aim line after 33.1 units -> constant sideways pull, offset = k*d^2, k = CURVE_K = 4.05/33.1^2. Shapes keep the landing point; `curve` in [-1,1] (+ right) bows the path (symmetric vs the chord) and drawAimHint shows the in-game aim point.

- Timed steps (v1.0.22): doc.timed + doc.stepSecs, frame.dur per step (new steps copy it). timedTLs() builds a continuous clock: each step planned at real speed (baseSecs via buildNextFrame), overflow past the step time carries into the next step; the ball group (ball holders + diving keepers) waits for carried ball/players together, others only for their own carried legs. Playback reads TL(fb) instead of fb.tl when timed; saved frames are never modified. Editing view dims what overflows (timedLayers + drawTimedMarks), reach rings via drawReachRings. tls[N] is a virtual step after the last.
