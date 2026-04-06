import type { MiniMemoryConfig, Note, AISession, LearningProgress } from './types.js';
export declare class MiniMemoryClient {
    private config;
    private socket;
    private connected;
    constructor(config: MiniMemoryConfig);
    connect(): Promise<boolean>;
    private sendCommand;
    set(key: string, value: string): Promise<boolean>;
    get(key: string): Promise<string | null>;
    del(key: string): Promise<boolean>;
    exists(key: string): Promise<boolean>;
    close(): void;
}
export declare class StorageService {
    private client;
    private notes;
    private sessions;
    private progress;
    private dataDir;
    private initialized;
    constructor(dataDir: string, miniMemoryConfig?: MiniMemoryConfig);
    initialize(): Promise<void>;
    private loadFromFile;
    private saveToFile;
    createNote(note: Note): Promise<Note>;
    getNote(id: string): Promise<Note | null>;
    updateNote(id: string, updates: Partial<Note>): Promise<Note | null>;
    deleteNote(id: string): Promise<boolean>;
    listNotes(filter?: {
        category?: string;
        isFavorite?: boolean;
        isAIGenerated?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<Note[]>;
    searchNotes(query: string): Promise<Note[]>;
    createSession(session: AISession): Promise<AISession>;
    getSession(id: string): Promise<AISession | null>;
    updateSession(id: string, updates: Partial<AISession>): Promise<AISession | null>;
    recordProgress(progress: LearningProgress): Promise<void>;
    getProgress(date: string): Promise<LearningProgress | null>;
    getAllProgress(): Promise<LearningProgress[]>;
    getStats(): Promise<{
        totalNotes: number;
        favoriteNotes: number;
        aiGeneratedNotes: number;
        totalTags: number;
    }>;
}
export declare function createStorageService(dataDir?: string, miniMemoryConfig?: MiniMemoryConfig): StorageService;
//# sourceMappingURL=storage.d.ts.map