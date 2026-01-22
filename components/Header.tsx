import React from 'react';

interface HeaderProps {
  onOpenSettings: () => void;
  isMonitoring: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, isMonitoring }) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white shadow-lg shadow-blue-500/20">
            S
            {isMonitoring && (
              <span className="absolute -right-1 -top-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
              </span>
            )}
          </div>
          <span className="text-lg font-bold tracking-tight text-white">全球市场哨兵</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-xs font-medium text-gray-400">
            <span className={`h-2 w-2 rounded-full ${isMonitoring ? 'bg-emerald-500' : 'bg-gray-600'}`}></span>
            {isMonitoring ? '系统运行中' : '系统暂停'}
          </div>
          <button 
            onClick={onOpenSettings}
            className="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors border border-gray-700"
          >
            设置与提醒
          </button>
        </div>
      </div>
    </header>
  );
};