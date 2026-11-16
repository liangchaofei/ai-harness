// 【新增文件】任务 ID 只能选择主进程登记的可信材料。
const tasks = {
  total: {
    file: 'total.mjs',
    source: 'export const total = (price, count) => price + count;\n',
    prompt: '修复 total.mjs，把总价改为单价乘以数量。先检查当前实现，修改后执行验收。',
    oldText: 'price + count',
    newText: 'price * count',
    check: 'check-total.mjs',
  },
  route: {
    file: 'route.mjs',
    source: 'export const normalize = (path) => path;\n',
    prompt: '检查 route.mjs 并修复 normalize：删去查询与片段，再去除末尾斜线，根路径仍为 /。修改后执行验收。',
    oldText: '=> path;',
    newText: "=> path.split(/[?#]/)[0].replace(/\\/+$/, '') || '/';",
    check: 'check-route.mjs',
  },
};

export type DesktopTaskId = keyof typeof tasks;
/** 由主进程解析出的任务，同时保留可用于历史的稳定 ID。 */
export type DesktopTask = typeof tasks[DesktopTaskId] & { id: DesktopTaskId };

/** 检查 IPC 入参为已登记 ID，再返回主进程私有的任务说明。 */
export function pickTask(value: unknown): DesktopTask | undefined {
  if (value === 'total' || value === 'route') {
    return { id: value, ...tasks[value] };
  }
  return undefined;
}
