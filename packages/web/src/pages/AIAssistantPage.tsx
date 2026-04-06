import { useState, useRef, useEffect } from 'react';
import { api } from '../api/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // 创建会话（如果没有）
      let sid = sessionId;
      if (!sid) {
        const sessionResponse = await api.createChatSession();
        if (sessionResponse.success && sessionResponse.data) {
          sid = sessionResponse.data.id;
          setSessionId(sid);
        }
      }

      if (sid) {
        const response = await api.sendChatMessage(sid, userMessage.content);
        if (response.success && response.data) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response.data.reply,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, assistantMessage]);
        }
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，出现了一些问题，请稍后重试。',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setLoading(false);
  };

  const handleQuickAction = async (action: string) => {
    let prompt = '';
    switch (action) {
      case 'summarize':
        prompt = '请帮我总结最近学习的内容';
        break;
      case 'suggest':
        prompt = '请给我一些学习建议';
        break;
      case 'plan':
        prompt = '帮我制定一个学习计划';
        break;
      case 'review':
        prompt = '帮我复习一下学过的知识点';
        break;
    }
    setInput(prompt);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 头部 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">AI 学习助手</h1>
        <p className="text-sm text-gray-500">智能辅助你的学习</p>
      </div>

      {/* 快捷操作 */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex gap-2">
          {[
            { id: 'summarize', label: '📝 总结', color: 'purple' },
            { id: 'suggest', label: '💡 建议', color: 'yellow' },
            { id: 'plan', label: '📅 计划', color: 'blue' },
            { id: 'review', label: '🔄 复习', color: 'green' },
          ].map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action.id)}
              className={`px-3 py-1.5 text-sm rounded-lg bg-${action.color}-50 text-${action.color}-600 hover:bg-${action.color}-100`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* 消息区域 */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">🤖</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">你好！我是AI学习助手</h2>
            <p className="text-gray-500 max-w-md">
              我可以帮你总结笔记、润色文本、制定学习计划、回答问题等。
              有什么我可以帮助你的吗？
            </p>
            <div className="grid grid-cols-2 gap-3 mt-6">
              {[
                '帮我总结最近的学习内容',
                '给我一些学习建议',
                '制定一个学习计划',
                '解释一下这个概念',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-purple-300 hover:text-purple-600"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-purple-500 text-white'
                      : 'bg-white shadow-sm border border-gray-100'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-purple-200' : 'text-gray-400'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white shadow-sm border border-gray-100 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="输入你的问题..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}

export default AIAssistantPage;
