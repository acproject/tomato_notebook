import type { SearchOptions, SearchResult, Note } from './types.js';
import { StorageService } from './storage.js';

// 搜索服务类
export class SearchService {
  private storage: StorageService;

  constructor(storage: StorageService) {
    this.storage = storage;
  }

  // 搜索笔记
  async search(options: SearchOptions): Promise<SearchResult> {
    let notes = await this.storage.searchNotes(options.query);

    // 应用过滤条件
    if (options.category) {
      notes = notes.filter(n => n.category === options.category);
    }
    if (options.isFavorite !== undefined) {
      notes = notes.filter(n => n.isFavorite === options.isFavorite);
    }
    if (options.isAIGenerated !== undefined) {
      notes = notes.filter(n => n.isAIGenerated === options.isAIGenerated);
    }
    if (options.tags && options.tags.length > 0) {
      notes = notes.filter(n => 
        options.tags!.some(tag => n.tags.includes(tag))
      );
    }
    if (options.dateRange) {
      const start = options.dateRange.start.getTime();
      const end = options.dateRange.end.getTime();
      notes = notes.filter(n => {
        const time = n.updatedAt.getTime();
        return time >= start && time <= end;
      });
    }

    // 计算总数
    const total = notes.length;

    // 排序：按相关度和时间
    notes.sort((a, b) => {
      // 标题匹配优先
      const aTitleMatch = a.title.toLowerCase().includes(options.query.toLowerCase()) ? 1 : 0;
      const bTitleMatch = b.title.toLowerCase().includes(options.query.toLowerCase()) ? 1 : 0;
      if (aTitleMatch !== bTitleMatch) return bTitleMatch - aTitleMatch;
      
      // 然后按更新时间
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });

    // 分页
    const offset = options.offset || 0;
    const limit = options.limit || 20;
    const paginatedNotes = notes.slice(offset, offset + limit);

    return {
      notes: paginatedNotes,
      total,
      hasMore: offset + limit < total,
    };
  }

  // 快速搜索（只返回标题匹配的笔记）
  async quickSearch(query: string): Promise<Note[]> {
    const notes = await this.storage.searchNotes(query);
    const lowerQuery = query.toLowerCase();
    
    return notes
      .filter(n => n.title.toLowerCase().includes(lowerQuery))
      .slice(0, 10);
  }

  // 获取搜索建议（基于标签）
  async getSuggestions(query: string): Promise<string[]> {
    const notes = await this.storage.searchNotes(query);
    const tags = new Set<string>();
    
    notes.forEach(note => {
      note.tags.forEach(tag => tags.add(tag));
    });
    
    return Array.from(tags).slice(0, 5);
  }
}

// 创建搜索服务实例
export function createSearchService(storage: StorageService): SearchService {
  return new SearchService(storage);
}
