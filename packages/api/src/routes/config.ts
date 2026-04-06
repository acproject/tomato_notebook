import { Hono } from 'hono';
import { Database } from 'bun:sqlite';
import * as path from 'path';
import * as fs from 'fs';

const config = new Hono();

// 数据库路径
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'notebook.db');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 初始化数据库
const db = new Database(DB_PATH);

// 创建配置表
db.run(`
  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    summary TEXT,
    tags TEXT DEFAULT '[]',
    category TEXT DEFAULT 'study',
    is_favorite INTEGER DEFAULT 0,
    is_ai_generated INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 创建索引
db.run(`CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at DESC)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_notes_category ON notes(category)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_notes_favorite ON notes(is_favorite)`);

// 默认配置
const DEFAULT_CONFIG: Record<string, string> = {
  'ai.apiBase': 'http://localhost',
  'ai.port': '11434',
  'ai.model': 'llama3',
  'ai.apiKey': '',
  'miniMemory.host': 'localhost',
  'miniMemory.port': '6379',
  'miniMemory.enabled': 'false',
  'miniMemory.password': '',
  'server.port': '3000',
  'server.host': '0.0.0.0',
};

// 初始化默认配置
function initDefaultConfig(): void {
  const stmt = db.prepare('INSERT OR IGNORE INTO config (key, value) VALUES ($key, $value)');
  for (const [key, value] of Object.entries(DEFAULT_CONFIG)) {
    stmt.run({ $key: key, $value: value });
  }
}
initDefaultConfig();

// 获取配置值
function getConfigValue(key: string): string {
  const stmt = db.prepare('SELECT value FROM config WHERE key = $key');
  const row = stmt.get({ $key: key }) as { value: string } | null;
  return row?.value ?? DEFAULT_CONFIG[key] ?? '';
}

// 设置配置值
function setConfigValue(key: string, value: string): void {
  const stmt = db.prepare(`
    INSERT INTO config (key, value, updated_at) 
    VALUES ($key, $value, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = $value, updated_at = datetime('now')
  `);
  stmt.run({ $key: key, $value: value });
}

// 获取所有配置
function getAllConfig(): Record<string, string> {
  const stmt = db.prepare('SELECT key, value FROM config');
  const rows = stmt.all() as Array<{ key: string; value: string }>;
  const configObj: Record<string, string> = {};
  for (const row of rows) {
    configObj[row.key] = row.value;
  }
  return configObj;
}

// 获取所有配置
config.get('/', (c) => {
  const cfg = getAllConfig();
  return c.json({
    success: true,
    data: {
      ai: {
        apiBase: cfg['ai.apiBase'] || DEFAULT_CONFIG['ai.apiBase'],
        port: parseInt(cfg['ai.port'] || DEFAULT_CONFIG['ai.port']),
        model: cfg['ai.model'] || DEFAULT_CONFIG['ai.model'],
        apiKey: cfg['ai.apiKey'] || '',
      },
      miniMemory: {
        host: cfg['miniMemory.host'] || DEFAULT_CONFIG['miniMemory.host'],
        port: parseInt(cfg['miniMemory.port'] || DEFAULT_CONFIG['miniMemory.port']),
        enabled: cfg['miniMemory.enabled'] === 'true',
        password: cfg['miniMemory.password'] || '',
      },
      server: {
        port: parseInt(cfg['server.port'] || DEFAULT_CONFIG['server.port']),
        host: cfg['server.host'] || DEFAULT_CONFIG['server.host'],
      },
    },
  });
});

// 更新AI配置
config.put('/ai', async (c) => {
  try {
    const body = await c.req.json() as {
      apiBase?: string;
      port?: number;
      model?: string;
      apiKey?: string;
    };

    if (body.apiBase !== undefined) setConfigValue('ai.apiBase', body.apiBase);
    if (body.port !== undefined) setConfigValue('ai.port', String(body.port));
    if (body.model !== undefined) setConfigValue('ai.model', body.model);
    if (body.apiKey !== undefined) setConfigValue('ai.apiKey', body.apiKey);

    return c.json({
      success: true,
      data: {
        apiBase: getConfigValue('ai.apiBase'),
        port: parseInt(getConfigValue('ai.port')),
        model: getConfigValue('ai.model'),
        apiKey: getConfigValue('ai.apiKey'),
      },
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// 更新MiniMemory配置
config.put('/miniMemory', async (c) => {
  try {
    const body = await c.req.json() as {
      host?: string;
      port?: number;
      enabled?: boolean;
      password?: string;
    };

    if (body.host !== undefined) setConfigValue('miniMemory.host', body.host);
    if (body.port !== undefined) setConfigValue('miniMemory.port', String(body.port));
    if (body.enabled !== undefined) setConfigValue('miniMemory.enabled', String(body.enabled));
    if (body.password !== undefined) setConfigValue('miniMemory.password', body.password);

    return c.json({
      success: true,
      data: {
        host: getConfigValue('miniMemory.host'),
        port: parseInt(getConfigValue('miniMemory.port')),
        enabled: getConfigValue('miniMemory.enabled') === 'true',
        password: getConfigValue('miniMemory.password'),
      },
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// 更新服务器配置
config.put('/server', async (c) => {
  try {
    const body = await c.req.json() as {
      port?: number;
      host?: string;
    };

    if (body.port !== undefined) setConfigValue('server.port', String(body.port));
    if (body.host !== undefined) setConfigValue('server.host', body.host);

    return c.json({
      success: true,
      data: {
        port: parseInt(getConfigValue('server.port')),
        host: getConfigValue('server.host'),
      },
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// 重置配置
config.post('/reset', (c) => {
  for (const [key, value] of Object.entries(DEFAULT_CONFIG)) {
    setConfigValue(key, value);
  }

  return c.json({
    success: true,
    data: {
      ai: {
        apiBase: DEFAULT_CONFIG['ai.apiBase'],
        port: parseInt(DEFAULT_CONFIG['ai.port']),
        model: DEFAULT_CONFIG['ai.model'],
        apiKey: '',
      },
      miniMemory: {
        host: DEFAULT_CONFIG['miniMemory.host'],
        port: parseInt(DEFAULT_CONFIG['miniMemory.port']),
        enabled: false,
        password: '',
      },
      server: {
        port: parseInt(DEFAULT_CONFIG['server.port']),
        host: DEFAULT_CONFIG['server.host'],
      },
    },
  });
});

// 测试AI连接
config.get('/ai/test', async (c) => {
  try {
    const apiBase = getConfigValue('ai.apiBase');
    const port = getConfigValue('ai.port');

    const response = await fetch(`${apiBase}:${port}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json() as { models: Array<{ name: string }> };
      return c.json({
        success: true,
        data: {
          connected: true,
          models: data.models.map(m => m.name),
        },
      });
    }
    return c.json({ success: false, error: 'Connection failed' });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed',
      data: { connected: false },
    });
  }
});

// 测试MiniMemory连接
config.get('/miniMemory/test', async (c) => {
  try {
    const host = getConfigValue('miniMemory.host');
    const port = parseInt(getConfigValue('miniMemory.port'));

    const net = await import('net');

    return new Promise<Response>((resolve) => {
      const socket = net.createConnection({
        host,
        port,
      }, () => {
        socket.destroy();
        resolve(c.json({
          success: true,
          data: { connected: true },
        }));
      });

      socket.on('error', () => {
        resolve(c.json({
          success: false,
          error: 'Connection failed',
          data: { connected: false },
        }));
      });

      socket.setTimeout(5000, () => {
        socket.destroy();
        resolve(c.json({
          success: false,
          error: 'Connection timeout',
          data: { connected: false },
        }));
      });
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed',
      data: { connected: false },
    });
  }
});

// 导出数据库实例供其他模块使用
export { db };
export default config;
