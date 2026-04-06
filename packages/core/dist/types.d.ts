export declare enum NoteCategory {
    WORK = "work",
    STUDY = "study",
    CREATIVE = "creative",
    PERSONAL = "personal",
    AI_GENERATED = "ai-generated"
}
export interface Note {
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
export interface CreateNoteInput {
    title: string;
    content?: string;
    tags?: string[];
    category?: NoteCategory;
}
export interface UpdateNoteInput {
    title?: string;
    content?: string;
    tags?: string[];
    category?: NoteCategory;
    isFavorite?: boolean;
    summary?: string;
}
export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
}
export interface AISession {
    id: string;
    noteId?: string;
    messages: Message[];
    createdAt: Date;
    updatedAt: Date;
}
export declare enum AIOperation {
    SUMMARIZE = "summarize",
    POLISH = "polish",
    TRANSLATE = "translate",
    SUGGEST = "suggest",
    CHAT = "chat"
}
export interface AIRequest {
    operation: AIOperation;
    content: string;
    noteId?: string;
    language?: string;
    style?: 'formal' | 'casual';
    length?: 'short' | 'medium' | 'long';
}
export interface AIResponse {
    success: boolean;
    result?: string;
    error?: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}
export interface LearningProgress {
    date: string;
    notesCreated: number;
    aiInteractions: number;
    studyTime: number;
}
export interface Stats {
    totalNotes: number;
    favoriteNotes: number;
    aiGeneratedNotes: number;
    totalTags: number;
    recentNotes: Note[];
    progress: LearningProgress[];
}
export interface SearchOptions {
    query: string;
    tags?: string[];
    category?: NoteCategory;
    isFavorite?: boolean;
    isAIGenerated?: boolean;
    dateRange?: {
        start: Date;
        end: Date;
    };
    limit?: number;
    offset?: number;
}
export interface SearchResult {
    notes: Note[];
    total: number;
    hasMore: boolean;
}
export interface MiniMemoryConfig {
    host: string;
    port: number;
    password?: string;
}
export interface OllamaConfig {
    host: string;
    port: number;
    model: string;
}
export interface AppConfig {
    dataDir: string;
    miniMemory: MiniMemoryConfig;
    ollama: OllamaConfig;
    server: {
        port: number;
        host: string;
    };
}
export type NoteFilter = 'all' | 'ai-generated' | 'recent' | 'favorites';
export interface APIResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}
//# sourceMappingURL=types.d.ts.map