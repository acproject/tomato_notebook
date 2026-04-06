import * as fs from 'fs';
import * as path from 'path';
import * as net from 'net';
// MiniMemory 客户端
export class MiniMemoryClient {
    config;
    socket = null;
    connected = false;
    constructor(config) {
        this.config = config;
    }
    // 连接到MiniMemory服务器
    async connect() {
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
    async sendCommand(command) {
        return new Promise((resolve, reject) => {
            if (!this.socket || !this.connected) {
                reject(new Error('Not connected to MiniMemory server'));
                return;
            }
            let response = '';
            const onData = (data) => {
                response += data.toString();
                if (response.includes('\n')) {
                    this.socket.off('data', onData);
                    resolve(response.trim());
                }
            };
            this.socket.on('data', onData);
            this.socket.write(command + '\n');
        });
    }
    // SET 操作
    async set(key, value) {
        try {
            const response = await this.sendCommand(`SET ${key} "${value}"`);
            return response === 'OK';
        }
        catch {
            return false;
        }
    }
    // GET 操作
    async get(key) {
        try {
            const response = await this.sendCommand(`GET ${key}`);
            if (response === '(nil)') {
                return null;
            }
            return response;
        }
        catch {
            return null;
        }
    }
    // DEL 操作
    async del(key) {
        try {
            const response = await this.sendCommand(`DEL ${key}`);
            return response === '1';
        }
        catch {
            return false;
        }
    }
    // EXISTS 操作
    async exists(key) {
        try {
            const response = await this.sendCommand(`EXISTS ${key}`);
            return response === '1';
        }
        catch {
            return false;
        }
    }
    // 关闭连接
    close() {
        if (this.socket) {
            this.socket.destroy();
            this.socket = null;
            this.connected = false;
        }
    }
}
// 存储服务类
export class StorageService {
    client = null;
    notes = new Map();
    sessions = new Map();
    progress = new Map();
    dataDir;
    initialized = false;
    constructor(dataDir, miniMemoryConfig) {
        this.dataDir = dataDir;
        if (miniMemoryConfig) {
            this.client = new MiniMemoryClient(miniMemoryConfig);
        }
    }
    // 初始化存储
    async initialize() {
        if (this.initialized)
            return;
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
    async loadFromFile() {
        try {
            const notesPath = path.join(this.dataDir, 'notes.json');
            const notesData = await fs.promises.readFile(notesPath, 'utf-8');
            const notesArray = JSON.parse(notesData);
            notesArray.forEach(note => {
                this.notes.set(note.id, {
                    ...note,
                    createdAt: new Date(note.createdAt),
                    updatedAt: new Date(note.updatedAt),
                });
            });
        }
        catch {
            // 文件不存在，创建空数据
            await this.saveToFile();
        }
    }
    // 保存数据到文件
    async saveToFile() {
        await fs.promises.mkdir(this.dataDir, { recursive: true });
        const notesPath = path.join(this.dataDir, 'notes.json');
        const notesArray = Array.from(this.notes.values());
        await fs.promises.writeFile(notesPath, JSON.stringify(notesArray, null, 2));
    }
    // 笔记操作
    async createNote(note) {
        this.notes.set(note.id, note);
        await this.saveToFile();
        // 同步到MiniMemory
        if (this.client) {
            await this.client.set(`note:${note.id}`, JSON.stringify(note));
            await this.client.set(`note:meta:${note.id}:created`, note.createdAt.toISOString());
        }
        return note;
    }
    async getNote(id) {
        return this.notes.get(id) || null;
    }
    async updateNote(id, updates) {
        const note = this.notes.get(id);
        if (!note)
            return null;
        const updatedNote = {
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
    async deleteNote(id) {
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
    async listNotes(filter) {
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
    async searchNotes(query) {
        const lowerQuery = query.toLowerCase();
        return Array.from(this.notes.values()).filter(note => note.title.toLowerCase().includes(lowerQuery) ||
            note.content.toLowerCase().includes(lowerQuery) ||
            note.tags.some(tag => tag.toLowerCase().includes(lowerQuery)));
    }
    // AI会话操作
    async createSession(session) {
        this.sessions.set(session.id, session);
        return session;
    }
    async getSession(id) {
        return this.sessions.get(id) || null;
    }
    async updateSession(id, updates) {
        const session = this.sessions.get(id);
        if (!session)
            return null;
        const updatedSession = {
            ...session,
            ...updates,
            updatedAt: new Date(),
        };
        this.sessions.set(id, updatedSession);
        return updatedSession;
    }
    // 进度追踪
    async recordProgress(progress) {
        this.progress.set(progress.date, progress);
    }
    async getProgress(date) {
        return this.progress.get(date) || null;
    }
    async getAllProgress() {
        return Array.from(this.progress.values());
    }
    // 获取统计信息
    async getStats() {
        const notes = Array.from(this.notes.values());
        const allTags = new Set();
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
export function createStorageService(dataDir = './data', miniMemoryConfig) {
    return new StorageService(dataDir, miniMemoryConfig);
}
//# sourceMappingURL=storage.js.map