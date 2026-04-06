import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNote } from '../hooks/useNotes';
import { api } from '../api/client';

function NotePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { note, loading, error } = useNote(id || null);
  
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    }
  }, [note]);

  const handleSave = async () => {
    if (!id) return;
    
    setSaving(true);
    await api.updateNote(id, { title, content });
    setEditing(false);
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    
    if (confirm('确定要删除这条笔记吗？')) {
      await api.deleteNote(id);
      navigate('/');
    }
  };

  const handleToggleFavorite = async () => {
    if (!id) return;
    await api.toggleFavorite(id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-4xl mb-4">📝</div>
        <div className="text-gray-600">笔记不存在</div>
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-purple-500 hover:underline"
        >
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 工具栏 */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={handleToggleFavorite}
              className={`p-1 ${note.isFavorite ? 'text-yellow-500' : 'text-gray-400'}`}
            >
              {note.isFavorite ? '★' : '☆'}
            </button>
            {note.isAIGenerated && (
              <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded">
                AI生成
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                编辑
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1 text-red-500 hover:bg-red-50 rounded-lg"
              >
                删除
              </button>
            </>
          )}
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-auto p-6">
        {editing ? (
          <div className="max-w-3xl mx-auto">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-2xl font-bold mb-4 px-0 border-0 focus:outline-none bg-transparent"
              placeholder="笔记标题"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[400px] px-0 border-0 focus:outline-none bg-transparent resize-none"
              placeholder="开始写笔记..."
            />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{note.title}</h1>
            {note.summary && (
              <div className="bg-purple-50 rounded-lg p-4 mb-6">
                <div className="text-sm text-purple-600 font-medium mb-1">AI 摘要</div>
                <p className="text-gray-700">{note.summary}</p>
              </div>
            )}
            <div className="prose prose-sm max-w-none">
              {note.content.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-4 text-gray-700">
                  {paragraph}
                </p>
              ))}
            </div>
            {note.tags.length > 0 && (
              <div className="flex gap-2 mt-6">
                {note.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI写作助手 */}
      <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>✨</span>
            <span>AI 写作助手</span>
            <span className="text-xs text-gray-400">点击生成内容摘要、润色文本或获取写作建议</span>
          </div>
          <button className="px-3 py-1 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600">
            使用
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotePage;
