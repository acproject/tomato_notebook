import { v4 as uuidv4 } from 'uuid';
import type { Note, CreateNoteInput, UpdateNoteInput, NoteFilter } from './types.js';
import { NoteCategory } from './types.js';
import { StorageService } from './storage.js';

// 笔记服务类
export class NoteService {
  private storage: StorageService;

  constructor(storage: StorageService) {
    this.storage = storage;
  }

  // 创建笔记
  async createNote(input: CreateNoteInput): Promise<Note> {
    const now = new Date();
    const note: Note = {
      id: uuidv4(),
      title: input.title,
      content: input.content || '',
      tags: input.tags || [],
      category: input.category || NoteCategory.STUDY,
      isFavorite: false,
      isAIGenerated: false,
      createdAt: now,
      updatedAt: now,
    };

    return this.storage.createNote(note);
  }

  // 获取笔记
  async getNote(id: string): Promise<Note | null> {
    return this.storage.getNote(id);
  }

  // 更新笔记
  async updateNote(id: string, input: UpdateNoteInput): Promise<Note | null> {
    return this.storage.updateNote(id, input);
  }

  // 删除笔记
  async deleteNote(id: string): Promise<boolean> {
    return this.storage.deleteNote(id);
  }

  // 列出笔记
  async listNotes(filter?: NoteFilter, limit?: number, offset?: number): Promise<Note[]> {
    const filterObj: {
      category?: string;
      isFavorite?: boolean;
      isAIGenerated?: boolean;
      limit?: number;
      offset?: number;
    } = {};

    switch (filter) {
      case 'favorites':
        filterObj.isFavorite = true;
        break;
      case 'ai-generated':
        filterObj.isAIGenerated = true;
        break;
      case 'recent':
        // 默认就是按时间排序
        break;
      case 'all':
      default:
        break;
    }

    if (limit) filterObj.limit = limit;
    if (offset) filterObj.offset = offset;

    return this.storage.listNotes(filterObj);
  }

  // 切换收藏状态
  async toggleFavorite(id: string): Promise<Note | null> {
    const note = await this.storage.getNote(id);
    if (!note) return null;

    return this.storage.updateNote(id, { isFavorite: !note.isFavorite });
  }

  // 设置收藏
  async setFavorite(id: string, favorite: boolean): Promise<Note | null> {
    return this.storage.updateNote(id, { isFavorite: favorite });
  }

  // 添加标签
  async addTags(id: string, tags: string[]): Promise<Note | null> {
    const note = await this.storage.getNote(id);
    if (!note) return null;

    const newTags = [...new Set([...note.tags, ...tags])];
    return this.storage.updateNote(id, { tags: newTags });
  }

  // 移除标签
  async removeTags(id: string, tags: string[]): Promise<Note | null> {
    const note = await this.storage.getNote(id);
    if (!note) return null;

    const newTags = note.tags.filter(tag => !tags.includes(tag));
    return this.storage.updateNote(id, { tags: newTags });
  }

  // 设置分类
  async setCategory(id: string, category: NoteCategory): Promise<Note | null> {
    return this.storage.updateNote(id, { category });
  }

  // 搜索笔记
  async searchNotes(query: string): Promise<Note[]> {
    return this.storage.searchNotes(query);
  }

  // 更新笔记摘要
  async updateSummary(id: string, summary: string): Promise<Note | null> {
    return this.storage.updateNote(id, { summary });
  }

  // 标记为AI生成
  async markAsAIGenerated(id: string): Promise<Note | null> {
    return this.storage.updateNote(id, { 
      isAIGenerated: true,
      category: NoteCategory.AI_GENERATED 
    });
  }

  // 导出笔记为Markdown格式
  exportToMarkdown(note: Note): string {
    let md = `# ${note.title}\n\n`;
    md += `> Created: ${note.createdAt.toISOString()}\n`;
    md += `> Updated: ${note.updatedAt.toISOString()}\n`;
    md += `> Tags: ${note.tags.join(', ') || 'None'}\n`;
    md += `> Category: ${note.category}\n\n`;
    
    if (note.summary) {
      md += `## Summary\n${note.summary}\n\n`;
    }
    
    md += `## Content\n${note.content}\n`;
    
    return md;
  }

  // 导出笔记为JSON格式
  exportToJSON(note: Note): string {
    return JSON.stringify(note, null, 2);
  }
}

// 创建笔记服务实例
export function createNoteService(storage: StorageService): NoteService {
  return new NoteService(storage);
}
