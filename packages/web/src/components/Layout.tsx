import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import AIAssistantPanel from './AIAssistantPanel';

function Layout() {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <Header />
      
      {/* 主体区域 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧边栏 */}
        <Sidebar />
        
        {/* 主内容区 */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
        
        {/* 右侧AI助手面板 */}
        <AIAssistantPanel />
      </div>
      
      {/* 底部状态栏 */}
      <footer className="h-8 bg-gray-100 border-t border-gray-200 flex items-center justify-between px-4 text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            已同步
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
              <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
              <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
            </svg>
            云存储
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>AI使用: 24/100</span>
          <span>今日学习: 3.2h</span>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
