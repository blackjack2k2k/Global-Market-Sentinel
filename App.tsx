import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { NewsCard } from './components/NewsCard';
import { StockImpactList } from './components/StockImpactList';
import { SettingsModal } from './components/SettingsModal';
import { MarketEvent, UserSettings, ViewMode } from './types';
import { fetchMarketIntelligence, fetchGlobalTrends, generateEmailContent } from './services/geminiService';

const DEFAULT_SETTINGS: UserSettings = {
  email: '',
  frequency: 'realtime',
  regions: ['Global'],
  keywords: ['科技', '能源', '地缘政治'],
  isMonitoring: false,
};

function App() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Data State
  const [events, setEvents] = useState<MarketEvent[]>([]); // News Items
  const [trends, setTrends] = useState<MarketEvent[]>([]); // Trend Items
  
  const [viewMode, setViewMode] = useState<ViewMode>('news');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Derive current list based on view mode
  const currentList = viewMode === 'news' ? events : trends;
  const selectedEvent = currentList.find(e => e.id === selectedEventId) || null;

  // Simulate or Perform Fetch
  const refreshData = useCallback(async (forceMode?: ViewMode) => {
    const modeToFetch = forceMode || viewMode;
    setIsLoading(true);
    try {
      if (modeToFetch === 'news') {
        const data = await fetchMarketIntelligence(settings.keywords);
        setEvents(data);
        if (data.length > 0 && !selectedEventId) {
            // Only auto-select if we are in this mode
            if (viewMode === 'news') setSelectedEventId(data[0].id);
        }
      } else {
        const data = await fetchGlobalTrends();
        setTrends(data);
        if (data.length > 0 && !selectedEventId) {
             // Only auto-select if we are in this mode
             if (viewMode === 'trends') setSelectedEventId(data[0].id);
        }
      }
    } catch (error) {
      console.error(error);
      setNotification({ message: '获取数据失败，请检查 API Key', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [settings.keywords, selectedEventId, viewMode]);

  // Initial Load & Monitoring Interval
  useEffect(() => {
    // Initial fetch if empty
    if (viewMode === 'news' && events.length === 0) refreshData('news');
    if (viewMode === 'trends' && trends.length === 0) refreshData('trends');

    if (settings.isMonitoring && viewMode === 'news') {
      const interval = setInterval(() => {
        refreshData('news');
      }, 60000 * 5); // Poll every 5 minutes if active
      return () => clearInterval(interval);
    }
  }, [settings.isMonitoring, refreshData, viewMode, events.length, trends.length]);

  const handleSimulateEmail = async () => {
    if (!selectedEvent) return;
    if (!settings.email) {
      setIsSettingsOpen(true);
      return;
    }

    setIsSendingEmail(true);
    try {
      const emailHtml = await generateEmailContent(selectedEvent, settings.email);
      console.log('--- EMAIL CONTENT SIMULATION ---');
      console.log(emailHtml);
      console.log('--------------------------------');
      
      // Open a "Mailto" simulation or just alert
      setTimeout(() => {
        setNotification({ 
          message: `已为 ${settings.email} 生成提醒邮件！(请查看控制台)`, 
          type: 'success' 
        });
        setIsSendingEmail(false);
      }, 1500);

    } catch (error) {
      setNotification({ message: '生成邮件内容失败', type: 'error' });
      setIsSendingEmail(false);
    }
  };

  // Auto-dismiss notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <div className="flex h-screen w-full flex-col bg-gray-950 text-gray-200 font-sans">
      <Header 
        onOpenSettings={() => setIsSettingsOpen(true)} 
        isMonitoring={settings.isMonitoring} 
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: News Feed */}
        <aside className="w-full border-r border-gray-800 bg-gray-900/50 md:w-[350px] lg:w-[400px] flex flex-col">
          {/* Tab Switcher */}
          <div className="flex border-b border-gray-800">
             <button 
               onClick={() => { setViewMode('news'); setSelectedEventId(null); }}
               className={`flex-1 py-3 text-sm font-medium transition-colors ${viewMode === 'news' ? 'bg-gray-800 text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-200'}`}
             >
               实时快讯
             </button>
             <button 
               onClick={() => { setViewMode('trends'); setSelectedEventId(null); }}
               className={`flex-1 py-3 text-sm font-medium transition-colors ${viewMode === 'trends' ? 'bg-gray-800 text-white border-b-2 border-emerald-500' : 'text-gray-400 hover:text-gray-200'}`}
             >
               十大趋势
             </button>
          </div>

          <div className="flex items-center justify-between border-b border-gray-800 p-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                {viewMode === 'news' ? '最新市场动态' : '全球关键趋势 (Top 10)'}
            </h2>
            <button 
              onClick={() => refreshData()} 
              disabled={isLoading}
              className="rounded p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            >
              <svg className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
            {isLoading && currentList.length === 0 ? (
              <div className="space-y-3 p-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-800/50"></div>
                ))}
              </div>
            ) : currentList.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                {viewMode === 'news' 
                    ? (settings.isMonitoring ? '正在扫描全球网络...' : '监控已暂停。请在设置中开启或手动刷新。')
                    : '点击刷新按钮获取全球十大趋势。'}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {currentList.map(event => (
                  <NewsCard 
                    key={event.id}
                    event={event}
                    isSelected={selectedEventId === event.id}
                    onClick={() => setSelectedEventId(event.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Main Content: Impact Details */}
        <main className="flex-1 relative">
           <StockImpactList 
             event={selectedEvent} 
             onSimulateEmail={handleSimulateEmail}
             isSendingEmail={isSendingEmail}
           />
        </main>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={setSettings}
      />

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed bottom-4 right-4 z-50 rounded-lg px-6 py-3 shadow-xl backdrop-blur-md transition-all animate-bounce
          ${notification.type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-rose-500/90 text-white'}
        `}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;