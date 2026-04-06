import { v4 as uuidv4 } from 'uuid';
import { NoteCategory } from './types.js';
// 笔记服务类
export class NoteService {
    storage;
    constructor(storage) {
        this.storage = storage;
    }
    // 创建笔记
    async createNote(input) {
        const now = new Date();
        const note = {
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
    async getNote(id) {
        return this.storage.getNote(id);
    }
    // 更新笔记
    async updateNote(id, input) {
        return this.storage.updateNote(id, input);
    }
    // 删除笔记
    async deleteNote(id) {
        return this.storage.deleteNote(id);
    }
    // 列出笔记
    async listNotes(filter, limit, offset) {
        const filterObj = {};
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
        if (limit)
            filterObj.limit = limit;
        if (offset)
            filterObj.offset = offset;
        return this.storage.listNotes(filterObj);
    }
    // 切换收藏状态
    async toggleFavorite(id) {
        const note = await this.storage.getNote(id);
        if (!note)
            return null;
        return this.storage.updateNote(id, { isFavorite: !note.isFavorite });
    }
    // 设置收藏
    async setFavorite(id, favorite) {
        return this.storage.updateNote(id, { isFavorite: favorite });
    }
    // 添加标签
    async addTags(id, tags) {
        const note = await this.storage.getNote(id);
        if (!note)
            return null;
        const newTags = [...new Set([...note.tags, ...tags])];
        return this.storage.updateNote(id, { tags: newTags });
    }
    // 移除标签
    async removeTags(id, tags) {
        const note = await this.storage.getNote(id);
        if (!note)
            return null;
        const newTags = note.tags.filter(tag => !tags.includes(tag));
        return this.storage.updateNote(id, { tags: newTags });
    }
    // 设置分类
    async setCategory(id, category) {
        return this.storage.updateNote(id, { category });
    }
    // 搜索笔记
    async searchNotes(query) {
        return this.storage.searchNotes(query);
    }
    // 更新笔记摘要
    async updateSummary(id, summary) {
        return this.storage.updateNote(id, { summary });
    }
    // 标记为AI生成
    async markAsAIGenerated(id) {
        return this.storage.updateNote(id, {
            isAIGenerated: true,
            category: NoteCategory.AI_GENERATED
        });
    }
    // 导出笔记为Markdown格式
    exportToMarkdown(note) {
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
    exportToJSON(note) {
        return JSON.stringify(note, null, 2);
    }
}
// 创建笔记服务实例
export function createNoteService(storage) {
    return new NoteService(storage);
}
//# sourceMappingURL=note.js.map