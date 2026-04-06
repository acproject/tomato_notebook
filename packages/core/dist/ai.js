import { AIOperation } from './types.js';
import { v4 as uuidv4 } from 'uuid';
// AI Prompt模板
const PROMPTS = {
    [AIOperation.SUMMARIZE]: {
        short: '请用1-2句话总结以下内容的核心要点：\n\n{content}',
        medium: '请用3-5句话总结以下内容：\n\n{content}',
        long: '请详细总结以下内容，包括主要观点和细节：\n\n{content}',
    },
    [AIOperation.POLISH]: {
        formal: '请以正式、专业的语气润色以下文本：\n\n{content}',
        casual: '请以轻松、口语化的语气润色以下文本：\n\n{content}',
    },
    [AIOperation.TRANSLATE]: '请将以下内容翻译成{language}：\n\n{content}',
    [AIOperation.SUGGEST]: '基于以下笔记内容，提供学习建议和相关知识点推荐：\n\n{content}',
    [AIOperation.CHAT]: '{content}',
};
// AI服务类
export class AIService {
    config;
    storage;
    noteService;
    baseUrl;
    constructor(config) {
        this.config = config.ollama;
        this.storage = config.storage;
        this.noteService = config.noteService;
        this.baseUrl = `http://${this.config.host}:${this.config.port}`;
    }
    // 检查Ollama服务状态
    async checkHealth() {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            return response.ok;
        }
        catch {
            return false;
        }
    }
    // 获取可用模型列表
    async listModels() {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            const data = await response.json();
            return data.models.map(m => m.name);
        }
        catch {
            return [];
        }
    }
    // 调用Ollama API
    async callOllama(prompt, systemPrompt) {
        const response = await fetch(`${this.baseUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: this.config.model,
                messages: [
                    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
                    { role: 'user', content: prompt },
                ],
                stream: false,
            }),
        });
        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }
        const data = await response.json();
        return data.message.content;
    }
    // 执行AI操作
    async execute(request) {
        try {
            let prompt;
            switch (request.operation) {
                case AIOperation.SUMMARIZE:
                    prompt = PROMPTS[AIOperation.SUMMARIZE][request.length || 'medium']
                        .replace('{content}', request.content);
                    break;
                case AIOperation.POLISH:
                    prompt = PROMPTS[AIOperation.POLISH][request.style || 'formal']
                        .replace('{content}', request.content);
                    break;
                case AIOperation.TRANSLATE:
                    prompt = PROMPTS[AIOperation.TRANSLATE]
                        .replace('{language}', request.language || '英文')
                        .replace('{content}', request.content);
                    break;
                case AIOperation.SUGGEST:
                    prompt = PROMPTS[AIOperation.SUGGEST].replace('{content}', request.content);
                    break;
                case AIOperation.CHAT:
                    prompt = PROMPTS[AIOperation.CHAT].replace('{content}', request.content);
                    break;
                default:
                    throw new Error(`Unknown operation: ${request.operation}`);
            }
            const result = await this.callOllama(prompt, this.getSystemPrompt(request.operation));
            // 如果指定了笔记ID，更新笔记摘要或内容
            if (request.noteId && request.operation === AIOperation.SUMMARIZE) {
                await this.noteService.updateSummary(request.noteId, result);
            }
            return {
                success: true,
                result,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    // 获取系统提示词
    getSystemPrompt(operation) {
        const systemPrompts = {
            [AIOperation.SUMMARIZE]: '你是一个专业的知识总结助手，擅长提取和概括文本的核心要点。',
            [AIOperation.POLISH]: '你是一个文字编辑专家，擅长改进文本的表达方式和语言风格。',
            [AIOperation.TRANSLATE]: '你是一个专业翻译，擅长准确翻译各种语言，保持原文的意思和风格。',
            [AIOperation.SUGGEST]: '你是一个学习顾问，根据用户提供的内容提供学习建议和相关知识推荐。',
            [AIOperation.CHAT]: '你是一个AI学习助手，帮助用户学习和管理笔记。请用中文回答。',
        };
        return systemPrompts[operation];
    }
    // 总结笔记
    async summarizeNote(noteId, length = 'medium') {
        const note = await this.noteService.getNote(noteId);
        if (!note) {
            return { success: false, error: 'Note not found' };
        }
        return this.execute({
            operation: AIOperation.SUMMARIZE,
            content: note.content,
            noteId,
            length,
        });
    }
    // 润色笔记
    async polishNote(noteId, style = 'formal') {
        const note = await this.noteService.getNote(noteId);
        if (!note) {
            return { success: false, error: 'Note not found' };
        }
        return this.execute({
            operation: AIOperation.POLISH,
            content: note.content,
            noteId,
            style,
        });
    }
    // 翻译笔记
    async translateNote(noteId, language) {
        const note = await this.noteService.getNote(noteId);
        if (!note) {
            return { success: false, error: 'Note not found' };
        }
        return this.execute({
            operation: AIOperation.TRANSLATE,
            content: note.content,
            noteId,
            language,
        });
    }
    // 获取学习建议
    async getSuggestions(context, noteId) {
        let content = context || '';
        if (noteId) {
            const note = await this.noteService.getNote(noteId);
            if (note) {
                content = note.content;
            }
        }
        if (!content) {
            // 获取最近的笔记作为上下文
            const notes = await this.noteService.listNotes('recent', 5);
            content = notes.map(n => n.title + ': ' + n.content.substring(0, 200)).join('\n\n');
        }
        return this.execute({
            operation: AIOperation.SUGGEST,
            content,
        });
    }
    // 创建聊天会话
    async createChatSession(noteId) {
        const session = {
            id: uuidv4(),
            noteId,
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        return this.storage.createSession(session);
    }
    // 发送聊天消息
    async chat(sessionId, message) {
        const session = await this.storage.getSession(sessionId);
        if (!session) {
            return { success: false, error: 'Session not found' };
        }
        // 添加用户消息
        const userMessage = {
            role: 'user',
            content: message,
            timestamp: new Date(),
        };
        session.messages.push(userMessage);
        // 构建上下文
        let context = '';
        if (session.noteId) {
            const note = await this.noteService.getNote(session.noteId);
            if (note) {
                context = `当前笔记内容：\n标题：${note.title}\n内容：${note.content}\n\n`;
            }
        }
        // 调用AI
        const prompt = context + message;
        const result = await this.callOllama(prompt, this.getSystemPrompt(AIOperation.CHAT));
        // 添加AI回复
        const assistantMessage = {
            role: 'assistant',
            content: result,
            timestamp: new Date(),
        };
        session.messages.push(assistantMessage);
        // 更新会话
        await this.storage.updateSession(sessionId, { messages: session.messages });
        return {
            success: true,
            result,
        };
    }
}
// 创建AI服务实例
export function createAIService(config) {
    return new AIService(config);
}
//# sourceMappingURL=ai.js.map