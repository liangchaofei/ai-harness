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
const historySelect = document.querySelector('#history-id');
const historyStatus = document.querySelector('#history-status');
const historyCheckDetail = document.querySelector('#history-check-detail');
const historyProgress = document.querySelector('#history-progress');
const historyDiff = document.querySelector('#history-diff');

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
    void refreshHistory(true);
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

// 【新增】历史读取与运行中的面板互不覆盖。
let historyRead = 0;
const taskLabels = { total: '总价计算', route: '路径规范化' };

async function refreshHistory(preferLatest = false) {
  try {
    const current = historySelect.value;
    const rows = await window.task.listHistory();
    const options = rows.map((row) => {
      const option = document.createElement('option');
      option.value = row.id;
      const model = row.modelMode === 'live' ? '模型服务' : '固定响应';
      option.textContent = `${taskLabels[row.taskId]} · ${model} · ${new Date(row.finishedAt).toLocaleString()}`;
      return option;
    });
    historySelect.replaceChildren(...options);
    if (!preferLatest && options.some((option) => option.value === current)) {
      historySelect.value = current;
    }
    historySelect.disabled = options.length === 0;
    await showHistory();
  } catch (error) {
    historyStatus.textContent = error.message;
  }
}

async function showHistory() {
  const request = ++historyRead;
  historyProgress.replaceChildren();
  historyDiff.replaceChildren();
  historyCheckDetail.hidden = true;
  if (!historySelect.value) {
    historyStatus.textContent = '暂无运行记录';
    return;
  }

  historyStatus.textContent = '正在读取记录';
  try {
    const { result, events } = await window.task.readHistory(historySelect.value);
    if (request !== historyRead) {
      return;
    }
    const outcome = result.accepted ? '已接受' : result.status === 'cancelled' ? '已取消' : '未接受';
    const evidence = result.checkMatchesCurrent ? (result.checkPassed ? '通过' : '失败') : '无匹配结果';
    historyStatus.textContent = `${outcome} · 验收${evidence}`;
    if (result.check) {
      const exitCode = result.check.exitCode ?? '无';
      historyCheckDetail.textContent = `验收进程：${result.check.status} · 退出码 ${exitCode}`;
      historyCheckDetail.hidden = false;
    }
    for (const event of events) {
      const item = document.createElement('li');
      item.textContent = `#${event.sequence} ${event.label}`;
      historyProgress.append(item);
    }
    for (const change of result.changes) {
      const title = document.createElement('h3');
      title.textContent = change.path;
      const columns = document.createElement('div');
      columns.className = 'diff-columns';
      for (const [label, content] of [['修改前', change.before], ['修改后', change.after]]) {
        const column = document.createElement('div');
        const caption = document.createElement('h4');
        const code = document.createElement('pre');
        caption.textContent = label;
        code.textContent = content;
        column.append(caption, code);
        columns.append(column);
      }
      historyDiff.append(title, columns);
    }
  } catch (error) {
    if (request === historyRead) {
      historyStatus.textContent = error.message;
    }
  }
}

historySelect.addEventListener('change', () => { void showHistory(); });
void refreshHistory();
