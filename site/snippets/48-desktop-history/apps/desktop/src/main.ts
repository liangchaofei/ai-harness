// 创建窗口，在主进程持有任务与取消控制器。
import { app, BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runDesktopTask } from './run-task';
import { DesktopModelConfigurationError, selectModel } from './model';
import { pickTask } from './tasks';
import { DesktopHistoryError, listRuns, readRun, saveRun } from './history';
import type { DesktopTaskEvent, DesktopTaskResult } from './types/task';

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

ipcMain.handle('task:start', async (event, taskId: unknown, modelMode: unknown) => {
  verifySender(event);
  if (active) {
    throw new Error('已有任务在运行。');
  }

  // 渲染器只能提交已登记的 ID 与模式。
  const task = pickTask(taskId);
  if (!task || (modelMode !== 'fixed' && modelMode !== 'live')) {
    throw new Error('任务或模型模式无效。');
  }

  const sender = event.sender;
  const controller = new AbortController();
  // 【新增】本批只保存已有的应用进度摘要。
  const events: DesktopTaskEvent[] = [];
  const completed = selectModel(modelMode, task).then((callModel) =>
    runDesktopTask(task, callModel, controller.signal, (update) => {
      events.push(update);
      if (!sender.isDestroyed()) {
        sender.send('task:progress', update);
      }
    }),
  ).then(async (result) => {
    await saveRun(historyDirectory(), { taskId: task.id, modelMode, events, result });
    return result;
  });
  active = { controller, completed };
  try {
    return await completed;
  } catch (error) {
    if (error instanceof DesktopModelConfigurationError || error instanceof DesktopHistoryError) {
      throw error;
    }
    throw new Error(controller.signal.aborted ? '任务准备已取消。' : '任务准备或审阅失败。');
  } finally {
    active = undefined;
  }
});

ipcMain.handle('task:cancel', (event) => {
  verifySender(event);
  active?.controller.abort();
});

// 【新增】读取历史同样验证来源，目录始终由主进程选择。
function historyDirectory() {
  return join(app.getPath('userData'), 'task-history');
}

ipcMain.handle('history:list', (event) => {
  verifySender(event);
  return listRuns(historyDirectory());
});

ipcMain.handle('history:read', (event, id: unknown) => {
  verifySender(event);
  return readRun(historyDirectory(), id);
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
