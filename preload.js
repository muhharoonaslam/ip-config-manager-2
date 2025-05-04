const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getInterfaces: () => ipcRenderer.invoke('get-interfaces'),
  getCurrent: (iface) => ipcRenderer.invoke('get-current-config', iface),
  setConfig: (iface, lastOctet, mask) => ipcRenderer.invoke('set-config', iface, lastOctet, mask),
  reset: (iface) => ipcRenderer.invoke('reset-config', iface),
  createShortcut: (exePath, shortcutName, screen, remoteLocal, instructorStation) =>
    ipcRenderer.invoke('create-shortcut', exePath, shortcutName, screen, remoteLocal, instructorStation)
});
