import type { SearchOptions, SearchResult, Note } from './types.js';
import { StorageService } from './storage.js';
export declare class SearchService {
    private storage;
    constructor(storage: StorageService);
    search(options: SearchOptions): Promise<SearchResult>;
    quickSearch(query: string): Promise<Note[]>;
    getSuggestions(query: string): Promise<string[]>;
}
export declare function createSearchService(storage: StorageService): SearchService;
//# sourceMappingURL=search.d.ts.map