import { Command } from 'commander';
import { api, spinner, chalk } from '../index.js';
import type { AISession } from '@tomato-notebook/core';

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function registerAICommands(program: Command): void {
  const ai = program.command('ai').description('AI功能命令');

  // AI状态检查
  ai
    .command('status')
    .description('检查AI服务状态')
    .action(async () => {
      spinner.start('正在检查AI服务...');
      
      try {
        const response = await api.get<APIResponse<{
          status: string;
          models: string[];
        }>>('/api/ai/health');

        spinner.stop();
        
        if (response.success && response.data) {
          const { status, models } = response.data;
          const statusIcon = status === 'connected' ? chalk.green('●') : chalk.red('●');
          console.log(`\nAI服务状态: ${statusIcon} ${status}`);
          
          if (models.length > 0) {
            console.log(`\n可用模型:`);
            models.forEach(model => console.log(`  - ${chalk.cyan(model)}`));
          }
        }
      } catch (error) {
        spinner.fail('请求失败');
        console.error(chalk.red(error instanceof Error ? error.message : '未知错误'));
      }
    });

  // 总结笔记
  ai
    .command('summarize <noteId>')
    .description('使用AI总结笔记')
    .option('-l, --length <length>', '摘要长度: short, medium, long', 'medium')
    .action(async (noteId: string, options: { length: string }) => {
      spinner.start('正在生成摘要...');
      
      try {
        const response = await api.post<APIResponse<{ summary: string }>>(
          `/api/ai/summarize/${noteId}?length=${options.length}`
        );

        if (response.success && response.data) {
          spinner.succeed('摘要生成完成');
          console.log(chalk.bold('\n📝 摘要:\n'));
          console.log(response.data.summary);
        } else {
          spinner.fail(response.error || '生成失败');
        }
      } catch (error) {
        spinner.fail('请求失败');
        console.error(chalk.red(error instanceof Error ? error.message : '未知错误'));
      }
    });

  // 润色笔记
  ai
    .command('polish <noteId>')
    .description('使用AI润色笔记')
    .option('-s, --style <style>', '风格: formal, casual', 'formal')
    .action(async (noteId: string, options: { style: string }) => {
      spinner.start('正在润色文本...');
      
      try {
        const response = await api.post<APIResponse<{ polished: string }>>(
          `/api/ai/polish/${noteId}?style=${options.style}`
        );

        if (response.success && response.data) {
          spinner.succeed('润色完成');
          console.log(chalk.bold('\n✨ 润色结果:\n'));
          console.log(response.data.polished);
        } else {
          spinner.fail(response.error || '润色失败');
        }
      } catch (error) {
        spinner.fail('请求失败');
        console.error(chalk.red(error instanceof Error ? error.message : '未知错误'));
      }
    });

  // 翻译笔记
  ai
    .command('translate <noteId> <language>')
    .description('使用AI翻译笔记')
    .action(async (noteId: string, language: string) => {
      spinner.start(`正在翻译为${language}...`);
      
      try {
        const response = await api.post<APIResponse<{ translation: string }>>(
          `/api/ai/translate/${noteId}?language=${encodeURIComponent(language)}`
        );

        if (response.success && response.data) {
          spinner.succeed('翻译完成');
          console.log(chalk.bold(`\n🌐 ${language}翻译结果:\n`));
          console.log(response.data.translation);
        } else {
          spinner.fail(response.error || '翻译失败');
        }
      } catch (error) {
        spinner.fail('请求失败');
        console.error(chalk.red(error instanceof Error ? error.message : '未知错误'));
      }
    });

  // 获取学习建议
  ai
    .command('suggest')
    .description('获取AI学习建议')
    .option('-n, --note <noteId>', '基于指定笔记')
    .option('-c, --context <context>', '上下文内容')
    .action(async (options: { note?: string; context?: string }) => {
      spinner.start('正在生成学习建议...');
      
      try {
        let url = '/api/ai/suggest?';
        if (options.note) url += `noteId=${options.note}&`;
        if (options.context) url += `context=${encodeURIComponent(options.context)}`;

        const response = await api.get<APIResponse<{ suggestions: string }>>(url);

        if (response.success && response.data) {
          spinner.succeed('学习建议生成完成');
          console.log(chalk.bold('\n💡 学习建议:\n'));
          console.log(response.data.suggestions);
        } else {
          spinner.fail(response.error || '生成失败');
        }
      } catch (error) {
        spinner.fail('请求失败');
        console.error(chalk.red(error instanceof Error ? error.message : '未知错误'));
      }
    });

  // AI聊天
  ai
    .command('chat')
    .description('启动AI聊天会话')
    .option('-n, --note <noteId>', '关联笔记ID')
    .action(async (options: { note?: string }) => {
      try {
        // 创建会话
        spinner.start('正在启动聊天会话...');
        const sessionResponse = await api.post<APIResponse<AISession>>(
          '/api/ai/chat/session',
          options.note ? { noteId: options.note } : {}
        );

        if (!sessionResponse.success || !sessionResponse.data) {
          spinner.fail('创建会话失败');
          return;
        }

        const sessionId = sessionResponse.data.id;
        spinner.succeed('聊天会话已启动');
        console.log(chalk.gray(`会话ID: ${sessionId}`));
        console.log(chalk.bold('\n💬 AI聊天 (输入 exit 退出)\n'));

        // 读取用户输入
        const readline = await import('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        const ask = (question: string): Promise<string> => {
          return new Promise(resolve => rl.question(question, resolve));
        };

        // 聊天循环
        while (true) {
          const input = await ask(chalk.cyan('你: '));
          
          if (input.toLowerCase() === 'exit') {
            console.log(chalk.gray('\n再见！'));
            rl.close();
            break;
          }

          if (!input.trim()) continue;

          spinner.start('思考中...');
          const chatResponse = await api.post<APIResponse<{ reply: string }>>(
            `/api/ai/chat/${sessionId}`,
            { message: input }
          );
          spinner.stop();

          if (chatResponse.success && chatResponse.data) {
            console.log(chalk.magenta('\nAI: ') + chatResponse.data.reply + '\n');
          } else {
            console.log(chalk.red('\nAI响应失败\n'));
          }
        }
      } catch (error) {
        spinner.fail('聊天出错');
        console.error(chalk.red(error instanceof Error ? error.message : '未知错误'));
      }
    });
}
