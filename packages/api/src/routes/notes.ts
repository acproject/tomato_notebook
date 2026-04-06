import { Hono } from 'hono';
import { services } from '../index.js';
import type { CreateNoteInput, UpdateNoteInput, NoteFilter } from '@tomato-notebook/core';

const notes = new Hono();

// 获取笔记列表
notes.get('/', async (c) => {
  const filter = c.req.query('filter') as NoteFilter | undefined;
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = parseInt(c.req.query('offset') || '0');

  const noteList = await services.notes.listNotes(filter, limit, offset);
  const stats = await services.storage.getStats();

  return c.json({
    success: true,
    data: noteList,
    meta: {
      total: stats.totalNotes,
      limit,
      offset,
    },
  });
});

// 创建笔记
notes.post('/', async (c) => {
  try {
    const body = await c.req.json() as CreateNoteInput;
    
    if (!body.title) {
      return c.json({ success: false, error: 'Title is required' }, 400);
    }

    const note = await services.notes.createNote(body);
    return c.json({ success: true, data: note }, 201);
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// 获取单个笔记
notes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const note = await services.notes.getNote(id);

  if (!note) {
    return c.json({ success: false, error: 'Note not found' }, 404);
  }

  return c.json({ success: true, data: note });
});

// 更新笔记
notes.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json() as UpdateNoteInput;

  const note = await services.notes.updateNote(id, body);

  if (!note) {
    return c.json({ success: false, error: 'Note not found' }, 404);
  }

  return c.json({ success: true, data: note });
});

// 删除笔记
notes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const success = await services.notes.deleteNote(id);

  if (!success) {
    return c.json({ success: false, error: 'Note not found' }, 404);
  }

  return c.json({ success: true });
});

// 切换收藏状态
notes.post('/:id/favorite', async (c) => {
  const id = c.req.param('id');
  const note = await services.notes.toggleFavorite(id);

  if (!note) {
    return c.json({ success: false, error: 'Note not found' }, 404);
  }

  return c.json({ success: true, data: note });
});

// 添加标签
notes.post('/:id/tags', async (c) => {
  const id = c.req.param('id');
  const { tags } = await c.req.json() as { tags: string[] };

  const note = await services.notes.addTags(id, tags);

  if (!note) {
    return c.json({ success: false, error: 'Note not found' }, 404);
  }

  return c.json({ success: true, data: note });
});

// 移除标签
notes.delete('/:id/tags', async (c) => {
  const id = c.req.param('id');
  const { tags } = await c.req.json() as { tags: string[] };

  const note = await services.notes.removeTags(id, tags);

  if (!note) {
    return c.json({ success: false, error: 'Note not found' }, 404);
  }

  return c.json({ success: true, data: note });
});

// 导出笔记
notes.get('/:id/export', async (c) => {
  const id = c.req.param('id');
  const format = c.req.query('format') || 'json';

  const note = await services.notes.getNote(id);

  if (!note) {
    return c.json({ success: false, error: 'Note not found' }, 404);
  }

  let content: string;
  let contentType: string;

  if (format === 'markdown' || format === 'md') {
    content = services.notes.exportToMarkdown(note);
    contentType = 'text/markdown';
  } else {
    content = services.notes.exportToJSON(note);
    contentType = 'application/json';
  }

  return new Response(content, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${note.title}.${format === 'markdown' ? 'md' : 'json'}"`,
    },
  });
});

// 获取统计信息
notes.get('/stats/summary', async (c) => {
  const stats = await services.storage.getStats();
  return c.json({ success: true, data: stats });
});

export default notes;
