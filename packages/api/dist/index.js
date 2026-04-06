import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { createServices } from '@tomato-notebook/core';
// 创建服务实例
const services = await createServices({
    dataDir: './data',
    ollama: {
        host: process.env.OLLAMA_HOST || 'localhost',
        port: parseInt(process.env.OLLAMA_PORT || '11434'),
        model: process.env.OLLAMA_MODEL || 'llama3',
    },
});
// 导出服务供路由使用
export const app = new Hono();
export { services };
// CORS配置
app.use('/*', cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
}));
// 健康检查
app.get('/api/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API状态
app.get('/api/status', async (c) => {
    const aiHealth = await services.ai.checkHealth();
    const stats = await services.storage.getStats();
    return c.json({
        ai: aiHealth ? 'connected' : 'disconnected',
        stats,
    });
});
// 导入路由
import notesRouter from './routes/notes.js';
import aiRouter from './routes/ai.js';
import searchRouter from './routes/search.js';
import configRouter from './routes/config.js';
// 注册路由
app.route('/api/notes', notesRouter);
app.route('/api/ai', aiRouter);
app.route('/api/search', searchRouter);
app.route('/api/config', configRouter);
// 启动服务器
const port = parseInt(process.env.PORT || '3000');
const host = process.env.HOST || '0.0.0.0';
console.log(`Server starting on http://${host}:${port}`);
serve({
    fetch: app.fetch,
    port,
    hostname: host,
});
//# sourceMappingURL=index.js.map