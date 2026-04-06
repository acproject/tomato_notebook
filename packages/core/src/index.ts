// 类型导出
export * from './types.js';

// 服务导出
export { StorageService, MiniMemoryClient, createStorageService } from './storage.js';
export { NoteService, createNoteService } from './note.js';
export { AIService, createAIService } from './ai.js';
export type { AIServiceConfig } from './ai.js';
export { SearchService, createSearchService } from './search.js';

// 便捷函数：创建所有服务
import { StorageService, createStorageService } from './storage.js';
import { NoteService, createNoteService } from './note.js';
import { AIService, createAIService } from './ai.js';
import { SearchService, createSearchService } from './search.js';
import type { AppConfig, OllamaConfig } from './types.js';

export interface Services {
  storage: StorageService;
  notes: NoteService;
  ai: AIService;
  search: SearchService;
}

export async function createServices(config: Partial<AppConfig> = {}): Promise<Services> {
  const dataDir = config.dataDir || './data';
  const miniMemoryConfig = config.miniMemory;
  
  const storage = createStorageService(dataDir, miniMemoryConfig);
  await storage.initialize();
  
  const notes = createNoteService(storage);
  
  const ollamaConfig: OllamaConfig = config.ollama || {
    host: 'localhost',
    port: 11434,
    model: 'llama3',
  };
  
  const ai = createAIService({
    ollama: ollamaConfig,
    storage,
    noteService: notes,
  });
  
  const search = createSearchService(storage);
  
  return { storage, notes, ai, search };
}
