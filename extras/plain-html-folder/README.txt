REMATCH TACTICS BOARD
=====================

Launch it
- Windows: double-click "Launch REMATCH Tactics.bat". It opens in its own
  app window using Chrome (or Edge if Chrome isn't installed).
- Want it on your desktop or taskbar? Right-click the .bat > Send to >
  Desktop (create shortcut). You can pin that shortcut to Start.
- Mac: double-click "Launch REMATCH Tactics (Mac).command".
- Or just open rematch-tactics.html in any browser.

Keep all files in this folder together. Everything runs offline; your
saved plays live in the browser that opens the app, unless you pick a
folder (Plays > Use a folder, in Chrome or Edge).

Shortcuts
  I aerial pass   Q (hovering a player): toggle Extra Effort ready
  V move    R run    P pass    D dribble    B wall pass    W switch wall
  Wall pass (B): drag from the passer into a wall until it snaps, then keep
    dragging to pull the rebound out (it only goes at the true angle). If you
    let go at the wall, move to set the length and click. Shift = loft on/off;
    lofted ones can play off the glass above a goal.
    Reach the next wall with the rebound and it snaps there too, so you can
    play it off a corner (up to 4 walls). Drag back to undo the last bounce.
    To re-aim: drag back toward the passer, slide along the wall to move the
    bounce point, or right-click / Backspace while drawing.
  Z zone    O circle F pen     T text       E eraser       U ruler
  1-5 colors (more swatches + a custom picker in the tool rail)
  Runs are solid lines, passes are dotted. A pass into a goal mouth is a shot.
  Playback has kick sounds (toggle Sound next to Loop).
  N next step   Space play/pause   Left/Right change step
  S shot windows   A pass range
  X (hovering a player): toggle defensive stance
  Right-click a player: stance, face the ball, make keeper, rename
  Right-click any drawing: color, run/pass/dribble, wall, edit text,
    duplicate, bring to front, delete
  Stance players: hover, then drag the white dot to turn them
  M minimap grid    L passing lanes   C space control   G pressure rings
  Views: buttons top-right of the pitch. Horizontal, Vertical, Tilted
    horizontal, Tilted vertical, Half pitch, plus Flip ends. Y cycles views
    (Shift+Y goes back). Tilted views need WebGL and go 3D: players stand
    up as pucks, the curb and glass walls and goals rise, lofted balls fly
    in a real arc.
  Right-click the ball to pick its design (all 11 in-game balls; Football
    is the classic, Bouncy is REMATCH's default). The Figures switch next to
    the view buttons shows standing players instead of pucks in tilted views.
  Zoom: mouse wheel (zooms toward the cursor), pinch on a touchscreen,
    + / - keys, or the buttons top-right of the pitch. 0 fits the pitch.
    Pan by dragging empty pitch, middle-mouse drag, or the overview inset.
    During playback any drag pans. K = follow the ball during playback.
  Style and colors: the round colour wheel button at the top right. Seven
    styles (Classic, Clipboard, Chalkboard, Picnic, On the Pitch, Futuristic,
    Joga Bonito) and nine colour schemes, same as the Taka Coaching Clipboard.
  Identical run length (Passing & runs card): the first run you draw in a
    step sets the max; later runs stop at it. Extra Effort adds a flat bonus
    (+6 units by default). Hover a player with the Run tool to see their reach.
  H clean view (for OBS / screen share)   Ctrl+Z undo   Ctrl+S save
  Players: + Add player under each team, or right-click empty pitch to add
    one there. Remove with the x in the roster, Delete while hovering, or
    right-click > Remove player. Each player can have a name tag and their
    own colour, and can switch teams. Ctrl+Z undoes any of it.
  Double-click a player to change their label.
  New plays start at kickoff: Home 1-3-1 kicking off, Away 1-2-2 defending.

Keeper / Sweeper
  The team's keeper has a yellow outline with a GK or SW tag. It updates
  the instant anyone moves: a keeper in the box is GK; if the keeper is
  out of the box, a teammate standing in the box becomes GK; a keeper
  out of the box but in their own half is Sweeper; a Sweeper who crosses
  halfway hands it to the teammate furthest back in their own half.
  Override it per step under Teams.

Pass range (A): Shot pass 60 units, Tap pass 55 units.

Hotkey hints
  Hover a player or start drawing and the shortcuts that apply show up next
  to the cursor (Shift = aerial while drawing a pass, V = Control/Volley,
  Q = Extra Effort while drawing a run). Turn them off under Teams.

Combos in one step
  Start a run, dribble or pass from the end of another arrow and it snaps
  there. Chained arrows play one after another: e.g. #2 passes into space and
  runs, #3 runs onto the pass, takes it, and dribbles on. Passes are timed so
  the ball arrives as the runner does; one-twos, dribble-then-pass and
  receive-then-shoot work the same way. Passing to yourself works too: flick
  or lob the ball into space and start the next pass where it lands; the
  player chases it (or follows a run you draw) and strikes it again. Volley
  hits it first time; Control takes a touch to settle it first. A combo step plays a little longer
  so every move is visible.
  New 5v5 plays start with the ball at #2's feet for the kickoff.

Player animation
  During playback players step while they run, take shorter touches while
  dribbling, and wind up and swing through the ball for passes and shots
  (bigger swing for shots, a scoop for lobs). With Figures on in the tilted
  view the whole body moves. Turn it off with Moves next to Sound.

Goalkeeper jumps
  Right-click a keeper > Jump (dive)..., point where the gloves go, click,
  then pick Catch, Deflect or Miss (right-click the jump later to switch or
  re-aim). The keeper times the jump to the shot. Catch: the ball goes into
  the gloves. Deflect: it goes along a pass you draw from the glove, or is
  parried away from goal if you don't draw one. Miss: the keeper dives as the
  ball goes past and it carries on. Catch and Deflect happen whenever the
  shot comes anywhere near the dive, so you don't need to aim it exactly.

Extra Effort and following
  A player with Extra Effort on a step glows blue with speed streaks while
  that step plays (the ring only shows during that step). The camera can
  follow the ball or any player: pick from the Follow list above the pitch.

Callout map
  Analysis > Callout map shows the named attacking spots (Deep Left/Right,
  PK, L, T, R, Z, and the ball-side spots Side, Q, A, B, Miss, K, F). The
  ball-side spots flip to whichever side the ball is on, and the map faces
  the goal the team on the ball is attacking.

Side panel
  Drag a section by its dotted grip to move it, the arrow folds it, and the
  x hides it. Hidden sections wait at the bottom of the panel; Reset layout
  puts everything back (Plays first).

Plays and folders
  Folders sort plays into categories: "+ Folder" makes one, drag a play onto
  a folder (or use ... > Move to), click a folder to open it, and the path
  above the list takes you back up. Search finds a play in any folder; Enter
  opens the top match. Save play and Import put plays in the folder you are
  looking at. Import takes many files at once, or drop them onto Plays.
  Desktop app: plays are .rematch.json files in Documents\REMATCH Tactics
  Plays, and its subfolders are the categories, so you can also organise
  them in Explorer/Finder. Plays > Change picks another folder (OneDrive,
  Dropbox, iCloud Drive...). Deleting sends the file to the Recycle Bin/Trash.
  Chrome/Edge: Plays > Use a folder does the same with a folder you choose.
  Plays already saved in the browser move into the folder the first time.

Launch
  Opens your last play, or a fresh kickoff for a first launch. Change it in
  Plays > On launch. The built-in Tutorial play is always at the top of Plays.

Maps
  Pitch card > 5v5 pitch / 1v1 court. The 1v1 court (Nova) is about 48 x 37.5
  units with slanted corner walls, low goals and no keepers. Wall passes
  bounce off the slanted corners too. Switching maps keeps your current
  play in Plays (if it has anything drawn) and starts a kickoff on the new map.
  Each saved play remembers its map.

Pen options
  With the Pen (F) picked, a bar at the bottom of the pitch sets thickness
  (thin / medium / thick, or [ and ]), Dotted (.) and See-through (,).
  Right-click any pen mark to change it later.

App icon
  Windows: double-click "Launch REMATCH Tactics.bat". For a proper installed app
  with its own icon in the Start menu and taskbar, use the website version:
  open the site in Chrome or Edge and click "Install" in the address bar.
  Mac: open "REMATCH Tactics.app" (drag it to the Dock to keep it). The first
  time, right-click > Open, since it isn't from the App Store. Keep it in
  this folder, next to rematch-tactics.html.
  The app window itself also shows the icon.

Window size
  The board opens maximized on Windows and at nearly full screen on Mac.

Phones and tablets
  Open the board's link (or this HTML file) on your phone. Drag with a finger,
  pinch to zoom, long-press anything for its menu (instead of right-click).
  Pass and wall-pass tools show Aerial / Lofted / Volley buttons on the pitch
  instead of Shift and V. Turning the phone swaps horizontal and vertical views.
  Wall pass on touch: drag into the wall, lift at the wall, then drag to set the
  rebound and lift again.
