import type { Note, CreateNoteInput, UpdateNoteInput, NoteFilter } from './types.js';
import { NoteCategory } from './types.js';
import { StorageService } from './storage.js';
export declare class NoteService {
    private storage;
    constructor(storage: StorageService);
    createNote(input: CreateNoteInput): Promise<Note>;
    getNote(id: string): Promise<Note | null>;
    updateNote(id: string, input: UpdateNoteInput): Promise<Note | null>;
    deleteNote(id: string): Promise<boolean>;
    listNotes(filter?: NoteFilter, limit?: number, offset?: number): Promise<Note[]>;
    toggleFavorite(id: string): Promise<Note | null>;
    setFavorite(id: string, favorite: boolean): Promise<Note | null>;
    addTags(id: string, tags: string[]): Promise<Note | null>;
    removeTags(id: string, tags: string[]): Promise<Note | null>;
    setCategory(id: string, category: NoteCategory): Promise<Note | null>;
    searchNotes(query: string): Promise<Note[]>;
    updateSummary(id: string, summary: string): Promise<Note | null>;
    markAsAIGenerated(id: string): Promise<Note | null>;
    exportToMarkdown(note: Note): string;
    exportToJSON(note: Note): string;
}
export declare function createNoteService(storage: StorageService): NoteService;
//# sourceMappingURL=note.d.ts.map