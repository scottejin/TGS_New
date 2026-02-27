const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mytgsApi', {
  refresh: () => ipcRenderer.invoke('mytgs:refresh'),
  openLogin: () => ipcRenderer.invoke('mytgs:openLogin'),
  closeLogin: () => ipcRenderer.invoke('mytgs:closeLogin'),
});
