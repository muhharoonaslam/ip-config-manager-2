const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  getInterfaces: () => ipcRenderer.invoke('get-interfaces'),
  getCurrent: iface => ipcRenderer.invoke('get-current-config', iface),
  setConfig: (iface, octet, mask) => ipcRenderer.invoke('set-config', iface, octet, mask),
  reset: iface => ipcRenderer.invoke('reset-config', iface)
});
