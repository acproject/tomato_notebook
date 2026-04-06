import { Command } from 'commander';
import { chalk } from '../index.js';
import { spawn, ChildProcess } from 'child_process';

let serverProcess: ChildProcess | null = null;

export function registerServerCommands(program: Command): void {
  const server = program.command('server').alias('srv').description('服务器管理命令');

  // 启动服务器
  server
    .command('start')
    .description('启动API服务器')
    .option('-p, --port <port>', '端口号', '3000')
    .option('-h, --host <host>', '主机地址', '0.0.0.0')
    .action(async (options: { port: string; host: string }) => {
      try {
        console.log(chalk.cyan(`\n🚀 启动服务器 http://${options.host}:${options.port}\n`));
        
        // 使用bun运行API服务
        serverProcess = spawn('bun', ['run', 'packages/api/src/index.ts'], {
          cwd: process.cwd(),
          env: {
            ...process.env,
            PORT: options.port,
            HOST: options.host,
          },
          stdio: 'inherit',
        });

        serverProcess.on('error', (error) => {
          console.error(chalk.red(`服务器启动失败: ${error.message}`));
        });

        serverProcess.on('exit', (code) => {
          if (code !== 0) {
            console.error(chalk.red(`服务器异常退出，代码: ${code}`));
          }
        });

        // 处理退出信号
        process.on('SIGINT', () => {
          if (serverProcess) {
            serverProcess.kill();
            console.log(chalk.yellow('\n服务器已停止'));
          }
          process.exit();
        });

      } catch (error) {
        console.error(chalk.red(error instanceof Error ? error.message : '启动失败'));
      }
    });

  // 停止服务器
  server
    .command('stop')
    .description('停止API服务器')
    .action(() => {
      if (serverProcess) {
        serverProcess.kill();
        console.log(chalk.yellow('服务器已停止'));
      } else {
        console.log(chalk.gray('服务器未运行'));
      }
    });

  // 开发模式（同时启动前端和后端）
  server
    .command('dev')
    .description('启动开发服务器（API + Web）')
    .option('-p, --port <port>', 'API端口', '3000')
    .action(async (options: { port: string }) => {
      console.log(chalk.cyan('\n🔧 开发模式启动\n'));
      console.log(chalk.gray('API服务器: http://localhost:' + options.port));
      console.log(chalk.gray('Web前端: http://localhost:5173\n'));

      // 使用turbo运行dev
      const turboProcess = spawn('bun', ['run', 'dev'], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          PORT: options.port,
        },
        stdio: 'inherit',
      });

      turboProcess.on('error', (error) => {
        console.error(chalk.red(`启动失败: ${error.message}`));
      });

      process.on('SIGINT', () => {
        turboProcess.kill();
        console.log(chalk.yellow('\n开发服务器已停止'));
        process.exit();
      });
    });
}
