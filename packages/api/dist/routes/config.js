import { Hono } from 'hono';
import * as fs from 'fs';
import * as path from 'path';
const config = new Hono();
// 配置文件路径
const CONFIG_FILE = path.join(process.cwd(), 'data', 'config.json');
// 默认配置
const DEFAULT_CONFIG = {
    ai: {
        apiBase: 'http://localhost',
        port: 11434,
        model: 'llama3',
    },
    miniMemory: {
        host: 'localhost',
        port: 6379,
        enabled: false,
    },
    server: {
        port: 3000,
        host: '0.0.0.0',
    },
};
// 确保配置目录存在
function ensureConfigDir() {
    const dataDir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}
// 读取配置
function readConfig() {
    try {
        ensureConfigDir();
        if (fs.existsSync(CONFIG_FILE)) {
            const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
            return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
        }
        return { ...DEFAULT_CONFIG };
    }
    catch {
        return { ...DEFAULT_CONFIG };
    }
}
// 保存配置
function saveConfig(config) {
    ensureConfigDir();
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}
// 获取所有配置
config.get('/', (c) => {
    const cfg = readConfig();
    return c.json({ success: true, data: cfg });
});
// 更新AI配置
config.put('/ai', async (c) => {
    try {
        const body = await c.req.json();
        const cfg = readConfig();
        cfg.ai = { ...cfg.ai, ...body };
        saveConfig(cfg);
        return c.json({ success: true, data: cfg.ai });
    }
    catch (error) {
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});
// 更新MiniMemory配置
config.put('/miniMemory', async (c) => {
    try {
        const body = await c.req.json();
        const cfg = readConfig();
        cfg.miniMemory = { ...cfg.miniMemory, ...body };
        saveConfig(cfg);
        return c.json({ success: true, data: cfg.miniMemory });
    }
    catch (error) {
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});
// 更新服务器配置
config.put('/server', async (c) => {
    try {
        const body = await c.req.json();
        const cfg = readConfig();
        cfg.server = { ...cfg.server, ...body };
        saveConfig(cfg);
        return c.json({ success: true, data: cfg.server });
    }
    catch (error) {
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});
// 重置配置
config.post('/reset', (c) => {
    saveConfig(DEFAULT_CONFIG);
    return c.json({ success: true, data: DEFAULT_CONFIG });
});
// 测试AI连接
config.get('/ai/test', async (c) => {
    try {
        const cfg = readConfig();
        const response = await fetch(`${cfg.ai.apiBase}:${cfg.ai.port}/api/tags`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000),
        });
        if (response.ok) {
            const data = await response.json();
            return c.json({
                success: true,
                data: {
                    connected: true,
                    models: data.models.map(m => m.name)
                }
            });
        }
        return c.json({ success: false, error: 'Connection failed' });
    }
    catch (error) {
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : 'Connection failed',
            data: { connected: false }
        });
    }
});
// 测试MiniMemory连接
config.get('/miniMemory/test', async (c) => {
    try {
        const cfg = readConfig();
        // 简单的TCP连接测试
        const net = await import('net');
        return new Promise((resolve) => {
            const socket = net.createConnection({
                host: cfg.miniMemory.host,
                port: cfg.miniMemory.port
            }, () => {
                socket.destroy();
                resolve(c.json({
                    success: true,
                    data: { connected: true }
                }));
            });
            socket.on('error', () => {
                resolve(c.json({
                    success: false,
                    error: 'Connection failed',
                    data: { connected: false }
                }));
            });
            socket.setTimeout(5000, () => {
                socket.destroy();
                resolve(c.json({
                    success: false,
                    error: 'Connection timeout',
                    data: { connected: false }
                }));
            });
        });
    }
    catch (error) {
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : 'Connection failed',
            data: { connected: false }
        });
    }
});
export default config;
//# sourceMappingURL=config.js.map