// 渲染层只展示通过 preload 收到的任务数据。
const start = document.querySelector('#start');
const cancel = document.querySelector('#cancel');
const progress = document.querySelector('#progress');
const status = document.querySelector('#status');
const changes = document.querySelector('#changes');
const check = document.querySelector('#check');
const taskId = document.querySelector('#task-id');
const modelMode = document.querySelector('#model-mode');
const modelNote = document.querySelector('#model-note');

modelMode.addEventListener('change', () => {
  modelNote.hidden = modelMode.value !== 'live';
});

const unsubscribe = window.task.onProgress(({ sequence, label }) => {
  const row = document.createElement('li');
  row.textContent = `#${sequence} ${label}`;
  progress.append(row);
});
window.addEventListener('pagehide', unsubscribe, { once: true });

start.addEventListener('click', async () => {
  start.disabled = true;
  taskId.disabled = true;
  modelMode.disabled = true;
  cancel.disabled = false;
  progress.replaceChildren();
  status.textContent = '运行中';
  changes.textContent = '—';
  check.textContent = '—';
  try {
    const result = await window.task.start(taskId.value, modelMode.value);
    status.textContent = result.status === 'cancelled'
      ? '已取消'
      : result.status === 'failed' ? '运行失败' : result.accepted ? '已接受' : '未接受';
    changes.textContent = result.changedFiles.join('、') || '无改动';
    check.textContent = !result.checkMatchesCurrent ? '无' : result.checkPassed ? '通过' : '失败';
  } catch (error) {
    status.textContent = error.message;
  } finally {
    start.disabled = false;
    taskId.disabled = false;
    modelMode.disabled = false;
    cancel.disabled = true;
  }
});

cancel.addEventListener('click', async () => {
  cancel.disabled = true;
  status.textContent = '正在取消';
  try {
    await window.task.cancel();
  } catch (error) {
    status.textContent = error.message;
  }
});
