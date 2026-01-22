import React from 'react';
import { MarketEvent, ImpactType } from '../types';

interface StockImpactListProps {
  event: MarketEvent | null;
  onSimulateEmail: () => void;
  isSendingEmail: boolean;
}

export const StockImpactList: React.FC<StockImpactListProps> = ({ event, onSimulateEmail, isSendingEmail }) => {
  if (!event) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="mb-4 h-12 w-12 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
        <p>请选择一个事件以查看详细影响分析。</p>
      </div>
    );
  }

  const getImpactLabel = (impact: ImpactType) => {
      switch (impact) {
          case ImpactType.BULLISH: return '利好';
          case ImpactType.BEARISH: return '利空';
          case ImpactType.NEUTRAL: return '中性';
          case ImpactType.VOLATILE: return '波动';
          default: return impact;
      }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gray-900">
      {/* Detail Header */}
      <div className="border-b border-gray-800 p-6">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-2xl font-bold leading-tight text-white">{event.title}</h2>
          <button
            onClick={onSimulateEmail}
            disabled={isSendingEmail}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all
              ${isSendingEmail 
                ? 'cursor-wait bg-gray-700 text-gray-400' 
                : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500'}`}
          >
            {isSendingEmail ? (
              <>
                <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                处理中
              </>
            ) : (
              <>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                邮件提醒
              </>
            )}
          </button>
        </div>
        
        <p className="mb-4 text-base leading-relaxed text-gray-300">{event.summary}</p>
        
        {event.sources.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {event.sources.map((src, idx) => (
              <a 
                key={idx} 
                href={src.uri} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded bg-gray-800 px-2 py-1 text-xs text-gray-400 hover:text-white hover:underline"
              >
                🔗 {src.title}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Ticker List */}
      <div className="flex-1 overflow-y-auto p-6">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">预计市场影响</h3>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {event.affectedStocks.map((stock) => (
            <div key={stock.symbol} className="flex flex-col gap-3 rounded-lg border border-gray-800 bg-gray-800/30 p-4 transition-colors hover:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg font-bold text-white shadow-inner
                    ${stock.impact === ImpactType.BULLISH ? 'bg-emerald-500/20 text-emerald-400' : ''}
                    ${stock.impact === ImpactType.BEARISH ? 'bg-rose-500/20 text-rose-400' : ''}
                    ${stock.impact === ImpactType.NEUTRAL ? 'bg-gray-600/20 text-gray-400' : ''}
                  `}>
                    {stock.symbol}
                  </div>
                  <div>
                    <div className="font-bold text-gray-200">{stock.symbol}</div>
                    <div className="text-xs text-gray-500">{stock.name}</div>
                  </div>
                </div>
                <span className={`rounded px-2 py-1 text-xs font-bold 
                  ${stock.impact === ImpactType.BULLISH ? 'bg-emerald-500/10 text-emerald-500' : ''}
                  ${stock.impact === ImpactType.BEARISH ? 'bg-rose-500/10 text-rose-500' : ''}
                  ${stock.impact === ImpactType.NEUTRAL ? 'bg-gray-600/10 text-gray-500' : ''}
                `}>
                  {getImpactLabel(stock.impact)}
                </span>
              </div>
              
              <p className="text-sm leading-relaxed text-gray-400">
                {stock.reasoning}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};