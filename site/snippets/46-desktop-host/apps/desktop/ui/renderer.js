// 【新增文件】渲染层只展示通过 preload 收到的任务数据。
const start = document.querySelector('#start');
const cancel = document.querySelector('#cancel');
const progress = document.querySelector('#progress');
const status = document.querySelector('#status');
const changes = document.querySelector('#changes');
const check = document.querySelector('#check');

const unsubscribe = window.task.onProgress(({ sequence, label }) => {
  const row = document.createElement('li');
  row.textContent = `#${sequence} ${label}`;
  progress.append(row);
});
window.addEventListener('pagehide', unsubscribe, { once: true });

start.addEventListener('click', async () => {
  start.disabled = true;
  cancel.disabled = false;
  progress.replaceChildren();
  status.textContent = '运行中';
  changes.textContent = '—';
  check.textContent = '—';
  try {
    const result = await window.task.start();
    status.textContent = result.status === 'cancelled'
      ? '已取消'
      : result.accepted ? '已接受' : '未接受';
    changes.textContent = result.changedFiles.join('、') || '无改动';
    check.textContent = !result.checkMatchesCurrent ? '无' : result.checkPassed ? '通过' : '失败';
  } catch (error) {
    status.textContent = error.message;
  } finally {
    start.disabled = false;
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
