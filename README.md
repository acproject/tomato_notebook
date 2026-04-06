# AI学习笔记本

一个基于 Node.js + React 的智能学习笔记应用，支持本地 LLM（Ollama）AI 功能，所有功能均可通过 CLI 操作，方便 AI Agent 调用。

## 技术栈

- **前端**: React 18 + Vite + TypeScript + TailwindCSS
- **后端 API**: Hono (轻量高性能) + TypeScript
- **AI 后端**: Ollama (本地 LLM)
- **文本布局**: @chenglou/pretext
- **数据存储**: 文件系统 (Markdown/JSON) + MiniMemory (可选)
- **CLI**: Commander.js
- **包管理**: Bun + Monorepo (Turborepo)

## 项目结构

```
tomato_notebook/
├── packages/
│   ├── core/                 # 核心业务逻辑共享模块
│   │   └── src/
│   │       ├── types.ts      # 类型定义
│   │       ├── storage.ts    # 存储服务（支持MiniMemory）
│   │       ├── note.ts       # 笔记业务逻辑
│   │       ├── ai.ts         # AI服务（Ollama）
│   │       └── search.ts     # 搜索服务
│   ├── api/                  # API服务
│   │   └── src/routes/
│   │       ├── notes.ts      # 笔记CRUD API
│   │       ├── ai.ts         # AI功能API
│   │       └── search.ts     # 搜索API
│   ├── web/                  # React前端
│   │   └── src/
│   │       ├── components/   # UI组件
│   │       ├── pages/        # 页面
│   │       └── hooks/        # React Hooks
│   └── cli/                  # CLI工具
│       └── src/commands/
│           ├── notes.ts      # 笔记命令
│           ├── ai.ts         # AI命令
│           ├── search.ts     # 搜索命令
│           ├── server.ts     # 服务器命令
│           └── config.ts     # 配置命令
├── data/                     # 数据存储目录
└── package.json              # Monorepo配置
```

## 快速开始

### 环境要求

- Node.js 18+
- Bun 1.0+
- Ollama (可选，用于AI功能)

### 安装

```bash
# 克隆项目
git clone <repository-url>
cd tomato_notebook

# 安装依赖
bun install

# 构建项目
bun run build
```

### 启动服务

```bash
# 方式一：分别启动API和Web
# 启动API服务（端口3000）
cd packages/api && bun run --watch src/index.ts

# 启动Web前端（端口5173）
cd packages/web && bun run dev

# 方式二：使用CLI启动
notebook server start
```

### 访问应用

- Web界面: http://localhost:5173
- API文档: http://localhost:3000/api/health

## CLI 命令

### 笔记管理

```bash
# 创建笔记
notebook create <title> [--content=<text>] [--tags=<tags>]
notebook new <title>  # 别名

# 列出笔记
notebook list [--filter=<type>]   # filter: all, recent, favorites, ai-generated
notebook ls                        # 别名

# 查看笔记
notebook show <id> [--format=json|markdown]

# 编辑笔记
notebook edit <id> [--title=<title>] [--content=<text>]

# 删除笔记
notebook delete <id> --force
notebook rm <id> --force  # 别名

# 收藏操作
notebook favorite <id>    # 切换收藏状态
notebook fav <id>         # 别名

# 标签操作
notebook tag <id> <tags...>

# 导出笔记
notebook export <id> [--format=md|json] [-o <file>]

# 统计信息
notebook notes stats
```

### AI 功能

```bash
# 检查AI服务状态
notebook ai status

# 总结笔记
notebook ai summarize <id> [--length=short|medium|long]

# 润色笔记
notebook ai polish <id> [--style=formal|casual]

# 翻译笔记
notebook ai translate <id> <language>

# 获取学习建议
notebook ai suggest [--note=<note-id>]

# AI对话模式
notebook ai chat [--note=<note-id>]
```

### 搜索

```bash
# 搜索笔记
notebook search query <query> [--tags=<tags>] [-f|--favorite] [-a|--ai-generated]
notebook search q <query>  # 别名

# 快速搜索（仅标题匹配）
notebook search quick <query>

# 搜索建议
notebook search suggest <query>
```

### 服务器管理

```bash
# 启动API服务器
notebook server start [--port=3000] [--host=0.0.0.0]

# 停止服务器
notebook server stop

# 开发模式（API + Web）
notebook server dev [--port=3000]
```

### 配置管理

```bash
# 设置配置
notebook config set <key> <value>

# 获取配置
notebook config get <key>

# 列出所有配置
notebook config list

# 重置配置
notebook config reset
```

## API 接口

### 笔记 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/notes | 获取笔记列表 |
| POST | /api/notes | 创建笔记 |
| GET | /api/notes/:id | 获取单个笔记 |
| PUT | /api/notes/:id | 更新笔记 |
| DELETE | /api/notes/:id | 删除笔记 |
| POST | /api/notes/:id/favorite | 切换收藏状态 |
| POST | /api/notes/:id/tags | 添加标签 |
| DELETE | /api/notes/:id/tags | 移除标签 |
| GET | /api/notes/:id/export | 导出笔记 |
| GET | /api/notes/stats/summary | 获取统计信息 |

### AI API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/ai/health | 检查AI服务状态 |
| POST | /api/ai/summarize/:id | 总结笔记 |
| POST | /api/ai/polish/:id | 润色笔记 |
| POST | /api/ai/translate/:id | 翻译笔记 |
| GET | /api/ai/suggest | 获取学习建议 |
| POST | /api/ai/execute | 通用AI操作 |
| POST | /api/ai/chat/session | 创建聊天会话 |
| POST | /api/ai/chat/:sessionId | 发送聊天消息 |

### 搜索 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/search | 搜索笔记 |
| GET | /api/search/quick | 快速搜索 |
| GET | /api/search/suggestions | 获取搜索建议 |

## Ollama 配置

### 安装 Ollama

```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# 下载模型
ollama pull llama3

# 启动服务
ollama serve
```

### 环境变量

```bash
export OLLAMA_HOST=localhost
export OLLAMA_PORT=11434
export OLLAMA_MODEL=llama3
```

## MiniMemory 集成

项目支持可选的 MiniMemory 服务用于高性能 KV 存储和 embedding 搜索：

```bash
# 启动 MiniMemory 服务
./mini_cache_server --config conf/mcs.conf

# 连接配置（在环境变量中设置）
MINIMEMORY_HOST=localhost
MINIMEMORY_PORT=6379
```

## 数据模型

### Note 笔记

```typescript
interface Note {
  id: string;
  title: string;
  content: string;
  summary?: string;
  tags: string[];
  category: NoteCategory;
  isFavorite: boolean;
  isAIGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### NoteCategory 分类

- `work` - 工作
- `study` - 学习
- `creative` - 创意
- `personal` - 个人
- `ai-generated` - AI生成

## 开发

### 开发命令

```bash
# 安装依赖
bun install

# 构建所有包
bun run build

# 开发模式
bun run dev

# 代码格式化
bun run format

# 清理构建产物
bun run clean
```

### 添加新包

```bash
cd packages
mkdir -p new-package/src
# 创建 package.json 和 tsconfig.json
```

## License

MIT
