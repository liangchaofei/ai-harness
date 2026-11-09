import { createLookupTool } from './lookup-tool';
import { loadRecords } from './load-records';

/** 应用启动时调用；加载完成后才启动 Agent，不在 Runtime 中读取领域材料。 */
// 【修改】可替换材料位置；省略时仍加载原来的两份记录。
export async function createReleaseTools(materials = {
  releases: new URL('../../../fixtures/release-impact/releases.json', import.meta.url),
  services: new URL('../../../fixtures/release-impact/services.json', import.meta.url),
}) {
  const [releases, services] = await Promise.all([
    loadRecords(materials.releases),
    loadRecords(materials.services),
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