import { api, spinner, chalk } from '../index.js';
export function registerSearchCommands(program) {
    const search = program.command('search').alias('s').description('搜索命令');
    // 搜索笔记
    search
        .command('query <query>')
        .alias('q')
        .description('搜索笔记')
        .option('-t, --tags <tags>', '按标签过滤（逗号分隔）')
        .option('-f, --favorite', '只搜索收藏')
        .option('-a, --ai-generated', '只搜索AI生成')
        .option('-l, --limit <number>', '限制数量', '20')
        .action(async (query, options) => {
        spinner.start('正在搜索...');
        try {
            let url = `/api/search?q=${encodeURIComponent(query)}&limit=${options.limit}`;
            if (options.tags)
                url += `&tags=${options.tags}`;
            if (options.favorite)
                url += `&favorite=true`;
            if (options.aiGenerated)
                url += `&ai-generated=true`;
            const response = await api.get(url);
            spinner.stop();
            if (response.success && response.data) {
                const total = response.meta?.total || 0;
                console.log(chalk.bold(`\n🔍 搜索结果`) + chalk.gray(` (找到${total}条)\n`));
                if (response.data.length === 0) {
                    console.log(chalk.gray('没有找到匹配的笔记'));
                    return;
                }
                response.data.forEach((note, index) => {
                    const favoriteIcon = note.isFavorite ? chalk.yellow('★') : '○';
                    const aiIcon = note.isAIGenerated ? chalk.magenta('[AI]') : '';
                    console.log(`${chalk.gray(String(index + 1).padStart(3))} ${favoriteIcon} ${chalk.cyan(note.id.substring(0, 8))} ${chalk.bold(note.title)} ${aiIcon}`);
                    console.log(`      ${chalk.gray(new Date(note.updatedAt).toLocaleDateString('zh-CN'))} ${chalk.gray(note.tags.map((t) => `#${t}`).join(' '))}`);
                });
                if (response.meta?.hasMore) {
                    console.log(chalk.gray('\n... 还有更多结果，使用 --limit 查看更多'));
                }
            }
            else {
                console.log(chalk.red(response.error || '搜索失败'));
            }
        }
        catch (error) {
            spinner.fail('请求失败');
            console.error(chalk.red(error instanceof Error ? error.message : '未知错误'));
        }
    });
    // 快速搜索（标题匹配）
    search
        .command('quick <query>')
        .description('快速搜索（仅标题匹配）')
        .action(async (query) => {
        try {
            const response = await api.get(`/api/search/quick?q=${encodeURIComponent(query)}`);
            if (response.success && response.data) {
                if (response.data.length === 0) {
                    console.log(chalk.gray('没有找到匹配的笔记'));
                    return;
                }
                console.log(chalk.bold('\n⚡ 快速搜索结果:\n'));
                response.data.forEach((note, index) => {
                    console.log(`${chalk.gray(String(index + 1).padStart(2))} ${chalk.cyan(note.id.substring(0, 8))} ${note.title}`);
                });
            }
        }
        catch (error) {
            console.error(chalk.red(error instanceof Error ? error.message : '未知错误'));
        }
    });
    // 获取搜索建议
    search
        .command('suggest <query>')
        .description('获取搜索建议（标签）')
        .action(async (query) => {
        try {
            const response = await api.get(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
            if (response.success && response.data) {
                if (response.data.length === 0) {
                    console.log(chalk.gray('没有建议'));
                    return;
                }
                console.log(chalk.bold('\n💡 建议标签:\n'));
                response.data.forEach(tag => console.log(`  ${chalk.blue(`#${tag}`)}`));
            }
        }
        catch (error) {
            console.error(chalk.red(error instanceof Error ? error.message : '未知错误'));
        }
    });
}
//# sourceMappingURL=search.js.map