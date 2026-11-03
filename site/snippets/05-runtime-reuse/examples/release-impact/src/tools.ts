// 【新增文件】应用加载两类材料，并创建本次允许的查询工具。
import { createLookupTool } from './lookup-tool';
import { loadRecords } from './load-records';

/** 应用启动时调用；加载完成后才启动 Agent，不在 Runtime 中读取领域材料。 */
export async function createReleaseTools() {
  const [releases, services] = await Promise.all([
    loadRecords(new URL('../../../fixtures/release-impact/releases.json', import.meta.url)),
    loadRecords(new URL('../../../fixtures/release-impact/services.json', import.meta.url)),
  ]);
  return [
    createLookupTool({
      name: 'lookup_release',
      description: '查询指定发布变更了哪些服务，为影响调查提供服务 ID。',
      idDescription: '任务中给出的发布 ID。',
      records: releases,
    }),
    createLookupTool({
      name: 'lookup_service',
      description: '查询指定服务的负责人和直接依赖。服务 ID 应从发布记录中取得。',
      idDescription: '发布记录中出现的服务 ID。',
      records: services,
    }),
  ];
}
