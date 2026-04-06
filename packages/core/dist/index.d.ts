export * from './types.js';
export { StorageService, MiniMemoryClient, createStorageService } from './storage.js';
export { NoteService, createNoteService } from './note.js';
export { AIService, createAIService } from './ai.js';
export type { AIServiceConfig } from './ai.js';
export { SearchService, createSearchService } from './search.js';
import { StorageService } from './storage.js';
import { NoteService } from './note.js';
import { AIService } from './ai.js';
import { SearchService } from './search.js';
import type { AppConfig } from './types.js';
export interface Services {
    storage: StorageService;
    notes: NoteService;
    ai: AIService;
    search: SearchService;
}
export declare function createServices(config?: Partial<AppConfig>): Promise<Services>;
//# sourceMappingURL=index.d.ts.map