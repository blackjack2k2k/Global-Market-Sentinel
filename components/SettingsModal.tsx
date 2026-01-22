import React, { useState } from 'react';
import { UserSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (s: UserSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [formData, setFormData] = useState<UserSettings>(settings);

  if (!isOpen) return null;

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, keywords: val.split(',').map(s => s.trim()) }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 p-6 shadow-2xl">
        <h2 className="mb-6 text-xl font-bold text-white">监控偏好设置</h2>
        
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-400">提醒邮箱</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 p-2.5 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="investor@example.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-400">关注列表 / 关键词 (逗号分隔)</label>
            <input 
              type="text" 
              value={formData.keywords.join(', ')}
              onChange={handleKeywordChange}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 p-2.5 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="例如：半导体, 石油, 关税, 中国"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 p-4">
            <span className="text-sm font-medium text-gray-300">启用实时监控</span>
            <button 
              onClick={() => setFormData({...formData, isMonitoring: !formData.isMonitoring})}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.isMonitoring ? 'bg-emerald-500' : 'bg-gray-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isMonitoring ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            取消
          </button>
          <button 
            onClick={() => { onSave(formData); onClose(); }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            保存更改
          </button>
        </div>
      </div>
    </div>
  );
};