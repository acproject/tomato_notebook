import type { OllamaConfig, AIRequest, AIResponse, AISession } from './types.js';
import { StorageService } from './storage.js';
import { NoteService } from './note.js';
export interface AIServiceConfig {
    ollama: OllamaConfig;
    storage: StorageService;
    noteService: NoteService;
}
export declare class AIService {
    private config;
    private storage;
    private noteService;
    private baseUrl;
    constructor(config: AIServiceConfig);
    checkHealth(): Promise<boolean>;
    listModels(): Promise<string[]>;
    private callOllama;
    execute(request: AIRequest): Promise<AIResponse>;
    private getSystemPrompt;
    summarizeNote(noteId: string, length?: 'short' | 'medium' | 'long'): Promise<AIResponse>;
    polishNote(noteId: string, style?: 'formal' | 'casual'): Promise<AIResponse>;
    translateNote(noteId: string, language: string): Promise<AIResponse>;
    getSuggestions(context?: string, noteId?: string): Promise<AIResponse>;
    createChatSession(noteId?: string): Promise<AISession>;
    chat(sessionId: string, message: string): Promise<AIResponse>;
}
export declare function createAIService(config: AIServiceConfig): AIService;
//# sourceMappingURL=ai.d.ts.map