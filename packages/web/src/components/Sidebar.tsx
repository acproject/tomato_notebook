import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotes } from '../hooks/useNotes';

type FilterType = 'all' | 'ai-generated' | 'recent' | 'favorites';

function Sidebar() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const { notes, loading } = useNotes(activeFilter);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'all', label: '全部', icon: '📄' },
    { id: 'ai-generated', label: 'AI生成', icon: '🤖' },
    { id: 'recent', label: '最近', icon: '🕐' },
    { id: 'favorites', label: '收藏', icon: '⭐' },
  ];

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* 搜索框 */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            placeholder="搜索笔记..."
            className="w-full px-3 py-2 pl-9 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* 导航区域 */}
      <div className="p-4">
        <div className="text-xs font-semibold text-gray-400 uppercase mb-2">导航</div>
        <button
          onClick={() => navigate('/ai')}
          className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg hover:bg-purple-50 text-purple-600 bg-purple-50"
        >
          <span>🤖</span>
          <span>AI 助手</span>
        </button>
      </div>

      {/* 过滤标签 */}
      <div className="px-4 py-2">
        <div className="flex gap-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleFilterChange(item.id as FilterType)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                activeFilter === item.id
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 笔记列表 */}
      <div className="flex-1 overflow-auto p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-400 uppercase">我的笔记</span>
          <button
            onClick={() => navigate('/')}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100"
          >
            +
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-2 p-2">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {notes.map((note) => (
              <button
                key={note.id}
                onClick={() => navigate(`/notes/${note.id}`)}
                className="w-full flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 text-left group"
              >
                <span className="text-gray-400 mt-0.5">
                  {note.isFavorite ? '⭐' : '📄'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{note.title}</div>
                  <div className="text-xs text-gray-400 truncate">
                    {note.content.substring(0, 50)}...
                  </div>
                </div>
                {note.isAIGenerated && (
                  <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">
                    AI
                  </span>
                )}
              </button>
            ))}

            {notes.length === 0 && (
              <div className="text-center text-gray-400 py-8 text-sm">
                暂无笔记
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI功能快捷入口 */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs font-semibold text-gray-400 uppercase mb-2">AI 功能</div>
        <div className="space-y-1">
          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-lg hover:bg-gray-50">
            <span>⚡</span>
            <span>快速总结</span>
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-lg hover:bg-gray-50">
            <span>💡</span>
            <span>智能建议</span>
          </button>
        </div>
      </div>

      {/* 设置入口 */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => navigate('/settings')}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-lg hover:bg-gray-50 text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>设置</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
