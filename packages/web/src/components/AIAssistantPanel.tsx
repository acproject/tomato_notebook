import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useNote } from '../hooks/useNotes';
import { api } from '../api/client';

function AIAssistantPanel() {
  const { id: noteId } = useParams<{ id: string }>();
  const { note } = useNote(noteId || null);
  
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleQuickAction = async (action: 'summarize' | 'polish' | 'translate' | 'suggest') => {
    if (!noteId || !note) return;
    
    setLoading(true);
    
    switch (action) {
      case 'summarize': {
        const response = await api.summarizeNote(noteId);
        if (response.success && response.data) {
          setMessages(prev => [...prev, { role: 'assistant', content: `摘要：\n${response.data!.summary}` }]);
        }
        break;
      }
      case 'polish': {
        const response = await api.polishNote(noteId);
        if (response.success && response.data) {
          setMessages(prev => [...prev, { role: 'assistant', content: `润色结果：\n${response.data!.polished}` }]);
        }
        break;
      }
      case 'suggest': {
        const response = await api.getSuggestions(noteId);
        if (response.success && response.data) {
          setMessages(prev => [...prev, { role: 'assistant', content: response.data!.suggestions }]);
        }
        break;
      }
    }
    
    setLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');
    setLoading(true);
    
    // 创建会话（如果没有）
    let sid = sessionId;
    if (!sid) {
      const sessionResponse = await api.createChatSession(noteId);
      if (sessionResponse.success && sessionResponse.data) {
        sid = sessionResponse.data.id;
        setSessionId(sid);
      }
    }
    
    if (sid) {
      const response = await api.sendChatMessage(sid, input);
      if (response.success && response.data) {
        setMessages(prev => [...prev, { role: 'assistant', content: response.data!.reply }]);
      }
    }
    
    setLoading(false);
  };

  return (
    <aside className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* 标题 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">AI 学习助手</h3>
          <span className="flex items-center gap-1 text-xs text-green-600">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            在线
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">智能辅助你的学习</p>
      </div>

      {/* 快捷操作 */}
      {note && (
        <div className="p-4 border-b border-gray-200">
          <div className="text-xs text-gray-500 mb-2">快捷操作</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickAction('summarize')}
              className="flex items-center gap-1 px-3 py-2 text-xs bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100"
            >
              <span>📝</span> 总结
            </button>
            <button
              onClick={() => handleQuickAction('polish')}
              className="flex items-center gap-1 px-3 py-2 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
            >
              <span>✨</span> 润色
            </button>
            <button
              onClick={() => handleQuickAction('suggest')}
              className="flex items-center gap-1 px-3 py-2 text-xs bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100"
            >
              <span>💡</span> 建议
            </button>
            <button
              className="flex items-center gap-1 px-3 py-2 text-xs bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
            >
              <span>🌐</span> 翻译
            </button>
          </div>
        </div>
      )}

      {/* 消息区域 */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <p>你好！我可以帮你：</p>
            <ul className="text-sm mt-2 space-y-1">
              <li>总结笔记内容</li>
              <li>润色文本表达</li>
              <li>提供学习建议</li>
              <li>翻译笔记内容</li>
            </ul>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                msg.role === 'user'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-3 py-2 rounded-lg text-sm text-gray-500">
              思考中...
            </div>
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="输入问题或笔记内容..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center hover:bg-purple-600 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}

export default AIAssistantPanel;
