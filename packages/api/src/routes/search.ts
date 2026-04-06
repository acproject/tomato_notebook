import { Hono } from 'hono';
import { services } from '../index.js';
import type { SearchOptions } from '@tomato-notebook/core';
import { NoteCategory } from '@tomato-notebook/core';

const search = new Hono();

// 搜索笔记
search.get('/', async (c) => {
  const query = c.req.query('q') || '';
  
  if (!query) {
    return c.json({ success: false, error: 'Query is required' }, 400);
  }

  const options: SearchOptions = {
    query,
    tags: c.req.query('tags')?.split(',').filter(Boolean),
    limit: parseInt(c.req.query('limit') || '20'),
    offset: parseInt(c.req.query('offset') || '0'),
  };

  // 解析分类过滤
  const category = c.req.query('category');
  if (category && Object.values(NoteCategory).includes(category as NoteCategory)) {
    options.category = category as NoteCategory;
  }

  // 解析其他过滤条件
  if (c.req.query('favorite') === 'true') {
    options.isFavorite = true;
  }
  if (c.req.query('ai-generated') === 'true') {
    options.isAIGenerated = true;
  }

  // 解析日期范围
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');
  if (startDate && endDate) {
    options.dateRange = {
      start: new Date(startDate),
      end: new Date(endDate),
    };
  }

  const result = await services.search.search(options);

  return c.json({
    success: true,
    data: result.notes,
    meta: {
      total: result.total,
      hasMore: result.hasMore,
    },
  });
});

// 快速搜索（标题匹配）
search.get('/quick', async (c) => {
  const query = c.req.query('q') || '';
  
  if (!query) {
    return c.json({ success: false, error: 'Query is required' }, 400);
  }

  const notes = await services.search.quickSearch(query);

  return c.json({
    success: true,
    data: notes,
  });
});

// 获取搜索建议
search.get('/suggestions', async (c) => {
  const query = c.req.query('q') || '';
  
  if (!query) {
    return c.json({ success: true, data: [] });
  }

  const suggestions = await services.search.getSuggestions(query);

  return c.json({
    success: true,
    data: suggestions,
  });
});

export default search;
