const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('conflictRadar', {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome
  }
});

contextBridge.exposeInMainWorld('centinela', {
  selectSite: (index) => ipcRenderer.send('navigate', index),
  getCurrent: () => ipcRenderer.invoke('get-current')
});