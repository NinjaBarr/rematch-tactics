// Gives the board one narrow door to the plays folder on this computer.
const {contextBridge, ipcRenderer} = require('electron');
let onChange = null, onUpd = null;
ipcRenderer.on('update-progress', (e, pct) => { if (onUpd) onUpd(pct); });
ipcRenderer.on('plays-changed', () => { if (onChange) onChange(); });
contextBridge.exposeInMainWorld('rtFS', {
  arch: process.arch,
  info: () => ipcRenderer.invoke('plays:info'),
  list: () => ipcRenderer.invoke('plays:list'),
  write: (rel, text, exclusive) => ipcRenderer.invoke('plays:write', rel, text, !!exclusive),
  move: (from, to) => ipcRenderer.invoke('plays:move', from, to),
  remove: rel => ipcRenderer.invoke('plays:remove', rel),
  mkdir: rel => ipcRenderer.invoke('plays:mkdir', rel),
  rmdir: rel => ipcRenderer.invoke('plays:rmdir', rel),
  reveal: rel => ipcRenderer.invoke('plays:reveal', rel),
  choose: () => ipcRenderer.invoke('plays:choose'),
  onChange: fn => { onChange = fn; },
  installUpdate: (url, progress) => { onUpd = progress || null; return ipcRenderer.invoke('update:install', url); }
});
