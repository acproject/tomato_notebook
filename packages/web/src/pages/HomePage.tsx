import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotes, useCreateNote, useStats } from '../hooks/useNotes';
import { api, Note } from '../api/client';

function HomePage() {
  const { notes, loading, refetch } = useNotes();
  const { stats } = useStats();
  const { create: createNote } = useCreateNote();
  const navigate = useNavigate();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  const handleCreateNote = async () => {
    if (!newNoteTitle.trim()) return;
    
    const note = await createNote({
      title: newNoteTitle,
      content: newNoteContent,
    });
    
    if (note) {
      setShowCreateModal(false);
      setNewNoteTitle('');
      setNewNoteContent('');
      refetch();
      navigate(`/notes/${note.id}`);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    await api.toggleFavorite(noteId);
    refetch();
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">我的笔记</h1>
          <p className="text-sm text-gray-500 mt-1">共 {stats.totalNotes} 条笔记</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新建笔记
        </button>
      </div>

      {/* 功能卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-yellow-50 rounded-xl p-4">
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mb-3">
            <span className="text-xl">💡</span>
          </div>
          <h3 className="font-semibold text-gray-900">学习建议</h3>
          <p className="text-sm text-gray-500 mt-1">AI分析你的学习进度</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
            <span className="text-xl">📈</span>
          </div>
          <h3 className="font-semibold text-gray-900">进度追踪</h3>
          <p className="text-sm text-gray-500 mt-1">查看学习统计数据</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
            <span className="text-xl">📅</span>
          </div>
          <h3 className="font-semibold text-gray-900">学习计划</h3>
          <p className="text-sm text-gray-500 mt-1">制定学习目标</p>
        </div>
      </div>

      {/* 最近笔记 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">最近笔记</h2>
        
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="h-16 bg-gray-100 rounded"></div>
              </div>
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900">还没有笔记</h3>
            <p className="text-gray-500 mt-1">点击上方按钮创建你的第一条笔记</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => navigate(`/notes/${note.id}`)}
                onToggleFavorite={handleToggleFavorite}
                formatTime={formatTime}
              />
            ))}
          </div>
        )}
      </div>

      {/* 创建笔记弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">新建笔记</h2>
            <input
              type="text"
              placeholder="笔记标题"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <textarea
              placeholder="笔记内容..."
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleCreateNote}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 笔记卡片组件
interface NoteCardProps {
  note: Note;
  onClick: () => void;
  onToggleFavorite: (e: React.MouseEvent, noteId: string) => void;
  formatTime: (date: string) => string;
}

function NoteCard({ note, onClick, onToggleFavorite, formatTime }: NoteCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{note.isFavorite ? '⭐' : '📚'}</span>
          <h3 className="font-medium text-gray-900">{note.title}</h3>
        </div>
        {note.isAIGenerated && (
          <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded">
            AI生成
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 line-clamp-2 mb-3">
        {note.content || '暂无内容...'}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>{formatTime(note.updatedAt)}</span>
          {note.tags.length > 0 && (
            <span className="text-purple-500">#{note.tags[0]}</span>
          )}
        </div>
        <button
          onClick={(e) => onToggleFavorite(e, note.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-yellow-500"
        >
          {note.isFavorite ? '★' : '☆'}
        </button>
      </div>
    </div>
  );
}

export default HomePage;
