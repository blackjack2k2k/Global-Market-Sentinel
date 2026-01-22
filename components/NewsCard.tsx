import React from 'react';
import { MarketEvent, Severity } from '../types';

interface NewsCardProps {
  event: MarketEvent;
  isSelected: boolean;
  onClick: () => void;
}

export const NewsCard: React.FC<NewsCardProps> = ({ event, isSelected, onClick }) => {
  const getSeverityColor = (s: Severity) => {
    switch (s) {
      case Severity.HIGH: return 'border-l-rose-500';
      case Severity.MEDIUM: return 'border-l-amber-500';
      case Severity.LOW: return 'border-l-blue-500';
      default: return 'border-l-gray-500';
    }
  };

  const getSeverityBadge = (s: Severity) => {
    switch (s) {
      case Severity.HIGH: return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case Severity.MEDIUM: return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case Severity.LOW: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };
  
  const getSeverityText = (s: Severity) => {
    switch (s) {
      case Severity.HIGH: return '高度影响';
      case Severity.MEDIUM: return '中度影响';
      case Severity.LOW: return '低度影响';
      default: return '未知影响';
    }
  }

  return (
    <div 
      onClick={onClick}
      className={`group relative flex cursor-pointer flex-col gap-2 rounded-lg border p-4 transition-all hover:bg-gray-800/50 
        ${isSelected ? 'bg-gray-800 border-gray-700 shadow-md' : 'border-transparent bg-transparent hover:border-gray-800'}
        border-l-4 ${getSeverityColor(event.severity)}
      `}
    >
      <div className="flex items-center justify-between">
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getSeverityBadge(event.severity)}`}>
          {getSeverityText(event.severity)}
        </span>
        <span className="text-xs text-gray-500">{new Date(event.timestamp).toLocaleTimeString('zh-CN', {hour: '2-digit', minute:'2-digit'})}</span>
      </div>
      
      <h3 className="line-clamp-2 text-sm font-semibold text-gray-100 group-hover:text-white">
        {event.title}
      </h3>
      
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span>{event.region}</span>
        <span>•</span>
        <span>{event.affectedStocks.length} 个相关标的</span>
      </div>
    </div>
  );
};