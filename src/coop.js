/* ======================= CO-OP =======================
   Several people on one board. The play is split into small pieces (each player position, each drawing,
   each step) so two people editing different things at once both keep their edits.
   Transport: Firebase Realtime Database (config baked in at build time, or pasted in Server settings),
   or a local test transport (?coop=local) that links tabs on one computer. */
const COOP_CONFIG = /*COOP_CONFIG*/null/*END*/;
const COOP_KEY = 'rematch-tactics.coop.v1';
const COOP_COLS = ['#ff7a45', '#3fb6ff', '#4fd18b', '#f2b33d', '#9b6bff', '#ff8ad8', '#2fe0c0', '#ff5d5d'];
const coop = {on:false, code:null, host:false, meta:{}, peers:{}, db:null, boardRef:null, metaRef:null, peopleRef:null, meRef:null,
  lastFlat:null, lastVal:null, pending:false, applying:false, connected:true, follow:true, seenSeq:0, curT:0, open:false, busyJoin:false, err:''};
const coopPrefs = (() => { let p = {}; try { p = JSON.parse(localStorage.getItem(COOP_KEY)) || {}; } catch {}
  p.hosted = p.hosted || {}; p.col = p.col || COOP_COLS[Math.floor(Math.random()*COOP_COLS.length)]; p.name = p.name || ''; return p; })();
function saveCoopPrefs(){ try { /* merge: another window may have hosted a session meanwhile */
  const cur = JSON.parse(localStorage.getItem(COOP_KEY)) || {}; coopPrefs.hosted = {...(cur.hosted || {}), ...(coopPrefs.hosted || {})};
  localStorage.setItem(COOP_KEY, JSON.stringify(coopPrefs)); } catch {} }
saveCoopPrefs();
/* each window is its own person in a session (two tabs = two people); a host who reloads gets the host role back */
coop.cid = ('c' + uid() + uid()).slice(0, 14);

/* ---- board <-> shared pieces ---- */
function sj(v){ /* JSON with sorted keys, so every computer writes identical text for identical data */
  if (Array.isArray(v)) return '[' + v.map(sj).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).sort().filter(k => v[k] !== undefined).map(k => JSON.stringify(k) + ':' + sj(v[k])).join(',') + '}';
  return JSON.stringify(v === undefined ? null : v);
}
const pj = (s, d) => { try { return JSON.parse(s); } catch { return d; } };
const safeKey = k => /^[^.#$\[\]\/]+$/.test(k);
function coopEnc(d){
  const o = {meta:{v:d.v || 2, id:d.id, name:d.name || 'Untitled play', map:d.map || '5v5', nf:d.frames.length, show:sj(d.show || {}), teams:sj(d.teams || {})}, pieces:{}, frames:{}};
  d.pieces.forEach((p, i) => { if (safeKey(p.id)) o.pieces[p.id] = sj({...p, o:i}); });
  d.frames.forEach((f, i) => {
    const {pos, shapes, ...rest} = f, e = {pos:{}, shapes:{}, rest:sj(rest)};
    for (const id in pos) if (safeKey(id) && pos[id]) e.pos[id] = {x:+pos[id].x, y:+pos[id].y};
    (shapes || []).forEach((s, j) => { if (s.id && safeKey(s.id)) e.shapes[s.id] = sj({...s, z:j}); });
    o.frames['f' + i] = e;
  });
  return o;
}
function coopDec(v){
  if (!v || !v.meta || !v.meta.nf) return null;
  const m = v.meta, d = {v:m.v || 2, id:m.id || uid(), name:m.name || 'Untitled play', map:m.map || '5v5', show:pj(m.show, {home:true, away:true}), teams:pj(m.teams, null), pieces:[], frames:[]};
  d.pieces = Object.values(v.pieces || {}).map(s => pj(s, null)).filter(Boolean).sort((a, b) => a.o - b.o).map(({o, ...p}) => p);
  for (let i = 0; i < m.nf; i++){
    const e = (v.frames || {})['f' + i] || {}, pos = {};
    for (const id in (e.pos || {})) pos[id] = {x:+e.pos[id].x, y:+e.pos[id].y};
    const shapes = Object.values(e.shapes || {}).map(s => pj(s, null)).filter(Boolean).sort((a, b) => a.z - b.z).map(({z, ...s}) => s);
    d.frames.push({...pj(e.rest, {}), pos, shapes});
  }
  if (!d.teams || !d.pieces.length) return null;
  return normalize(d);
}
function coopFlat(o, pre, out){ out = out || {}; for (const k in o){ const v = o[k], p = pre ? pre + '/' + k : k; if (v && typeof v === 'object') coopFlat(v, p, out); else if (v !== undefined && v !== null) out[p] = v; } return out; }
function flatSame(a, b){ const ka = Object.keys(a); if (ka.length !== Object.keys(b).length) return false; for (const k of ka) if (a[k] !== b[k]) return false; return true; }

/* ---- transports ---- */
function coopConfig(){
  if (/[?&#]coop=local\b/.test(location.search + location.hash) || coopPrefs.server === 'local') return 'local';
  return coopPrefs.custom || COOP_CONFIG || null;
}
function parseFirebaseConfig(text){
  /* accepts the JSON or the "const firebaseConfig = {...}" snippet the Firebase console shows */
  const pick = k => { const m = String(text).match(new RegExp("[\"']?" + k + "[\"']?\\s*:\\s*[\"']([^\"']+)[\"']")); return m ? m[1] : ''; };
  const c = {apiKey:pick('apiKey'), authDomain:pick('authDomain'), databaseURL:pick('databaseURL'), projectId:pick('projectId'), appId:pick('appId')};
  return c.databaseURL && c.apiKey ? c : null;
}
function makeLocalDB(){
  const KEY = 'rematch-tactics.coop.localdb', bc = ('BroadcastChannel' in window) ? new BroadcastChannel('rematch-coop-local') : null, listeners = [], disc = [];
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  const get = (t, path) => path.split('/').filter(Boolean).reduce((o, k) => o == null ? undefined : o[k], t);
  const setAt = (t, path, v) => { const ks = path.split('/').filter(Boolean); let o = t;
    for (let i = 0; i < ks.length - 1; i++){ if (!o[ks[i]] || typeof o[ks[i]] !== 'object') o[ks[i]] = {}; o = o[ks[i]]; }
    const last = ks[ks.length - 1]; if (v === null || v === undefined) delete o[last]; else o[last] = (v && typeof v === 'object' && v['.sv']) ? Date.now() : clone(v); };
  const prune = o => { for (const k in o){ if (o[k] && typeof o[k] === 'object'){ prune(o[k]); if (!Object.keys(o[k]).length) delete o[k]; } } };
  const snap = v => ({val:() => v === undefined ? null : clone(v), exists:() => v !== undefined});
  const fire = () => { const t = load(); for (const l of listeners.slice()){ const v = get(t, l.path), s = JSON.stringify(v === undefined ? null : v); if (s !== l.last){ l.last = s; l.cb(snap(v)); } } };
  if (bc) bc.onmessage = fire; window.addEventListener('storage', e => { if (e.key === KEY) fire(); });
  const write = fn => { const t = load(); fn(t); prune(t); try { localStorage.setItem(KEY, JSON.stringify(t)); } catch {} fire(); if (bc) bc.postMessage(1); return Promise.resolve(); };
  window.addEventListener('pagehide', () => { for (const p of disc) write(t => setAt(t, p, null)); });
  const ref = path => ({
    child:c => ref(path + '/' + c),
    on:(ev, cb) => { const l = {path, cb, last:undefined}; listeners.push(l); setTimeout(() => { const v = get(load(), path); l.last = JSON.stringify(v === undefined ? null : v); cb(snap(v)); }); },
    off:() => { for (let i = listeners.length - 1; i >= 0; i--) if (listeners[i].path === path) listeners.splice(i, 1); },
    once:() => Promise.resolve(snap(get(load(), path))),
    set:v => write(t => setAt(t, path, v)),
    update:o => write(t => { for (const k in o) setAt(t, path + '/' + k, o[k]); }),
    remove:() => write(t => setAt(t, path, null)),
    onDisconnect:() => ({remove:() => { disc.push(path); return Promise.resolve(); }, cancel:() => Promise.resolve()})
  });
  return {kind:'local', ref, ts:() => ({'.sv':'timestamp'}), connected:cb => cb(true), close(){}};
}
function makeFirebaseDB(cfg){
  if (!window.firebase){ const src = document.getElementById('fbsdk'); if (!src) throw new Error('Co-op library missing from this build');
    const s = document.createElement('script'); s.textContent = src.textContent; document.head.appendChild(s); }
  const fb = window.firebase; if (!fb || !fb.database) throw new Error('Co-op library failed to load');
  const app = fb.apps.find(a => a.name === 'coop') || fb.initializeApp(cfg, 'coop'), db = app.database();
  const wrap = r => ({
    child:c => wrap(r.child(c)),
    on:(ev, cb) => r.on('value', s => cb({val:() => s.val(), exists:() => s.exists()}), err => coopFail(err)),
    off:() => r.off(),
    once:() => r.once('value').then(s => ({val:() => s.val(), exists:() => s.exists()})),
    set:v => r.set(v), update:o => r.update(o), remove:() => r.remove(),
    onDisconnect:() => r.onDisconnect()
  });
  return {kind:'firebase', ref:p => wrap(db.ref(p)), ts:() => fb.database.ServerValue.TIMESTAMP,
    connected:cb => db.ref('.info/connected').on('value', s => cb(!!s.val())), close(){ try { db.ref('.info/connected').off(); } catch {} }};
}
function coopDB(){
  const cfg = coopConfig();
  if (!cfg){ coop.err = 'setup'; renderCoop(); return null; }
  try { coop.err = ''; return cfg === 'local' ? makeLocalDB() : makeFirebaseDB(cfg); }
  catch (e){ coop.err = e.message || String(e); renderCoop(); return null; }
}
function coopFail(err){
  const msg = String(err && (err.code || err.message) || err);
  coop.err = /permission/i.test(msg) ? 'The co-op server refused access (check the database rules in the setup guide).' : 'Co-op connection problem: ' + msg;
  renderCoop(); toast(coop.err);
}

/* ---- session ---- */
/* never hang on a server that can't be reached */
const within = (pr, ms = 10000) => Promise.race([pr, new Promise((_, rej) => setTimeout(() => rej(new Error("Couldn't reach the co-op server. Check your internet connection and try again.")), ms))]);
const ROOM_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newCode = () => Array.from({length:6}, () => ROOM_CHARS[Math.floor(Math.random()*ROOM_CHARS.length)]).join('');
const cleanCode = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
function coopName(){ const n = ($('#coopName') && $('#coopName').value.trim()) || coopPrefs.name; if (n && n !== coopPrefs.name){ coopPrefs.name = n.slice(0, 20); saveCoopPrefs(); } return coopPrefs.name || 'Player'; }
async function coopHost(){
  if (coop.on || coop.busyJoin) return; const name = coopName(); const db = coopDB(); if (!db) return;
  coop.busyJoin = true; renderCoop();
  try {
    let code = newCode();
    for (let i = 0; i < 4; i++){ const s = await within(db.ref('rooms/' + code + '/meta').once('value')); if (!s.exists()) break; code = newCode(); }
    stopPlay(); if (doc.tutorial){ delete doc.tutorial; }
    coopPrefs.hosted = Object.fromEntries(Object.entries(coopPrefs.hosted).slice(-20)); coopPrefs.hosted[code] = coop.cid; saveCoopPrefs();
    await within(db.ref('rooms/' + code).set({meta:{host:coop.cid, hostName:name, editAll:true, follow:false, created:db.ts()}, board:coopEnc(doc)}));
    coopAttach(db, code, true);
    toast(`Session ${code} is live. Share the code so others can join.`);
  } catch (e){ coopFail(e); }
  finally { coop.busyJoin = false; renderCoop(); }
}
async function coopJoin(raw){
  if (coop.on || coop.busyJoin) return; const code = cleanCode(raw);
  if (code.length < 4){ toast('Type the room code you were sent.'); return; }
  coopName(); const db = coopDB(); if (!db) return;
  coop.busyJoin = true; renderCoop();
  try {
    const s = await within(db.ref('rooms/' + code + '/meta').once('value'));
    if (!s.exists()){ toast(`No live session with code ${code}. Check the code with the host.`); return; }
    stopPlay(); saveToLibrary(true); /* your own play is kept in Plays */
    try { coopPrefs.hosted = {...coopPrefs.hosted, ...((JSON.parse(localStorage.getItem(COOP_KEY)) || {}).hosted || {})}; } catch {}
    if (coopPrefs.hosted[code] && coopPrefs.hosted[code] === s.val().host){ /* the host coming back (e.g. after a reload), unless that host is still here in another tab */
      const here = await within(db.ref('rooms/' + code + '/people/' + s.val().host).once('value')); if (!here.exists()) coop.cid = coopPrefs.hosted[code]; }
    coopAttach(db, code, s.val().host === coop.cid);
    toast(`Joined ${s.val().hostName || 'the host'}'s session.`);
  } catch (e){ coopFail(e); }
  finally { coop.busyJoin = false; renderCoop(); }
}
function coopAttach(db, code, isHost){
  Object.assign(coop, {db, code, on:true, host:isHost, meta:{}, peers:{}, lastFlat:null, lastVal:null, pending:false, seenSeq:0, connected:true});
  const root = 'rooms/' + code;
  coop.boardRef = db.ref(root + '/board'); coop.metaRef = db.ref(root + '/meta'); coop.peopleRef = db.ref(root + '/people'); coop.meRef = db.ref(root + '/people/' + coop.cid);
  coop.meRef.onDisconnect().remove();
  coop.meRef.set({name:coopPrefs.name || 'Player', col:coopPrefs.col, t:db.ts()});
  coop.boardRef.on('value', s => coopOnBoard(s.val()));
  coop.metaRef.on('value', s => { coop.meta = s.val() || {}; if (coop.meta.host === coop.cid) coop.host = true; coopOnMeta(); });
  coop.peopleRef.on('value', s => { coop.peers = s.val() || {}; coopRoles(); renderCoop(); drawCursors(); });
  db.connected(c => { coop.connected = c; renderCoopBadge(); renderCoop(); });
  if (/^https?:/.test(location.protocol)) try { history.replaceState(null, '', location.pathname + location.search + '#join=' + code); } catch {}
  renderCoop(); renderCoopBadge();
}
function coopLeave(){
  if (!coop.on) return;
  for (const r of [coop.boardRef, coop.metaRef, coop.peopleRef]) try { r.off(); } catch {}
  try { coop.meRef.onDisconnect().cancel && coop.meRef.onDisconnect().cancel(); } catch {}
  try { coop.meRef.remove(); } catch {}
  try { coop.db.close(); } catch {}
  Object.assign(coop, {on:false, code:null, host:false, meta:{}, peers:{}, db:null, boardRef:null, metaRef:null, peopleRef:null, meRef:null, lastFlat:null, lastVal:null, pending:false});
  doc.id = uid(); saveToLibrary(true); /* keep a copy of where the session ended */
  if (/^https?:/.test(location.protocol)) try { history.replaceState(null, '', location.pathname + location.search); } catch {}
  coopRoles(); renderCoop(); renderCoopBadge(); drawCursors(); toast('Left the session. A copy of the board is in your Plays.');
}

/* ---- keeping everyone's board the same ---- */
const coopBusy = () => !!((drag && drag.moved) || draft || pinch || anim.playing || !$('#floatEdit').hidden);
function coopPush(){
  if (!coop.on || !coop.boardRef || coop.applying) return;
  if (!coopCanEdit()){ if (coop.lastVal) coopApply(true); return; } /* watching only: snap back to the shared board */
  const flat = coopFlat(coopEnc(doc)), prev = coop.lastFlat || {}, up = {}; let n = 0;
  for (const k in flat) if (prev[k] !== flat[k]){ up[k] = flat[k]; n++; }
  for (const k in prev) if (!(k in flat)){ up[k] = null; n++; }
  if (!n) return;
  coop.lastFlat = flat;
  coop.boardRef.update(up).catch(coopFail);
}
function coopOnBoard(val){
  if (!val){ if (coop.on){ toast('The host closed this session.'); coopLeave(); } return; }
  coop.lastVal = val;
  if (coopBusy()){ coop.pending = true; return; }
  coopApply();
}
function coopApply(force){
  coop.pending = false; const val = coop.lastVal; if (!val) return;
  const flat = coopFlat(val), local = coopFlat(coopEnc(doc));
  coop.lastFlat = flat;
  if (!force && flatSame(flat, local)) return;
  const d = coopDec(clone(val)); if (!d) return;
  doc = d; cur = clamp(cur, 0, doc.frames.length - 1);
  if (sel && !frame().shapes.some(s => s.id === sel)) sel = null;
  coop.applying = true; try { refreshAll(); } finally { coop.applying = false; }
}
setInterval(() => {
  if (!coop.on) return;
  if (drag && drag.moved) coopPush();               /* others see a drag as it happens */
  if (coop.pending && !coopBusy()) coopApply();      /* changes that arrived mid-drag */
}, 90);

/* ---- who can edit; follow the host ---- */
const hostHere = () => !!(coop.meta.host && coop.peers[coop.meta.host]);
function coopCanEdit(){ return !coop.on || coop.host || coop.meta.editAll !== false || !hostHere(); }
function coopRoles(){ document.documentElement.classList.toggle('coop-ro', !coopCanEdit()); }
function coopOnMeta(){
  coopRoles(); renderCoop();
  const v = coop.meta.view;
  if (!coop.host && coop.follow && coop.meta.follow && v && v.seq && v.seq !== coop.seenSeq){
    coop.seenSeq = v.seq;
    if (v.playing){ if (anim.playing) stopPlay(); cur = clamp(v.step, 0, doc.frames.length - 1); renderTimeline(); startPlay(); }
    else { stopPlay(); if (v.step !== cur) goStep(v.step); }
  }
}
function coopView(){
  if (!coop.on || !coop.host || !coop.meta.follow) return;
  coop.metaRef.child('view').set({step:cur, playing:anim.playing, seq:Date.now() + Math.random()}).catch(coopFail);
}
/* the host's step changes and playback are announced to followers */
{ const g = goStep, sp = startPlay, st = stopPlay;
  goStep = function(i){ const before = cur; g(i); if (cur !== before) coopView(); };
  startPlay = function(){ sp(); if (anim.playing) coopView(); };
  stopPlay = function(){ const was = anim.playing; st(); if (was) coopView(); }; }

/* ---- live cursors ---- */
function coopCursor(p){
  if (!coop.on || !coop.meRef) return; const now = performance.now();
  if (p && now - coop.curT < 60) return; coop.curT = now;
  coop.meRef.update(p ? {x:Math.round(p.x*10)/10, y:Math.round(p.y*10)/10, s:cur} : {x:null, y:null}).catch(() => {});
}
cv.addEventListener('pointermove', e => { if (coop.on) coopCursor(toField(e)); });
cv.addEventListener('pointerleave', () => { if (coop.on) coopCursor(null); });
function drawCursors(){
  const box = $('#coopCursors'); if (!box) return;
  if (!coop.on){ if (box.innerHTML) box.innerHTML = ''; return; }
  let html = '';
  for (const id in coop.peers){
    const pr = coop.peers[id]; if (id === coop.cid || pr.x == null || pr.y == null) continue;
    if (pr.s != null && pr.s !== cur) continue; /* only people looking at the same step */
    const q = toScreen({x:pr.x, y:pr.y});
    html += `<div class="cc" style="left:${q.x.toFixed(1)}px;top:${q.y.toFixed(1)}px;--c:${esc(pr.col || '#fff')}"><svg viewBox="0 0 16 16" width="16" height="16"><path d="M2 1l11 6-5 1.4L5.6 13z" fill="var(--c)" stroke="#0b1018" stroke-width="1.2" stroke-linejoin="round"/></svg><span>${esc(pr.name || 'Player')}</span></div>`;
  }
  box.innerHTML = html;
}

/* ---- panel ---- */
function renderCoopBadge(){
  const b = $('#coopBtn'); if (!b) return;
  const n = Object.keys(coop.peers).length;
  b.classList.toggle('live', coop.on); b.classList.toggle('offline', coop.on && !coop.connected);
  $('#coopLbl').textContent = coop.on ? (coop.connected ? `Live · ${n}` : 'Reconnecting') : 'Co-op';
}
function renderCoop(){
  renderCoopBadge();
  const pop = $('#coopPop'); if (!pop || pop.hidden) return;
  const cfg = coopConfig(), ready = !!cfg;
  let h = '<h2>Co-op</h2>';
  if (!coop.on){
    h += `<p class="lk-hint">Plan together: everyone in a session sees the same board and can draw on it live.</p>
      <label class="co-row">Your name<input class="field" id="coopName" maxlength="20" placeholder="e.g. Joseph" value="${esc(coopPrefs.name)}"></label>
      <button class="btn primary co-wide" id="coopHostBtn" ${!ready || coop.busyJoin ? 'disabled' : ''}>Host a session</button>
      <div class="co-join"><input class="field" id="coopCode" maxlength="8" placeholder="Room code" autocomplete="off" spellcheck="false" value="${esc(coop.prefill || '')}"><button class="btn" id="coopJoinBtn" ${!ready || coop.busyJoin ? 'disabled' : ''}>Join</button></div>`;
    if (!ready) h += `<p class="co-warn">Co-op needs its server details first. Open <b>Server settings</b> below and paste the Firebase config.</p>`;
  } else {
    const link = /^https?:/.test(location.protocol) ? location.origin + location.pathname + '#join=' + coop.code : '';
    h += `<div class="co-code"><span>Room code</span><b>${coop.code}</b></div>
      <div class="row"><button class="btn" id="coopCopyCode">Copy code</button>${link ? '<button class="btn" id="coopCopyLink">Copy invite link</button>' : ''}</div>
      <div class="co-status ${coop.connected ? 'ok' : 'bad'}">${coop.connected ? 'Connected' : 'Reconnecting… your changes will send when it\'s back'}</div>
      <div class="lk-label">In this session</div><ul class="co-people">`;
    const ids = Object.keys(coop.peers).sort((a, b) => (a === coop.meta.host ? -1 : b === coop.meta.host ? 1 : 0));
    for (const id of ids){ const pr = coop.peers[id];
      h += `<li><i style="background:${esc(pr.col || '#888')}"></i>${esc(pr.name || 'Player')}${id === coop.cid ? ' <small>(you)</small>' : ''}${id === coop.meta.host ? ' <em>host</em>' : ''}</li>`; }
    h += '</ul>';
    if (coop.host){
      h += `<label class="toggle"><span>Everyone can edit<small>Off: only you edit, everyone else watches</small></span><input type="checkbox" id="coopEditAll" ${coop.meta.editAll !== false ? 'checked' : ''}></label>
        <label class="toggle"><span>Everyone follows me<small>Your step changes and playback show on everyone's board</small></span><input type="checkbox" id="coopFollowAll" ${coop.meta.follow ? 'checked' : ''}></label>`;
    } else {
      if (!coopCanEdit()) h += '<p class="co-warn">The host is editing. You can watch, zoom and change views.</p>';
      if (coop.meta.follow) h += `<label class="toggle"><span>Follow the host<small>Their steps and playback show here</small></span><input type="checkbox" id="coopFollow" ${coop.follow ? 'checked' : ''}></label>`;
    }
    h += '<button class="btn danger co-wide" id="coopLeaveBtn">Leave session</button>';
  }
  h += `<details class="co-server"><summary>Server settings</summary>
    <p class="lk-hint">${COOP_CONFIG ? 'This build already has a co-op server. Paste a different one only if you run your own.' : 'Paste the Firebase web config (from the setup guide).'}</p>
    <textarea class="field" id="coopCfg" rows="4" placeholder="const firebaseConfig = { apiKey: ..., databaseURL: ... }">${coopPrefs.custom ? esc(JSON.stringify(coopPrefs.custom)) : ''}</textarea>
    <div class="row"><button class="btn" id="coopCfgSave">Save server</button>${coopPrefs.custom ? '<button class="btn" id="coopCfgClear">Use built-in</button>' : ''}</div></details>`;
  if (coop.err && coop.err !== 'setup') h += `<p class="co-warn">${esc(coop.err)}</p>`;
  pop.innerHTML = h;
}
function openCoop(open){
  coop.open = open === undefined ? !coop.open : open;
  $('#coopPop').hidden = !coop.open; $('#coopBtn').setAttribute('aria-expanded', coop.open);
  if (coop.open){ renderCoop(); const f = $('#coopName'); if (f && !f.value) f.focus(); }
}
$('#coopBtn').addEventListener('click', e => { e.stopPropagation(); openCoop(); });
document.addEventListener('click', e => { if (coop.open && !$('#coopPop').contains(e.target) && !$('#coopBtn').contains(e.target)) openCoop(false); });
$('#coopPop').addEventListener('click', e => {
  e.stopPropagation(); const b = e.target.closest('button'); if (!b) return;
  if (b.id === 'coopHostBtn') coopHost();
  else if (b.id === 'coopJoinBtn') coopJoin($('#coopCode').value);
  else if (b.id === 'coopLeaveBtn') coopLeave();
  else if (b.id === 'coopCopyCode' || b.id === 'coopCopyLink'){
    const t = b.id === 'coopCopyCode' ? coop.code : location.origin + location.pathname + '#join=' + coop.code;
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('Copied.'), () => toast(t));
  }
  else if (b.id === 'coopCfgSave'){ const c = parseFirebaseConfig($('#coopCfg').value);
    if (!c){ toast('That doesn\'t look like a Firebase config. It needs apiKey and databaseURL.'); return; }
    coopPrefs.custom = c; saveCoopPrefs(); coop.err = ''; renderCoop(); toast('Co-op server saved.'); }
  else if (b.id === 'coopCfgClear'){ delete coopPrefs.custom; saveCoopPrefs(); renderCoop(); }
});
$('#coopPop').addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'coopEditAll' && coop.host) coop.metaRef.child('editAll').set(t.checked).catch(coopFail);
  if (t.id === 'coopFollowAll' && coop.host){ coop.metaRef.child('follow').set(t.checked).then(() => { coop.meta.follow = t.checked; coopView(); }).catch(coopFail); }
  if (t.id === 'coopFollow'){ coop.follow = t.checked; if (t.checked){ coop.seenSeq = 0; coopOnMeta(); } }
  if (t.id === 'coopName'){ coopName(); if (coop.on) coop.meRef.update({name:coopPrefs.name}).catch(() => {}); }
});
$('#coopPop').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'coopCode'){ e.preventDefault(); coopJoin(e.target.value); } e.stopPropagation(); });
/* invite links: ...#join=CODE opens the panel ready to join */
function coopFromLink(){ const m = (location.hash || '').match(/join=([A-Za-z0-9]{4,12})/); if (m && !coop.on){ coop.prefill = cleanCode(m[1]); openCoop(true); const f = $('#coopName'); if (f) f.focus(); } }
window.addEventListener('hashchange', coopFromLink);
window.addEventListener('beforeunload', () => { if (coop.on) try { coop.meRef.remove(); } catch {} });
