// 笔记分类枚举
export enum NoteCategory {
  WORK = 'work',
  STUDY = 'study',
  CREATIVE = 'creative',
  PERSONAL = 'personal',
  AI_GENERATED = 'ai-generated',
}

// 笔记接口
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

// 创建笔记的输入
export interface CreateNoteInput {
  title: string;
  content?: string;
  tags?: string[];
  category?: NoteCategory;
}

// 更新笔记的输入
export interface UpdateNoteInput {
  title?: string;
  content?: string;
  tags?: string[];
  category?: NoteCategory;
  isFavorite?: boolean;
  summary?: string;
}

// AI消息
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

// AI会话
export interface AISession {
  id: string;
  noteId?: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// AI操作类型
export enum AIOperation {
  SUMMARIZE = 'summarize',
  POLISH = 'polish',
  TRANSLATE = 'translate',
  SUGGEST = 'suggest',
  CHAT = 'chat',
}

// AI请求
export interface AIRequest {
  operation: AIOperation;
  content: string;
  noteId?: string;
  language?: string;
  style?: 'formal' | 'casual';
  length?: 'short' | 'medium' | 'long';
}

// AI响应
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

// 学习进度
export interface LearningProgress {
  date: string;
  notesCreated: number;
  aiInteractions: number;
  studyTime: number;
}

// 统计信息
export interface Stats {
  totalNotes: number;
  favoriteNotes: number;
  aiGeneratedNotes: number;
  totalTags: number;
  recentNotes: Note[];
  progress: LearningProgress[];
}

// 搜索选项
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

// 搜索结果
export interface SearchResult {
  notes: Note[];
  total: number;
  hasMore: boolean;
}

// MiniMemory 配置
export interface MiniMemoryConfig {
  host: string;
  port: number;
  password?: string;
}

// Ollama 配置
export interface OllamaConfig {
  host: string;
  port: number;
  model: string;
}

// 应用配置
export interface AppConfig {
  dataDir: string;
  miniMemory: MiniMemoryConfig;
  ollama: OllamaConfig;
  server: {
    port: number;
    host: string;
  };
}

// 笔记列表过滤选项
export type NoteFilter = 'all' | 'ai-generated' | 'recent' | 'favorites';

// API响应包装
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
