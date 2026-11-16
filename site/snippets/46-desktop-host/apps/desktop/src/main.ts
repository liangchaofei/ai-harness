// 【新增文件】创建窗口，在主进程持有任务与取消控制器。
import { app, BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron';
import { fileURLToPath } from 'node:url';
import { runTotalTask } from './run-total-task';
import type { DesktopTaskResult } from './types/task';

const page = new URL('../ui/index.html', import.meta.url);
let window: BrowserWindow | undefined;
let active: { controller: AbortController; completed: Promise<DesktopTaskResult> } | undefined;
let waitingToQuit = false;

/** 只接受当前窗口中可信本地页面的顶层帧。 */
function verifySender(event: IpcMainInvokeEvent): void {
  if (!window || event.sender !== window.webContents ||
      event.senderFrame !== window.webContents.mainFrame || event.senderFrame.url !== page.href) {
    throw new Error('请求来源无效。');
  }
}

ipcMain.handle('task:start', async (event) => {
  verifySender(event);
  if (active) {
    throw new Error('已有任务在运行。');
  }

  const sender = event.sender;
  const controller = new AbortController();
  const completed = runTotalTask(controller.signal, (update) => {
    if (!sender.isDestroyed()) {
      sender.send('task:progress', update);
    }
  });
  active = { controller, completed };
  try {
    return await completed;
  } catch (error) {
    console.error(error);
    throw new Error(controller.signal.aborted ? '任务准备已取消。' : '任务运行失败，请查看主进程日志。');
  } finally {
    active = undefined;
  }
});

ipcMain.handle('task:cancel', (event) => {
  verifySender(event);
  active?.controller.abort();
});

app.on('before-quit', (event) => {
  if (!active) {
    return;
  }
  event.preventDefault();
  if (!waitingToQuit) {
    waitingToQuit = true;
    active.controller.abort();
    void active.completed.then(() => app.quit(), () => app.quit());
  }
});

app.on('window-all-closed', () => app.quit());

void app.whenReady().then(async () => {
  window = new BrowserWindow({
    width: 900,
    height: 680,
    minWidth: 360,
    minHeight: 540,
    title: 'AI Harness',
    webPreferences: {
      preload: fileURLToPath(new URL('../preload.cjs', import.meta.url)),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  window.on('closed', () => {
    window = undefined;
  });
  window.webContents.on('will-navigate', (event) => event.preventDefault());
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  await window.loadFile(fileURLToPath(page));
}).catch((error) => {
  console.error(error);
  app.quit();
});
