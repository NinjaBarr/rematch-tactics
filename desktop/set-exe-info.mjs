// Puts the REMATCH Tactics icon, name and version into a Windows .exe (works on Linux, no Windows tools needed).
import fs from 'fs';
import * as ResEdit from 'resedit';
const [,, exePath, icoPath, VER0] = process.argv; const VER = VER0 || '1.0.0';
const exe = ResEdit.NtExecutable.from(fs.readFileSync(exePath), {ignoreCert: true});
const res = ResEdit.NtExecutableResource.from(exe);
const ico = ResEdit.Data.IconFile.from(fs.readFileSync(icoPath));
ResEdit.Resource.IconGroupEntry.replaceIconsForResource(res.entries, 1, 1033, ico.icons.map(i => i.data));
const vi = ResEdit.Resource.VersionInfo.fromEntries(res.entries)[0];
const lang = {lang: 1033, codepage: 1200};
vi.setStringValues(lang, {ProductName: 'REMATCH Tactics', FileDescription: 'REMATCH Tactics', CompanyName: 'BlueWing',
  InternalName: 'REMATCH Tactics', OriginalFilename: 'REMATCH Tactics.exe', LegalCopyright: 'BlueWing', FileVersion: VER, ProductVersion: VER});
const [a1, a2, a3] = VER.split('.').map(n => +n || 0); vi.setFileVersion(a1, a2, a3, 0, 1033); vi.setProductVersion(a1, a2, a3, 0, 1033);
vi.outputToResourceEntries(res.entries);
res.outputResource(exe);
fs.writeFileSync(exePath, Buffer.from(exe.generate()));
console.log('updated', exePath);
