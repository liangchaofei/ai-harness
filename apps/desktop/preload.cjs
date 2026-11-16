// 【新增文件】给页面公开固定操作，并省略 IPC 事件对象。
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('task', {
  start: () => ipcRenderer.invoke('task:start'),
  cancel: () => ipcRenderer.invoke('task:cancel'),
  onProgress(callback) {
    const listener = (_event, update) => callback(update);
    ipcRenderer.on('task:progress', listener);
    return () => ipcRenderer.removeListener('task:progress', listener);
  },
});
