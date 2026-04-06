import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../hooks/useNotes';

function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { results, loading, search } = useSearch();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      search(searchQuery);
      setSearchOpen(true);
    }
  };

  const handleResultClick = (noteId: string) => {
    navigate(`/notes/${noteId}`);
    setSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <header className="h-14 bg-slate-800 text-white flex items-center justify-between px-4 relative z-50">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-purple-500 rounded flex items-center justify-center">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
        </div>
        <span className="text-lg font-semibold">AI学习笔记本</span>
      </div>

      {/* 搜索栏 */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md mx-8 relative">
        <div className="relative">
          <input
            type="text"
            placeholder="搜索笔记、知识点..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* 搜索结果下拉 */}
        {searchOpen && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border max-h-96 overflow-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">搜索中...</div>
            ) : (
              results.map((note) => (
                <button
                  key={note.id}
                  onClick={() => handleResultClick(note.id)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0"
                >
                  <div className="font-medium text-gray-900">{note.title}</div>
                  <div className="text-sm text-gray-500 truncate">{note.content.substring(0, 100)}...</div>
                </button>
              ))
            )}
          </div>
        )}
      </form>

      {/* 右侧图标 */}
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-slate-700 rounded-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center font-semibold">
          A
        </div>
      </div>

      {/* 点击外部关闭搜索结果 */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setSearchOpen(false)}
        />
      )}
    </header>
  );
}

export default Header;
