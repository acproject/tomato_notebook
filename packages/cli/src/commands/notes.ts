import { Command } from 'commander';
import { api, spinner, chalk } from '../index.js';
import type { Note } from '@tomato-notebook/core';

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total: number;
    limit: number;
    offset: number;
  };
}

// 格式化日期
function formatDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  
  return d.toLocaleDateString('zh-CN');
}

// 输出笔记列表
function printNotes(notes: Note[]): void {
  if (notes.length === 0) {
    console.log(chalk.gray('没有找到笔记'));
    return;
  }

  notes.forEach((note, index) => {
    const favoriteIcon = note.isFavorite ? chalk.yellow('★') : '○';
    const aiIcon = note.isAIGenerated ? chalk.magenta('[AI]') : '';
    console.log(`${chalk.gray(String(index + 1).padStart(3))} ${favoriteIcon} ${chalk.cyan(note.id.substring(0, 8))} ${chalk.bold(note.title)} ${aiIcon}`);
    console.log(`      ${chalk.gray(formatDate(note.updatedAt))} ${chalk.gray(note.tags.map((t: string) => `#${t}`).join(' '))}`);
  });
}

export function registerNoteCommands(program: Command): void {
  const notes = program.command('notes').alias('n').description('笔记管理命令');

  // 创建笔记
  notes
    .command('create <title>')
    .alias('new')
    .description('创建新笔记')
    .option('-c, --content <content>', '笔记内容')
    .option('-t, --tags <tags>', '标签（逗号分隔）')
    .action(async (title: string, options: { content?: string; tags?: string }) => {
      spinner.start('正在创建笔记...');
      
      try {
        const response = await api.post<APIResponse<Note>>('/api/notes', {
          title,
          content: options.content || '',
          tags: options.tags?.split(',').map(t => t.trim()) || [],
        });

        if (response.success && response.data) {
          spinner.succeed(`笔记创建成功: ${chalk.cyan(response.data.id)}`);
          console.log(`标题: ${chalk.bold(response.data.title)}`);
        } else {
          spinner.fail(response.error || '创建失败');
        }
      } catch (error) {
        spinner.fail('请求失败');
        console.error(chalk.red(error instanceof Error ? error.message : '未知错误'));
      }
    });

  // 列出笔记
  notes
    .command('list')
    .alias('ls')
    .description('列出所有笔记')
    .option('-f, --filter <filter>', '过滤条件: all, recent, favorites, ai-generated', 'all')
    .option('-l, --limit <number>', '限制数量', '20')
    .action(async (options: { filter: string; limit: string }) => {
      spinner.start('正在获取笔记列表...');
      
      try {
        const response = await api.get<APIResponse<Note[]>>(
          `/api/notes?filter=${options.filter}&limit=${options.limit}`
        );

        spinner.stop();
        
        if (response.success && response.data) {
          console.log(chalk.bold('\n笔记列表') + chalk.gray(` (共${response.meta?.total || 0}条)\n`));
          printNotes(response.data);
        } else {
          console.log(chalk.red(response.error || '获取失败'));
        }
      } catch (error) {
        spinner.fail('请求失败');
        console.error(chalk.red(error instanceof Error ? error.message : '未知错误'));
      }
    });

  // 查看笔记
  notes
    .command('show <id>')
    .description('查看笔记详情')
    .option('-f, --format <format>', '输出格式: json, markdown', 'markdown')
    .action(async (id: string, options: { format: string }) => {
      spinner.start('正在获取笔记...');
      
      try {
        if (options.format === 'json') {
          const response = await api.get<APIResponse<Note>>(`/api/notes/${id}`);
          spinner.stop();
          if (response.success && response.data) {
            console.log(JSON.stringify(response.data, null, 2));
          } else {
            console.log(chalk.red(response.error || '笔记不存在'));
          }
        } else {
          const response = await fetch(`${api['baseUrl'] || 'http://localhost:3000'}/api/notes/${id}/export?format=markdown`);
          spinner.stop();
          if (response.ok) {
            console.log(await response.text());
          } else {
            console.log(chalk.red('笔记不存在'));
          }
        }
      } catch (error) {
        spinner.fail('请求失败');
        console.error(chalk.red(error instanceof Error ? error.message : '未知错误'));
      }
    });

  // 编辑笔记
  notes
    .command('edit <id>')
    .description('编辑笔记')
    .option('-t, --title <title>', '新标题')
    .option('-c, --content <content>', '新内容')
    .action(async (id: string, options: { title?: string; content?: string }) => {
      if (!options.title && !options.content) {
        console.log(chalk.yellow('请提供要更新的内容 (--title 或 --content)'));
        return;
      }

      spinner.start('正在更新笔记...');
      
      try {
        const response = await api.put<APIResponse<Note>>(`/api/notes/${id}`, {
          title: options.title,
          content: options.content,
        });

        if (response.success && response.data) {
          spinner.succeed(`笔记已更新: ${chalk.cyan(response.data.title)}`);
        } else {
          spinner.fail(response.error || '更新失败');
        }
      } catch (error) {
        spinner.fail('请求失败');
        console.error(chalk.red(error instanceof Error ? error.message : '未知错误'));
      }
    });

  // 删除笔记
  notes
    .command('delete <id>')
    .alias('rm')
    .description('删除笔记')
    .option('-f, --force', '强制删除，不提示确认')
    .action(async (id: string, options: { force?: boolean }) => {
      if (!options.force) {
        console.log(chalk.yellow(`确定要删除笔记 ${id} 吗？使用 --force 确认删除`));
        return;
      }

      spinner.start('正在删除笔记...');
      
      try {
        const response = await api.delete<APIResponse<void>>(`/api/notes/${id}`);

        if (response.success) {
          spinner.succeed('笔记已删除');
        } else {
          spinner.fail(response.error || '删除失败');
        }
      } catch (error) {
        spinner.fail('请求失败');
        console.error(chalk.red(error instanceof Error ? error.message : '未知错误'));
      }
    });

  // 收藏笔记
  notes
    .command('favorite <id>')
    .alias('fav')
    .description('切换笔记收藏状态')
    .action(async (id: string) => {
      spinner.start('正在更新收藏状态...');
      
      try {
        const response = await api.post<APIResponse<Note>>(`/api/notes/${id}/favorite`);

        if (response.success && response.data) {
          const status = response.data.isFavorite ? '已收藏' : '已取消收藏';
          spinner.succeed(`${status}: ${chalk.cyan(response.data.title)}`);
        } else {
          spinner.fail(response.error || '操作失败');
        }
      } catch (error) {
        spinner.fail('请求失败');
        console.error(chalk.red(error instanceof Error ? error.message : '未知错误'));
      }
    });

  // 添加标签
  notes
    .command('tag <id> <tags...>')
    .description('为笔记添加标签')
    .action(async (id: string, tags: string[]) => {
      spinner.start('正在添加标签...');
      
      try {
        const response = await api.post<APIResponse<Note>>(`/api/notes/${id}/tags`, { tags });

        if (response.success && response.data) {
          spinner.succeed(`标签已添加: ${response.data.tags.map((t: string) => chalk.blue(`#${t}`)).join(' ')}`);
        } else {
          spinner.fail(response.error || '添加失败');
        }
      } catch (error) {
        spinner.fail('请求失败');
        console.error(chalk.red(error instanceof Error ? error.message : '未知错误'));
      }
    });

  // 导出笔记
  notes
    .command('export <id>')
    .description('导出笔记')
    .option('-f, --format <format>', '导出格式: json, markdown', 'markdown')
    .option('-o, --output <file>', '输出文件路径')
    .action(async (id: string, options: { format: string; output?: string }) => {
      spinner.start('正在导出笔记...');
      
      try {
        const response = await fetch(`http://localhost:3000/api/notes/${id}/export?format=${options.format}`);
        
        if (response.ok) {
          const content = await response.text();
          
          if (options.output) {
            const fs = await import('fs');
            await fs.promises.writeFile(options.output, content);
            spinner.succeed(`笔记已导出到: ${options.output}`);
          } else {
            spinner.stop();
            console.log(content);
          }
        } else {
          spinner.fail('笔记不存在');
        }
      } catch (error) {
        spinner.fail('请求失败');
        console.error(chalk.red(error instanceof Error ? error.message : '未知错误'));
      }
    });

  // 统计信息
  notes
    .command('stats')
    .description('显示笔记统计信息')
    .action(async () => {
      spinner.start('正在获取统计信息...');
      
      try {
        const response = await api.get<APIResponse<{
          totalNotes: number;
          favoriteNotes: number;
          aiGeneratedNotes: number;
          totalTags: number;
        }>>('/api/notes/stats/summary');

        spinner.stop();
        
        if (response.success && response.data) {
          const stats = response.data;
          console.log(chalk.bold('\n📊 笔记统计\n'));
          console.log(`  总笔记数: ${chalk.cyan(stats.totalNotes)}`);
          console.log(`  收藏笔记: ${chalk.yellow(stats.favoriteNotes)}`);
          console.log(`  AI生成: ${chalk.magenta(stats.aiGeneratedNotes)}`);
          console.log(`  标签总数: ${chalk.blue(stats.totalTags)}`);
        }
      } catch (error) {
        spinner.fail('请求失败');
        console.error(chalk.red(error instanceof Error ? error.message : '未知错误'));
      }
    });
}
