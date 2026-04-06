import { Command } from 'commander';
import { config, chalk } from '../index.js';

export function registerConfigCommands(program: Command): void {
  const configCmd = program.command('config').alias('cfg').description('配置管理命令');

  // 设置配置
  configCmd
    .command('set <key> <value>')
    .description('设置配置项')
    .action((key: string, value: string) => {
      config.set(key as 'apiUrl', value);
      console.log(chalk.green(`✓ 已设置 ${key} = ${value}`));
    });

  // 获取配置
  configCmd
    .command('get <key>')
    .description('获取配置项')
    .action((key: string) => {
      const value = config.get(key as 'apiUrl');
      if (value !== undefined) {
        console.log(`${key} = ${chalk.cyan(value as string)}`);
      } else {
        console.log(chalk.gray(`${key} 未设置`));
      }
    });

  // 列出所有配置
  configCmd
    .command('list')
    .alias('ls')
    .description('列出所有配置')
    .action(() => {
      console.log(chalk.bold('\n⚙️  配置列表\n'));
      console.log(`API地址: ${chalk.cyan(config.get('apiUrl'))}`);
      console.log(`配置文件: ${chalk.gray(config.path)}`);
    });

  // 重置配置
  configCmd
    .command('reset')
    .description('重置所有配置')
    .action(() => {
      config.clear();
      console.log(chalk.green('✓ 配置已重置'));
    });
}
