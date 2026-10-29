// REMATCH Tactics desktop app: the board in its own window (no browser needed).
const {app, BrowserWindow, Menu, shell, screen, ipcMain, dialog} = require('electron');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;

app.setName('REMATCH Tactics');
if (process.platform === 'win32') app.setAppUserModelId('com.bluewing.rematch-tactics');
if (!app.requestSingleInstanceLock()) app.quit();

let win = null;
function createWindow(){
  const wa = screen.getPrimaryDisplay().workAreaSize;
  win = new BrowserWindow({
    width: Math.round(wa.width*.9), height: Math.round(wa.height*.9), minWidth: 860, minHeight: 560,
    show: false, backgroundColor: '#0b1018', title: 'REMATCH Tactics',
    icon: path.join(__dirname, 'icon.png'), autoHideMenuBar: true,
    webPreferences: {contextIsolation: true, sandbox: true, spellcheck: false, autoplayPolicy: 'no-user-gesture-required', preload: path.join(__dirname, 'preload.js')}
  });
  win.maximize();
  win.loadFile(path.join(__dirname, 'index.html'));
  win.once('ready-to-show', () => win.show());
  win.on('page-title-updated', e => e.preventDefault());
  // links open in the normal browser; the app window only ever shows the board
  win.webContents.setWindowOpenHandler(({url}) => { if (/^https?:/i.test(url)) shell.openExternal(url); return {action: 'deny'}; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file:')){ e.preventDefault(); if (/^https?:/i.test(url)) shell.openExternal(url); } });
  // Export PNG / Export play file: ask where to save
  win.webContents.session.on('will-download', (e, item) => {
    item.setSaveDialogOptions({title: 'Save', defaultPath: path.join(app.getPath('downloads'), item.getFilename())});
  });
  win.on('closed', () => { win = null; });
  watchRoot();
}

Menu.setApplicationMenu(process.platform === 'darwin'
  ? Menu.buildFromTemplate([{role: 'appMenu'}, {role: 'editMenu'}, {label: 'View', submenu: [{role: 'togglefullscreen'}, {role: 'resetZoom'}, {role: 'zoomIn'}, {role: 'zoomOut'}]}, {role: 'windowMenu'}])
  : null);
app.on('second-instance', () => { if (win){ if (win.isMinimized()) win.restore(); win.focus(); } });

/* ---------- plays folder ----------
   Plays are .rematch.json files in a folder on this computer (default: Documents/REMATCH Tactics Plays).
   Subfolders are categories. The board can only touch files inside that folder. */
const cfgFile = () => path.join(app.getPath('userData'), 'plays-folder.json');
let root = null, watcher = null, fireT = null;
function defaultRoot(){ return path.join(app.getPath('documents'), 'REMATCH Tactics Plays'); }
function getRoot(){
  if (root) return root;
  try { const c = JSON.parse(fs.readFileSync(cfgFile(), 'utf8')); if (c.root && fs.existsSync(c.root)) root = c.root; } catch {}
  if (!root){ root = defaultRoot(); fs.mkdirSync(root, {recursive: true}); }
  return root;
}
function setRoot(r){ root = r; try { fs.writeFileSync(cfgFile(), JSON.stringify({root: r})); } catch {} watchRoot(); }
function inside(rel, wantFile){
  if (typeof rel !== 'string' || rel.length > 400) throw new Error('bad path');
  const parts = rel.split(/[\\/]+/).filter(Boolean);
  if (parts.some(p => p === '.' || p === '..' || /[<>:"|?*\x00-\x1f]/.test(p) || p.startsWith('.'))) throw new Error('bad path');
  if (wantFile && !/\.json$/i.test(parts[parts.length - 1] || '')) throw new Error('only play files');
  const r = getRoot(), full = path.resolve(r, ...parts);
  if (full !== r && !full.startsWith(r + path.sep)) throw new Error('outside folder');
  return full;
}
const toRel = full => path.relative(getRoot(), full).split(path.sep).join('/');
function watchRoot(){
  try { if (watcher) watcher.close(); } catch {} watcher = null;
  try { watcher = fs.watch(getRoot(), {recursive: true}, () => { clearTimeout(fireT); fireT = setTimeout(() => { if (win) win.webContents.send('plays-changed'); }, 350); }); } catch {}
}
async function walk(dir, depth, out){
  let ents = []; try { ents = await fsp.readdir(dir, {withFileTypes: true}); } catch { return; }
  for (const e of ents){
    if (e.name.startsWith('.') || out.files.length > 3000) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()){ if (depth < 8){ out.folders.push(toRel(full)); await walk(full, depth + 1, out); } }
    else if (e.isFile() && /\.json$/i.test(e.name)){
      try { const st = await fsp.stat(full); if (st.size > 8e6) continue; out.files.push({path: toRel(full), text: await fsp.readFile(full, 'utf8'), mtime: st.mtimeMs}); } catch {}
    }
  }
}
ipcMain.handle('plays:info', () => { const r = getRoot(); return {root: r, label: r.replace(app.getPath('home'), '~'), isDefault: r === defaultRoot()}; });
ipcMain.handle('plays:list', async () => { const out = {folders: [], files: []}; await walk(getRoot(), 0, out); return out; });
ipcMain.handle('plays:write', async (e, rel, text, exclusive) => {
  const f = inside(rel, true); await fsp.mkdir(path.dirname(f), {recursive: true});
  if (exclusive && fs.existsSync(f)) return {ok: false, exists: true};
  const tmp = f + '.tmp-' + process.pid; await fsp.writeFile(tmp, String(text), 'utf8'); await fsp.rename(tmp, f); return {ok: true};
});
ipcMain.handle('plays:move', async (e, from, to) => {
  const a = inside(from), b = inside(to); if (fs.existsSync(b)) return {ok: false, exists: true};
  await fsp.mkdir(path.dirname(b), {recursive: true}); await fsp.rename(a, b); return {ok: true};
});
ipcMain.handle('plays:remove', async (e, rel) => { const f = inside(rel, true); try { await shell.trashItem(f); } catch { await fsp.unlink(f); } return {ok: true}; });
ipcMain.handle('plays:mkdir', async (e, rel) => { await fsp.mkdir(inside(rel), {recursive: true}); return {ok: true}; });
ipcMain.handle('plays:rmdir', async (e, rel) => {
  const d = inside(rel); if (d === getRoot()) return {ok: false};
  const left = (await fsp.readdir(d)).filter(n => !/^(\.DS_Store|desktop\.ini|Thumbs\.db)$/i.test(n));
  if (left.length) return {ok: false, notEmpty: true};
  try { await shell.trashItem(d); } catch { await fsp.rm(d, {recursive: true}); } return {ok: true};
});
ipcMain.handle('plays:reveal', (e, rel) => { const f = rel ? inside(rel) : getRoot(); if (rel && fs.existsSync(f) && fs.statSync(f).isFile()) shell.showItemInFolder(f); else shell.openPath(f); return {ok: true}; });
ipcMain.handle('plays:choose', async () => {
  const r = await dialog.showOpenDialog(win, {title: 'Choose your plays folder', defaultPath: getRoot(), properties: ['openDirectory', 'createDirectory']});
  if (r.canceled || !r.filePaths[0]) return null; setRoot(r.filePaths[0]); return {root: root};
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
