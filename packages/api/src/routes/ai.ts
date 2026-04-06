import { Hono } from 'hono';
import { db } from './config.js';
import { v4 as uuidv4 } from 'uuid';

const ai = new Hono();

// 从SQLite获取AI配置
function getAIConfig() {
  const rows = db.prepare('SELECT key, value FROM config WHERE key LIKE ?').all('ai.%') as Array<{ key: string; value: string }>;
  const config: Record<string, string> = {};
  for (const row of rows) {
    config[row.key] = row.value;
  }
  return {
    apiBase: config['ai.apiBase'] || 'http://localhost',
    port: config['ai.port'] || '11434',
    model: config['ai.model'] || 'llama3',
    apiKey: config['ai.apiKey'] || '',
  };
}

// 调用AI API
async function callAI(prompt: string, systemPrompt?: string): Promise<string> {
  const config = getAIConfig();
  const url = `${config.apiBase}:${config.port}/api/chat`;
  
  console.log(`[AI] Calling ${url} with model ${config.model}`);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // 如果有API Key，添加到header
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }
  
  const requestBody = {
    model: config.model,
    messages: [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      { role: 'user', content: prompt },
    ],
    stream: false,
  };
  
  console.log('[AI] Request body:', JSON.stringify(requestBody, null, 2));
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(300000), // 300秒超时
  });

  console.log('[AI] Response status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[AI] Error response:', errorText);
    throw new Error(`AI API error: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json() as {
    message?: { content: string };
    choices?: Array<{ message: { content: string } }>;
    response?: string;
  };
  console.log('[AI] Response data:', JSON.stringify(data, null, 2));
  
  // 支持Ollama格式和OpenAI格式
  if (data.message?.content) {
    return data.message.content;
  } else if (data.choices?.[0]?.message?.content) {
    return data.choices[0].message.content;
  } else if (typeof data.response === 'string') {
    return data.response;
  }
  
  throw new Error('Unexpected AI response format: ' + JSON.stringify(data));
}

// 存储聊天会话
const chatSessions = new Map<string, { noteId?: string; messages: Array<{ role: string; content: string }> }>();

// AI Prompt模板
const PROMPTS = {
  summarize: {
    short: '请用1-2句话总结以下内容的核心要点：\n\n{content}',
    medium: '请用3-5句话总结以下内容：\n\n{content}',
    long: '请详细总结以下内容，包括主要观点和细节：\n\n{content}',
  },
  polish: {
    formal: '请以正式、专业的语气润色以下文本：\n\n{content}',
    casual: '请以轻松、口语化的语气润色以下文本：\n\n{content}',
  },
  translate: '请将以下内容翻译成{language}：\n\n{content}',
  suggest: '基于以下笔记内容，提供学习建议和相关知识点推荐：\n\n{content}',
};

const SYSTEM_PROMPTS = {
  summarize: '你是一个专业的知识总结助手，擅长提取和概括文本的核心要点。',
  polish: '你是一个文字编辑专家，擅长改进文本的表达方式和语言风格。',
  translate: '你是一个专业翻译，擅长准确翻译各种语言，保持原文的意思和风格。',
  suggest: '你是一个学习顾问，根据用户提供的内容提供学习建议和相关知识推荐。',
  chat: '你是一个AI学习助手，帮助用户学习和管理笔记。请用中文回答。',
};

// 检查AI服务状态
ai.get('/health', async (c) => {
  try {
    const config = getAIConfig();
    const response = await fetch(`${config.apiBase}:${config.port}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    
    if (response.ok) {
      const data = await response.json() as { models: Array<{ name: string }> };
      return c.json({
        success: true,
        data: {
          status: 'connected',
          models: data.models.map(m => m.name),
        },
      });
    }
    return c.json({
      success: true,
      data: { status: 'disconnected', models: [] },
    });
  } catch {
    return c.json({
      success: true,
      data: { status: 'disconnected', models: [] },
    });
  }
});

// 总结笔记
ai.post('/summarize/:id', async (c) => {
  const id = c.req.param('id');
  const length = c.req.query('length') || 'medium';
  
  // 从SQLite获取笔记
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as {
    id: string;
    title: string;
    content: string;
  } | undefined;
  
  if (!note) {
    return c.json({ success: false, error: 'Note not found' }, 404);
  }
  
  try {
    const prompt = PROMPTS.summarize[length as 'short' | 'medium' | 'long']
      .replace('{content}', note.content || note.title);
    
    const result = await callAI(prompt, SYSTEM_PROMPTS.summarize);
    
    // 更新笔记摘要
    db.prepare('UPDATE notes SET summary = ? WHERE id = ?').run(result, id);
    
    return c.json({ success: true, data: { summary: result } });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'AI call failed' 
    }, 500);
  }
});

// 润色笔记
ai.post('/polish/:id', async (c) => {
  const id = c.req.param('id');
  const style = c.req.query('style') || 'formal';
  
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as {
    content: string;
  } | undefined;
  
  if (!note) {
    return c.json({ success: false, error: 'Note not found' }, 404);
  }
  
  try {
    const prompt = PROMPTS.polish[style as 'formal' | 'casual']
      .replace('{content}', note.content);
    
    const result = await callAI(prompt, SYSTEM_PROMPTS.polish);
    
    return c.json({ success: true, data: { polished: result } });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'AI call failed' 
    }, 500);
  }
});

// 翻译笔记
ai.post('/translate/:id', async (c) => {
  const id = c.req.param('id');
  const language = c.req.query('language');
  
  if (!language) {
    return c.json({ success: false, error: 'Language is required' }, 400);
  }
  
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as {
    content: string;
  } | undefined;
  
  if (!note) {
    return c.json({ success: false, error: 'Note not found' }, 404);
  }
  
  try {
    const prompt = PROMPTS.translate
      .replace('{language}', language)
      .replace('{content}', note.content);
    
    const result = await callAI(prompt, SYSTEM_PROMPTS.translate);
    
    return c.json({ success: true, data: { translation: result } });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'AI call failed' 
    }, 500);
  }
});

// 获取学习建议
ai.get('/suggest', async (c) => {
  const noteId = c.req.query('noteId');
  const context = c.req.query('context');
  
  let content = context || '';
  
  if (noteId) {
    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(noteId) as {
      content: string;
    } | undefined;
    if (note) {
      content = note.content;
    }
  }
  
  if (!content) {
    // 获取最近的笔记作为上下文
    const notes = db.prepare('SELECT title, content FROM notes ORDER BY updated_at DESC LIMIT 5').all() as Array<{
      title: string;
      content: string;
    }>;
    content = notes.map(n => n.title + ': ' + n.content?.substring(0, 200)).join('\n\n');
  }
  
  try {
    const prompt = PROMPTS.suggest.replace('{content}', content);
    const result = await callAI(prompt, SYSTEM_PROMPTS.suggest);
    
    return c.json({ success: true, data: { suggestions: result } });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'AI call failed' 
    }, 500);
  }
});

// 通用AI操作
ai.post('/execute', async (c) => {
  const body = await c.req.json() as {
    operation: 'summarize' | 'polish' | 'translate' | 'suggest' | 'chat';
    content: string;
    noteId?: string;
    language?: string;
    style?: 'formal' | 'casual';
    length?: 'short' | 'medium' | 'long';
  };
  
  try {
    let prompt: string;
    let systemPrompt: string;
    
    switch (body.operation) {
      case 'summarize':
        prompt = PROMPTS.summarize[body.length || 'medium'].replace('{content}', body.content);
        systemPrompt = SYSTEM_PROMPTS.summarize;
        break;
      case 'polish':
        prompt = PROMPTS.polish[body.style || 'formal'].replace('{content}', body.content);
        systemPrompt = SYSTEM_PROMPTS.polish;
        break;
      case 'translate':
        prompt = PROMPTS.translate.replace('{language}', body.language || '英文').replace('{content}', body.content);
        systemPrompt = SYSTEM_PROMPTS.translate;
        break;
      case 'suggest':
        prompt = PROMPTS.suggest.replace('{content}', body.content);
        systemPrompt = SYSTEM_PROMPTS.suggest;
        break;
      case 'chat':
      default:
        prompt = body.content;
        systemPrompt = SYSTEM_PROMPTS.chat;
        break;
    }
    
    const result = await callAI(prompt, systemPrompt);
    return c.json({ success: true, data: { result } });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'AI call failed' 
    }, 500);
  }
});

// 创建聊天会话
ai.post('/chat/session', async (c) => {
  const { noteId } = await c.req.json() as { noteId?: string };
  
  const sessionId = uuidv4();
  chatSessions.set(sessionId, {
    noteId,
    messages: [],
  });
  
  return c.json({ 
    success: true, 
    data: { id: sessionId } 
  });
});

// 发送聊天消息
ai.post('/chat/:sessionId', async (c) => {
  const sessionId = c.req.param('sessionId');
  const { message } = await c.req.json() as { message: string };
  
  if (!message) {
    return c.json({ success: false, error: 'Message is required' }, 400);
  }
  
  const session = chatSessions.get(sessionId);
  if (!session) {
    return c.json({ success: false, error: 'Session not found' }, 404);
  }
  
  try {
    // 构建上下文
    let context = '';
    if (session.noteId) {
      const note = db.prepare('SELECT title, content FROM notes WHERE id = ?').get(session.noteId) as {
        title: string;
        content: string;
      } | undefined;
      if (note) {
        context = `当前笔记内容：\n标题：${note.title}\n内容：${note.content}\n\n`;
      }
    }
    
    // 添加历史消息到上下文
    const historyContext = session.messages
      .map(m => `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`)
      .join('\n');
    
    const fullPrompt = context + historyContext + `\n用户: ${message}`;
    
    const result = await callAI(fullPrompt, SYSTEM_PROMPTS.chat);
    
    // 保存消息历史
    session.messages.push({ role: 'user', content: message });
    session.messages.push({ role: 'assistant', content: result });
    
    return c.json({ success: true, data: { reply: result } });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'AI call failed' 
    }, 500);
  }
});

export default ai;
