// 给页面公开固定操作，并省略 IPC 事件对象。
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('task', {
  start: (id, mode) => ipcRenderer.invoke('task:start', id, mode),
  cancel: () => ipcRenderer.invoke('task:cancel'),
  // 只开放历史摘要和按 ID 的读取。
  listHistory: () => ipcRenderer.invoke('history:list'),
  readHistory: (id) => ipcRenderer.invoke('history:read', id),
  decide: (id, allowed) => ipcRenderer.invoke('task:decide', id, allowed),
  onApproval(callback) {
    const listener = (_event, request) => callback(request);
    ipcRenderer.on('task:approval', listener);
    return () => ipcRenderer.removeListener('task:approval', listener);
  },
  onProgress(callback) {
    const listener = (_event, update) => callback(update);
    ipcRenderer.on('task:progress', listener);
    return () => ipcRenderer.removeListener('task:progress', listener);
  },
});
