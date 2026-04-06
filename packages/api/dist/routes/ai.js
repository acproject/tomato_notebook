import { Hono } from 'hono';
import { services } from '../index.js';
import { AIOperation } from '@tomato-notebook/core';
const ai = new Hono();
// 检查AI服务状态
ai.get('/health', async (c) => {
    const healthy = await services.ai.checkHealth();
    const models = healthy ? await services.ai.listModels() : [];
    return c.json({
        success: true,
        data: {
            status: healthy ? 'connected' : 'disconnected',
            models,
        },
    });
});
// 总结笔记
ai.post('/summarize/:id', async (c) => {
    const id = c.req.param('id');
    const { length = 'medium' } = await c.req.query();
    const response = await services.ai.summarizeNote(id, length);
    if (!response.success) {
        return c.json({ success: false, error: response.error }, 400);
    }
    return c.json({ success: true, data: { summary: response.result } });
});
// 润色笔记
ai.post('/polish/:id', async (c) => {
    const id = c.req.param('id');
    const { style = 'formal' } = await c.req.query();
    const response = await services.ai.polishNote(id, style);
    if (!response.success) {
        return c.json({ success: false, error: response.error }, 400);
    }
    return c.json({ success: true, data: { polished: response.result } });
});
// 翻译笔记
ai.post('/translate/:id', async (c) => {
    const id = c.req.param('id');
    const { language } = await c.req.query();
    if (!language) {
        return c.json({ success: false, error: 'Language is required' }, 400);
    }
    const response = await services.ai.translateNote(id, language);
    if (!response.success) {
        return c.json({ success: false, error: response.error }, 400);
    }
    return c.json({ success: true, data: { translation: response.result } });
});
// 获取学习建议
ai.get('/suggest', async (c) => {
    const noteId = c.req.query('noteId');
    const context = c.req.query('context');
    const response = await services.ai.getSuggestions(context, noteId);
    if (!response.success) {
        return c.json({ success: false, error: response.error }, 400);
    }
    return c.json({ success: true, data: { suggestions: response.result } });
});
// 通用AI操作
ai.post('/execute', async (c) => {
    const body = await c.req.json();
    const operationMap = {
        summarize: AIOperation.SUMMARIZE,
        polish: AIOperation.POLISH,
        translate: AIOperation.TRANSLATE,
        suggest: AIOperation.SUGGEST,
        chat: AIOperation.CHAT,
    };
    const operation = operationMap[body.operation];
    if (!operation) {
        return c.json({ success: false, error: 'Invalid operation' }, 400);
    }
    const response = await services.ai.execute({
        operation,
        content: body.content,
        noteId: body.noteId,
        language: body.language,
        style: body.style,
        length: body.length,
    });
    if (!response.success) {
        return c.json({ success: false, error: response.error }, 400);
    }
    return c.json({ success: true, data: { result: response.result } });
});
// 聊天会话
ai.post('/chat/session', async (c) => {
    const { noteId } = await c.req.json();
    const session = await services.ai.createChatSession(noteId);
    return c.json({ success: true, data: session });
});
// 发送聊天消息
ai.post('/chat/:sessionId', async (c) => {
    const sessionId = c.req.param('sessionId');
    const { message } = await c.req.json();
    if (!message) {
        return c.json({ success: false, error: 'Message is required' }, 400);
    }
    const response = await services.ai.chat(sessionId, message);
    if (!response.success) {
        return c.json({ success: false, error: response.error }, 400);
    }
    return c.json({ success: true, data: { reply: response.result } });
});
export default ai;
//# sourceMappingURL=ai.js.map