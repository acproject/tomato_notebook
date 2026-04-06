#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Conf from 'conf';

const config = new Conf<{ apiUrl: string }>({
  projectName: 'tomato-notebook',
  defaults: {
    apiUrl: 'http://localhost:3000',
  },
});

// API客户端
class APIClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.get('apiUrl') || 'http://localhost:3000';
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json() as T;
    return data;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, {
      method: 'DELETE',
    });
  }
}

const api = new APIClient();
const spinner = ora();

// 导出供命令使用
export { api, spinner, config, chalk };

// 导入命令
import { registerNoteCommands } from './commands/notes.js';
import { registerAICommands } from './commands/ai.js';
import { registerSearchCommands } from './commands/search.js';
import { registerServerCommands } from './commands/server.js';
import { registerConfigCommands } from './commands/config.js';

// 创建主程序
const program = new Command();

program
  .name('notebook')
  .description('AI学习笔记本 CLI工具')
  .version('0.1.0');

// 注册命令组
registerNoteCommands(program);
registerAICommands(program);
registerSearchCommands(program);
registerServerCommands(program);
registerConfigCommands(program);

// 解析命令行参数
program.parse();
