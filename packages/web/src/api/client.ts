const API_BASE = '/api';

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total: number;
    hasMore?: boolean;
  };
}

// 笔记类型
export interface Note {
  id: string;
  title: string;
  content: string;
  summary?: string;
  tags: string[];
  category: string;
  isFavorite: boolean;
  isAIGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

// API客户端
class APIClient {
  private async request<T>(path: string, options: RequestInit = {}): Promise<APIResponse<T>> {
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // 笔记API
  async getNotes(filter?: string, limit = 20): Promise<APIResponse<Note[]>> {
    return this.request<Note[]>(`/notes?filter=${filter || 'all'}&limit=${limit}`);
  }

  async getNote(id: string): Promise<APIResponse<Note>> {
    return this.request<Note>(`/notes/${id}`);
  }

  async createNote(data: { title: string; content?: string; tags?: string[] }): Promise<APIResponse<Note>> {
    return this.request<Note>('/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateNote(id: string, data: Partial<Note>): Promise<APIResponse<Note>> {
    return this.request<Note>(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteNote(id: string): Promise<APIResponse<void>> {
    return this.request<void>(`/notes/${id}`, { method: 'DELETE' });
  }

  async toggleFavorite(id: string): Promise<APIResponse<Note>> {
    return this.request<Note>(`/notes/${id}/favorite`, { method: 'POST' });
  }

  async addTags(id: string, tags: string[]): Promise<APIResponse<Note>> {
    return this.request<Note>(`/notes/${id}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tags }),
    });
  }

  // 搜索API
  async searchNotes(query: string, options?: { tags?: string[]; limit?: number }): Promise<APIResponse<Note[]>> {
    let url = `/search?q=${encodeURIComponent(query)}`;
    if (options?.tags) url += `&tags=${options.tags.join(',')}`;
    if (options?.limit) url += `&limit=${options.limit}`;
    return this.request<Note[]>(url);
  }

  // AI API
  async summarizeNote(noteId: string, length: 'short' | 'medium' | 'long' = 'medium'): Promise<APIResponse<{ summary: string }>> {
    return this.request<{ summary: string }>(`/ai/summarize/${noteId}?length=${length}`, { method: 'POST' });
  }

  async polishNote(noteId: string, style: 'formal' | 'casual' = 'formal'): Promise<APIResponse<{ polished: string }>> {
    return this.request<{ polished: string }>(`/ai/polish/${noteId}?style=${style}`, { method: 'POST' });
  }

  async translateNote(noteId: string, language: string): Promise<APIResponse<{ translation: string }>> {
    return this.request<{ translation: string }>(`/ai/translate/${noteId}?language=${encodeURIComponent(language)}`, { method: 'POST' });
  }

  async getSuggestions(noteId?: string, context?: string): Promise<APIResponse<{ suggestions: string }>> {
    let url = '/ai/suggest?';
    if (noteId) url += `noteId=${noteId}`;
    if (context) url += `context=${encodeURIComponent(context)}`;
    return this.request<{ suggestions: string }>(url);
  }

  async createChatSession(noteId?: string): Promise<APIResponse<{ id: string }>> {
    return this.request<{ id: string }>('/ai/chat/session', {
      method: 'POST',
      body: JSON.stringify({ noteId }),
    });
  }

  async sendChatMessage(sessionId: string, message: string): Promise<APIResponse<{ reply: string }>> {
    return this.request<{ reply: string }>(`/ai/chat/${sessionId}`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // 状态API
  async getStatus(): Promise<APIResponse<{ ai: string; stats: { totalNotes: number; favoriteNotes: number } }>> {
    return this.request<{ ai: string; stats: { totalNotes: number; favoriteNotes: number } }>('/status');
  }

  async getStats(): Promise<APIResponse<{ totalNotes: number; favoriteNotes: number; aiGeneratedNotes: number; totalTags: number }>> {
    return this.request<{ totalNotes: number; favoriteNotes: number; aiGeneratedNotes: number; totalTags: number }>('/notes/stats/summary');
  }

  // 配置API
  async getConfig(): Promise<APIResponse<AppConfig>> {
    return this.request<AppConfig>('/config');
  }

  async updateAIConfig(data: Partial<AppConfig['ai']>): Promise<APIResponse<AppConfig['ai']>> {
    return this.request<AppConfig['ai']>('/config/ai', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateMiniMemoryConfig(data: Partial<AppConfig['miniMemory']>): Promise<APIResponse<AppConfig['miniMemory']>> {
    return this.request<AppConfig['miniMemory']>('/config/miniMemory', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateServerConfig(data: Partial<AppConfig['server']>): Promise<APIResponse<AppConfig['server']>> {
    return this.request<AppConfig['server']>('/config/server', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async resetConfig(): Promise<APIResponse<AppConfig>> {
    return this.request<AppConfig>('/config/reset', { method: 'POST' });
  }

  async testAIConnection(): Promise<APIResponse<{ connected: boolean; models?: string[] }>> {
    return this.request<{ connected: boolean; models?: string[] }>('/config/ai/test');
  }

  async testMiniMemoryConnection(): Promise<APIResponse<{ connected: boolean }>> {
    return this.request<{ connected: boolean }>('/config/miniMemory/test');
  }
}

// 应用配置类型
export interface AppConfig {
  ai: {
    apiBase: string;
    port: number;
    model: string;
    apiKey: string;
  };
  miniMemory: {
    host: string;
    port: number;
    enabled: boolean;
    password: string;
  };
  server: {
    port: number;
    host: string;
  };
}

export const api = new APIClient();
