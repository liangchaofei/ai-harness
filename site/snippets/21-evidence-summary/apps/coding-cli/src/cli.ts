#!/usr/bin/env node
// 可执行入口只读取参数和设置最终退出码。
import { runCli } from './main';

process.exitCode = await runCli(process.argv.slice(2));
