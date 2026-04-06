import { useState, useEffect, useCallback } from 'react';
import { api, Note } from '../api/client';

// 获取笔记列表
export function useNotes(filter?: string) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await api.getNotes(filter);
    if (response.success && response.data) {
      setNotes(response.data);
    } else {
      setError(response.error || 'Failed to fetch notes');
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return { notes, loading, error, refetch: fetchNotes };
}

// 获取单个笔记
export function useNote(id: string | null) {
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setNote(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    api.getNote(id).then(response => {
      if (response.success && response.data) {
        setNote(response.data);
      } else {
        setError(response.error || 'Note not found');
      }
      setLoading(false);
    });
  }, [id]);

  return { note, loading, error };
}

// 搜索笔记
export function useSearch() {
  const [results, setResults] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    const response = await api.searchNotes(query);
    if (response.success && response.data) {
      setResults(response.data);
    } else {
      setError(response.error || 'Search failed');
    }
    setLoading(false);
  }, []);

  return { results, loading, error, search };
}

// 创建笔记
export function useCreateNote() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (data: { title: string; content?: string; tags?: string[] }) => {
    setLoading(true);
    setError(null);
    const response = await api.createNote(data);
    setLoading(false);
    
    if (response.success && response.data) {
      return response.data;
    } else {
      setError(response.error || 'Failed to create note');
      return null;
    }
  }, []);

  return { create, loading, error };
}

// 统计数据
export function useStats() {
  const [stats, setStats] = useState({
    totalNotes: 0,
    favoriteNotes: 0,
    aiGeneratedNotes: 0,
    totalTags: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStats().then(response => {
      if (response.success && response.data) {
        setStats(response.data);
      }
      setLoading(false);
    });
  }, []);

  return { stats, loading };
}
