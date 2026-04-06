import type { MiniMemoryConfig, Note, AISession, LearningProgress } from './types.js';
import * as fs from 'fs';
import * as path from 'path';
import * as net from 'net';

// MiniMemory 客户端
export class MiniMemoryClient {
  private config: MiniMemoryConfig;
  private socket: net.Socket | null = null;
  private connected = false;

  constructor(config: MiniMemoryConfig) {
    this.config = config;
  }

  // 连接到MiniMemory服务器
  async connect(): Promise<boolean> {
    return new Promise((resolve) => {
      this.socket = new net.Socket();
      
      this.socket.connect(this.config.port, this.config.host, () => {
        this.connected = true;
        resolve(true);
      });

      this.socket.on('error', () => {
        this.connected = false;
        resolve(false);
      });
    });
  }

  // 发送命令并获取响应
  private async sendCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.connected) {
        reject(new Error('Not connected to MiniMemory server'));
        return;
      }

      let response = '';
      const onData = (data: Buffer) => {
        response += data.toString();
        if (response.includes('\n')) {
          this.socket!.off('data', onData);
          resolve(response.trim());
        }
      };

      this.socket.on('data', onData);
      this.socket.write(command + '\n');
    });
  }

  // SET 操作
  async set(key: string, value: string): Promise<boolean> {
    try {
      const response = await this.sendCommand(`SET ${key} "${value}"`);
      return response === 'OK';
    } catch {
      return false;
    }
  }

  // GET 操作
  async get(key: string): Promise<string | null> {
    try {
      const response = await this.sendCommand(`GET ${key}`);
      if (response === '(nil)') {
        return null;
      }
      return response;
    } catch {
      return null;
    }
  }

  // DEL 操作
  async del(key: string): Promise<boolean> {
    try {
      const response = await this.sendCommand(`DEL ${key}`);
      return response === '1';
    } catch {
      return false;
    }
  }

  // EXISTS 操作
  async exists(key: string): Promise<boolean> {
    try {
      const response = await this.sendCommand(`EXISTS ${key}`);
      return response === '1';
    } catch {
      return false;
    }
  }

  // 关闭连接
  close(): void {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
      this.connected = false;
    }
  }
}

// 存储服务类
export class StorageService {
  private client: MiniMemoryClient | null = null;
  private notes: Map<string, Note> = new Map();
  private sessions: Map<string, AISession> = new Map();
  private progress: Map<string, LearningProgress> = new Map();
  private dataDir: string;
  private initialized = false;

  constructor(dataDir: string, miniMemoryConfig?: MiniMemoryConfig) {
    this.dataDir = dataDir;
    if (miniMemoryConfig) {
      this.client = new MiniMemoryClient(miniMemoryConfig);
    }
  }

  // 初始化存储
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // 尝试连接MiniMemory
    if (this.client) {
      const connected = await this.client.connect();
      if (!connected) {
        console.warn('MiniMemory not available, using file-based storage');
        this.client = null;
      }
    }

    // 加载本地数据
    await this.loadFromFile();
    this.initialized = true;
  }

  // 从文件加载数据
  private async loadFromFile(): Promise<void> {
    try {
      const notesPath = path.join(this.dataDir, 'notes.json');
      const notesData = await fs.promises.readFile(notesPath, 'utf-8');
      const notesArray = JSON.parse(notesData) as Note[];
      notesArray.forEach(note => {
        this.notes.set(note.id, {
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
        });
      });
    } catch {
      // 文件不存在，创建空数据
      await this.saveToFile();
    }
  }

  // 保存数据到文件
  private async saveToFile(): Promise<void> {
    await fs.promises.mkdir(this.dataDir, { recursive: true });
    const notesPath = path.join(this.dataDir, 'notes.json');
    const notesArray = Array.from(this.notes.values());
    await fs.promises.writeFile(notesPath, JSON.stringify(notesArray, null, 2));
  }

  // 笔记操作
  async createNote(note: Note): Promise<Note> {
    this.notes.set(note.id, note);
    await this.saveToFile();

    // 同步到MiniMemory
    if (this.client) {
      await this.client.set(`note:${note.id}`, JSON.stringify(note));
      await this.client.set(`note:meta:${note.id}:created`, note.createdAt.toISOString());
    }

    return note;
  }

  async getNote(id: string): Promise<Note | null> {
    return this.notes.get(id) || null;
  }

  async updateNote(id: string, updates: Partial<Note>): Promise<Note | null> {
    const note = this.notes.get(id);
    if (!note) return null;

    const updatedNote: Note = {
      ...note,
      ...updates,
      updatedAt: new Date(),
    };

    this.notes.set(id, updatedNote);
    await this.saveToFile();

    if (this.client) {
      await this.client.set(`note:${id}`, JSON.stringify(updatedNote));
    }

    return updatedNote;
  }

  async deleteNote(id: string): Promise<boolean> {
    const result = this.notes.delete(id);
    if (result) {
      await this.saveToFile();

      if (this.client) {
        await this.client.del(`note:${id}`);
        await this.client.del(`note:meta:${id}:created`);
      }
    }
    return result;
  }

  async listNotes(filter?: {
    category?: string;
    isFavorite?: boolean;
    isAIGenerated?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Note[]> {
    let notes = Array.from(this.notes.values());

    // 排序：按更新时间降序
    notes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    // 过滤
    if (filter?.category) {
      notes = notes.filter(n => n.category === filter.category);
    }
    if (filter?.isFavorite !== undefined) {
      notes = notes.filter(n => n.isFavorite === filter.isFavorite);
    }
    if (filter?.isAIGenerated !== undefined) {
      notes = notes.filter(n => n.isAIGenerated === filter.isAIGenerated);
    }

    // 分页
    const offset = filter?.offset || 0;
    const limit = filter?.limit || notes.length;
    return notes.slice(offset, offset + limit);
  }

  async searchNotes(query: string): Promise<Note[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.notes.values()).filter(
      note =>
        note.title.toLowerCase().includes(lowerQuery) ||
        note.content.toLowerCase().includes(lowerQuery) ||
        note.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  // AI会话操作
  async createSession(session: AISession): Promise<AISession> {
    this.sessions.set(session.id, session);
    return session;
  }

  async getSession(id: string): Promise<AISession | null> {
    return this.sessions.get(id) || null;
  }

  async updateSession(id: string, updates: Partial<AISession>): Promise<AISession | null> {
    const session = this.sessions.get(id);
    if (!session) return null;

    const updatedSession: AISession = {
      ...session,
      ...updates,
      updatedAt: new Date(),
    };

    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  // 进度追踪
  async recordProgress(progress: LearningProgress): Promise<void> {
    this.progress.set(progress.date, progress);
  }

  async getProgress(date: string): Promise<LearningProgress | null> {
    return this.progress.get(date) || null;
  }

  async getAllProgress(): Promise<LearningProgress[]> {
    return Array.from(this.progress.values());
  }

  // 获取统计信息
  async getStats(): Promise<{
    totalNotes: number;
    favoriteNotes: number;
    aiGeneratedNotes: number;
    totalTags: number;
  }> {
    const notes = Array.from(this.notes.values());
    const allTags = new Set<string>();

    notes.forEach(note => {
      note.tags.forEach(tag => allTags.add(tag));
    });

    return {
      totalNotes: notes.length,
      favoriteNotes: notes.filter(n => n.isFavorite).length,
      aiGeneratedNotes: notes.filter(n => n.isAIGenerated).length,
      totalTags: allTags.size,
    };
  }
}

// 创建默认存储服务实例
export function createStorageService(
  dataDir: string = './data',
  miniMemoryConfig?: MiniMemoryConfig
): StorageService {
  return new StorageService(dataDir, miniMemoryConfig);
}
