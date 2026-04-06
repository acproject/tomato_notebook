import { useState, useEffect } from 'react';
import { api, AppConfig } from '../api/client';

function SettingsPage() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<'ai' | 'miniMemory' | null>(null);
  const [testResult, setTestResult] = useState<{ ai?: boolean; miniMemory?: boolean }>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    const response = await api.getConfig();
    if (response.success && response.data) {
      setConfig(response.data);
    }
    setLoading(false);
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // AI配置更新
  const handleAIChange = (field: keyof AppConfig['ai'], value: string | number) => {
    if (!config) return;
    setConfig({
      ...config,
      ai: { ...config.ai, [field]: value },
    });
  };

  const saveAIConfig = async () => {
    if (!config) return;
    setSaving(true);
    const response = await api.updateAIConfig(config.ai);
    if (response.success) {
      showMessage('success', 'AI配置已保存');
    } else {
      showMessage('error', response.error || '保存失败');
    }
    setSaving(false);
  };

  // MiniMemory配置更新
  const handleMiniMemoryChange = (field: keyof AppConfig['miniMemory'], value: string | number | boolean) => {
    if (!config) return;
    setConfig({
      ...config,
      miniMemory: { ...config.miniMemory, [field]: value },
    });
  };

  const saveMiniMemoryConfig = async () => {
    if (!config) return;
    setSaving(true);
    const response = await api.updateMiniMemoryConfig(config.miniMemory);
    if (response.success) {
      showMessage('success', 'MiniMemory配置已保存');
    } else {
      showMessage('error', response.error || '保存失败');
    }
    setSaving(false);
  };

  // 服务器配置更新
  const handleServerChange = (field: keyof AppConfig['server'], value: string | number) => {
    if (!config) return;
    setConfig({
      ...config,
      server: { ...config.server, [field]: value },
    });
  };

  const saveServerConfig = async () => {
    if (!config) return;
    setSaving(true);
    const response = await api.updateServerConfig(config.server);
    if (response.success) {
      showMessage('success', '服务器配置已保存（需要重启服务生效）');
    } else {
      showMessage('error', response.error || '保存失败');
    }
    setSaving(false);
  };

  // 测试AI连接
  const testAI = async () => {
    setTesting('ai');
    const response = await api.testAIConnection();
    setTestResult(prev => ({ ...prev, ai: response.data?.connected }));
    if (response.success && response.data?.connected) {
      showMessage('success', `连接成功！可用模型: ${response.data.models?.join(', ')}`);
    } else {
      showMessage('error', '连接失败，请检查配置');
    }
    setTesting(null);
  };

  // 测试MiniMemory连接
  const testMiniMemory = async () => {
    setTesting('miniMemory');
    const response = await api.testMiniMemoryConnection();
    setTestResult(prev => ({ ...prev, miniMemory: response.data?.connected }));
    if (response.success && response.data?.connected) {
      showMessage('success', 'MiniMemory连接成功！');
    } else {
      showMessage('error', '连接失败，请检查配置');
    }
    setTesting(null);
  };

  // 重置配置
  const handleReset = async () => {
    if (!confirm('确定要重置所有配置吗？')) return;
    const response = await api.resetConfig();
    if (response.success && response.data) {
      setConfig(response.data);
      showMessage('success', '配置已重置');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">加载配置失败</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* 消息提示 */}
      {message && (
        <div
          className={`fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${
            message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white`}
        >
          {message.text}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">设置</h1>
        <p className="text-gray-500 mt-1">配置AI模型和存储服务</p>
      </div>

      {/* AI配置 */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AI 模型配置</h2>
            <p className="text-sm text-gray-500">配置Ollama本地LLM服务</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                testResult.ai === true ? 'bg-green-500' : testResult.ai === false ? 'bg-red-500' : 'bg-gray-300'
              }`}
            />
            <span className="text-sm text-gray-500">
              {testResult.ai === true ? '已连接' : testResult.ai === false ? '未连接' : '未测试'}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Base 地址</label>
            <input
              type="text"
              value={config.ai.apiBase}
              onChange={(e) => handleAIChange('apiBase', e.target.value)}
              placeholder="http://localhost"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">端口</label>
              <input
                type="number"
                value={config.ai.port}
                onChange={(e) => handleAIChange('port', parseInt(e.target.value) || 11434)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">模型</label>
              <input
                type="text"
                value={config.ai.model}
                onChange={(e) => handleAIChange('model', e.target.value)}
                placeholder="llama3"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
              <span className="text-gray-400 font-normal ml-1">(选填，用于OpenAI兼容API)</span>
            </label>
            <input
              type="password"
              value={config.ai.apiKey}
              onChange={(e) => handleAIChange('apiKey', e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={testAI}
              disabled={testing === 'ai'}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              {testing === 'ai' ? '测试中...' : '测试连接'}
            </button>
            <button
              onClick={saveAIConfig}
              disabled={saving}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>

      {/* MiniMemory配置 */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">MiniMemory 配置</h2>
            <p className="text-sm text-gray-500">KV存储和Embedding搜索服务（可选）</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                testResult.miniMemory === true
                  ? 'bg-green-500'
                  : testResult.miniMemory === false
                  ? 'bg-red-500'
                  : 'bg-gray-300'
              }`}
            />
            <span className="text-sm text-gray-500">
              {testResult.miniMemory === true
                ? '已连接'
                : testResult.miniMemory === false
                ? '未连接'
                : '未测试'}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="miniMemoryEnabled"
              checked={config.miniMemory.enabled}
              onChange={(e) => handleMiniMemoryChange('enabled', e.target.checked)}
              className="w-4 h-4 text-purple-500 rounded focus:ring-purple-500"
            />
            <label htmlFor="miniMemoryEnabled" className="text-sm text-gray-700">
              启用 MiniMemory 服务
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">主机地址</label>
              <input
                type="text"
                value={config.miniMemory.host}
                onChange={(e) => handleMiniMemoryChange('host', e.target.value)}
                placeholder="localhost"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={!config.miniMemory.enabled}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">端口</label>
              <input
                type="number"
                value={config.miniMemory.port}
                onChange={(e) => handleMiniMemoryChange('port', parseInt(e.target.value) || 6379)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={!config.miniMemory.enabled}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              密码
              <span className="text-gray-400 font-normal ml-1">(选填)</span>
            </label>
            <input
              type="password"
              value={config.miniMemory.password}
              onChange={(e) => handleMiniMemoryChange('password', e.target.value)}
              placeholder="******"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={!config.miniMemory.enabled}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={testMiniMemory}
              disabled={testing === 'miniMemory' || !config.miniMemory.enabled}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              {testing === 'miniMemory' ? '测试中...' : '测试连接'}
            </button>
            <button
              onClick={saveMiniMemoryConfig}
              disabled={saving}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>

      {/* 服务器配置 */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">服务器配置</h2>
          <p className="text-sm text-gray-500">API服务端口配置（需要重启生效）</p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">监听地址</label>
              <input
                type="text"
                value={config.server.host}
                onChange={(e) => handleServerChange('host', e.target.value)}
                placeholder="0.0.0.0"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">端口</label>
              <input
                type="number"
                value={config.server.port}
                onChange={(e) => handleServerChange('port', parseInt(e.target.value) || 3000)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <button
            onClick={saveServerConfig}
            disabled={saving}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {/* 重置配置 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">重置配置</h2>
            <p className="text-sm text-gray-500">恢复所有配置到默认值</p>
          </div>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            重置
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
