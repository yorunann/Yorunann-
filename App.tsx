

import React, { useReducer, useEffect, useRef, useState } from 'react';
import { GameState, ActionType, Player } from './types';
import { INITIAL_STATE } from './constants';
import { ScoreboardDisplay } from './components/ScoreboardDisplay';
import { ScoreboardControls } from './components/ScoreboardControls';
import { MonitorPlay, Maximize, Minimize, Keyboard, Settings, ExternalLink, RotateCcw, Gamepad2, BookOpen, Plus, Minus, Menu, X } from 'lucide-react';
import { useShortcuts, DEFAULT_SHORTCUTS, ShortcutMap } from './hooks/useShortcuts';
import { useGamepad } from './hooks/useGamepad';
import { ShortcutSettingsModal } from './components/ShortcutSettingsModal';
import { UserGuideModal } from './components/UserGuideModal';
import { SettingsModal } from './components/SettingsModal';

import { reducer } from './reducer';

const getInitialState = (init: GameState): GameState => {
  try {
    const savedState = localStorage.getItem('scoreboard_state');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      return {
        ...init,
        ...parsed,
        animation: null, // Clear any animation on start
      };
    }
  } catch (e) {
    console.error("Failed to load initial state from localStorage", e);
  }
  return init;
};

export const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE, getInitialState);
  const displayRef = useRef<HTMLDivElement>(null);

  const [isShortcutModalOpen, setIsShortcutModalOpen] = useState(false);
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(false);
  const [isUserGuideModalOpen, setIsUserGuideModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [shortcuts, setShortcuts] = useState<ShortcutMap>(DEFAULT_SHORTCUTS);
  const [language, setLanguage] = useState<'en' | 'zh' | 'ja'>('zh');
  const [history, setHistory] = useState<GameState[]>([]);
  const [controlPanelWidth, setControlPanelWidth] = useState(33.33); // percentage
  const [localDisplayMode, setLocalDisplayMode] = useState<GameState['displayMode'] | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPseudoFullscreen, setIsPseudoFullscreen] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);
  const isResizingRef = useRef(false);

  const [isDisplayMode, setIsDisplayMode] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('mode') === 'display';
  });

  const channelRef = useRef<BroadcastChannel | null>(null);
  const isLocalAction = useRef(false);
  const stateRef = useRef(state);
  const displayWindowsRef = useRef<Set<MessageEventSource>>(new Set());
  const displayWindowOpenedRef = useRef<Window | null>(null);

  // Keep stateRef updated for the REQUEST_STATE handler
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Initialize sync mechanisms
  useEffect(() => {
    const channel = new BroadcastChannel('scoreboard_sync');
    channelRef.current = channel;

    const handleSyncState = (newState: GameState, newLanguage?: "en" | "zh" | "ja") => {
      // Direct dispatch doesn't set isLocalAction, so it won't be re-broadcasted
      dispatch({ type: 'REPLACE_STATE', state: newState });
      if (newLanguage) setLanguage(newLanguage);
    };

    const handleRequestState = () => {
      if (!isDisplayMode) {
        const currentState = stateRef.current;
        channel.postMessage({ type: 'SYNC_STATE', state: currentState, language });
        localStorage.setItem('scoreboard_state', JSON.stringify(currentState));
        localStorage.setItem('scoreboard_sync_time', Date.now().toString());
      }
    };

    // 1. BroadcastChannel
    channel.onmessage = (event) => {
      if (event.data.type === 'SYNC_STATE') {
        handleSyncState(event.data.state, event.data.language);
      } else if (event.data.type === 'REQUEST_STATE') {
        handleRequestState();
      }
    };

    // 2. Window postMessage
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_STATE' && event.data.state) {
        handleSyncState(event.data.state, event.data.language);
      } else if (event.data?.type === 'REQUEST_STATE') {
        if (!isDisplayMode && event.source) {
          displayWindowsRef.current.add(event.source);
          try {
            (event.source as Window).postMessage({ type: 'SYNC_STATE', state: stateRef.current, language }, '*');
          } catch (e) {
            console.error("Failed to send state to requesting window", e);
          }
        }
      }
    };
    window.addEventListener('message', handleMessage);

    // 3. LocalStorage
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'scoreboard_state' && event.newValue) {
        try {
          const newState = JSON.parse(event.newValue);
          handleSyncState(newState);
        } catch (e) {
          console.error("Failed to parse state from localStorage", e);
        }
      } else if (event.key === 'scoreboard_request_state' && !isDisplayMode) {
        localStorage.setItem('scoreboard_state', JSON.stringify(stateRef.current));
      }
    };
    window.addEventListener('storage', handleStorage);

    // Request initial state or broadcast current state
    if (isDisplayMode) {
      channel.postMessage({ type: 'REQUEST_STATE' });
      if (window.opener) {
        window.opener.postMessage({ type: 'REQUEST_STATE' }, '*');
      }
      localStorage.setItem('scoreboard_request_state', Date.now().toString());
    } else {
      // Controller broadcasts its state on mount to sync any existing display windows
      channel.postMessage({ type: 'SYNC_STATE', state: stateRef.current, language });
    }

    // Fallback: read from localStorage immediately
    const savedState = localStorage.getItem('scoreboard_state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        parsed.animation = null;
        handleSyncState(parsed);
      } catch (e) {}
    }

    return () => {
      channel.close();
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
    };
  }, [isDisplayMode]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const percentage = (1 - e.clientX / window.innerWidth) * 100;
      setControlPanelWidth(Math.min(Math.max(percentage, 20), 80));
    };
    const handleMouseUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = 'default';
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Sync state whenever it changes locally
  useEffect(() => {
    if (!isLocalAction.current) {
      return;
    }
    isLocalAction.current = false;
    
    // 1. BroadcastChannel
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'SYNC_STATE', state, language });
    }
    
    // 2. LocalStorage
    localStorage.setItem('scoreboard_state', JSON.stringify(state));
    
    // 3. postMessage
    if (isDisplayMode) {
      if (window.opener) {
        window.opener.postMessage({ type: 'SYNC_STATE', state, language }, '*');
      }
    } else {
      if (displayWindowOpenedRef.current) {
        try {
          displayWindowOpenedRef.current.postMessage({ type: 'SYNC_STATE', state, language }, '*');
        } catch (e) {
          // Window might be closed
        }
      }
      displayWindowsRef.current.forEach(win => {
        try {
          (win as Window).postMessage({ type: 'SYNC_STATE', state, language }, '*');
        } catch (e) {
          displayWindowsRef.current.delete(win);
        }
      });
    }
  }, [state, isDisplayMode]);

  const handleDispatch = (action: ActionType) => {
    if (action.type === 'UNDO') {
      if (history.length > 0) {
        const previousState = history[history.length - 1];
        setHistory(prev => prev.slice(0, -1));
        isLocalAction.current = true;
        dispatch({ type: 'REPLACE_STATE', state: previousState });
      }
      return;
    }

    // Save history for relevant actions
    const ignoredActions = ['DECREMENT_TIMER', 'SET_TIMER', 'TOGGLE_TIMER', 'SET_ANIMATION', 'REPLACE_STATE'];
    if (!ignoredActions.includes(action.type)) {
      setHistory(prev => [...prev.slice(-49), state]);
    }

    isLocalAction.current = true;
    dispatch(action);
  };

  // Shortcuts are always enabled now
  useShortcuts(true, shortcuts, handleDispatch, state);
  
  const handleConfirmReset = () => {
    handleDispatch({ type: 'RESET_GAME' });
    setIsResetConfirmOpen(false);
  };

  const handleCancelReset = () => {
    setIsResetConfirmOpen(false);
  };

  const isGamepadConnected = useGamepad(
    true, 
    handleDispatch, 
    state, 
    () => setIsResetConfirmOpen(true),
    isResetConfirmOpen,
    handleConfirmReset,
    handleCancelReset
  );

  // Timer Effect
  useEffect(() => {
    if (isDisplayMode) return; // Only the controller ticks the timer
    let interval: ReturnType<typeof setInterval>;
    if (state.isTimerRunning && state.timer > 0) {
      interval = setInterval(() => {
        handleDispatch({ type: 'DECREMENT_TIMER' });
      }, 1000);
    } else if (state.timer === 0 && state.isTimerRunning) {
      handleDispatch({ type: 'TOGGLE_TIMER' }); // Stop when reached 0
    }
    return () => clearInterval(interval);
  }, [state.isTimerRunning, state.timer, isDisplayMode]);

  // Sync document title for SEO and browser tab
  useEffect(() => {
    document.title = '棒球電子計分板';
  }, []);

  const getFullscreenElement = () => {
    return (
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement ||
      null
    );
  };

  const toggleFullscreen = async () => {
    // If currently in pseudo-fullscreen, exit it
    if (isPseudoFullscreen) {
      setIsPseudoFullscreen(false);
      setIsFullscreen(false);
      return;
    }

    // If currently in native fullscreen, exit it
    if (getFullscreenElement()) {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      } catch (e) {
        console.warn('Exit native fullscreen error:', e);
      }
      setIsFullscreen(false);
      return;
    }

    // Try native fullscreen first
    const target = displayRef.current || document.documentElement;
    let nativeSuccess = false;

    try {
      if (target && target.requestFullscreen) {
        await target.requestFullscreen();
        nativeSuccess = true;
      } else if (target && (target as any).webkitRequestFullscreen) {
        await (target as any).webkitRequestFullscreen();
        nativeSuccess = true;
      } else if (target && (target as any).webkitRequestFullScreen) {
        await (target as any).webkitRequestFullScreen();
        nativeSuccess = true;
      } else if (target && (target as any).mozRequestFullScreen) {
        await (target as any).mozRequestFullScreen();
        nativeSuccess = true;
      } else if (target && (target as any).msRequestFullscreen) {
        await (target as any).msRequestFullscreen();
        nativeSuccess = true;
      }
    } catch (err) {
      console.warn('Native fullscreen not available or failed:', err);
      nativeSuccess = false;
    }

    if (nativeSuccess) {
      setIsFullscreen(true);
    } else {
      // Native fullscreen not supported (e.g. iPhone Safari) -> Seamless CSS Immersive Fullscreen
      setIsPseudoFullscreen(true);
      setIsFullscreen(true);

      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      if (isIos && !sessionStorage.getItem('ios_fullscreen_tip_dismissed')) {
        setShowIosTip(true);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNative = !!getFullscreenElement();
      if (!isNative && !isPseudoFullscreen) {
        setIsFullscreen(false);
      } else if (isNative) {
        setIsFullscreen(true);
        setIsPseudoFullscreen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPseudoFullscreen) {
        setIsPseudoFullscreen(false);
        setIsFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPseudoFullscreen]);

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col font-sans overflow-hidden">
      {/* Navigation Header */}
      {!isDisplayMode && (
        <header className="bg-slate-800 border-b border-slate-700 p-3 flex justify-between items-center z-50 shrink-0">
          <div className="flex items-center space-x-2">
            <div 
              className="flex items-center space-x-2 cursor-pointer select-none"
              onDoubleClick={toggleFullscreen}
              title="Double click to toggle fullscreen"
            >
              <MonitorPlay className="text-yellow-400" />
              <h1 className="text-white font-bold text-xl hidden md:block">Pro Baseball Scoreboard</h1>
              <h1 className="text-white font-bold text-xl md:hidden">PBS</h1>
            </div>
            <select 
              value={language}
              onChange={(e) => {
                const newLang = e.target.value as 'en' | 'zh' | 'ja';
                setLanguage(newLang);
                if (channelRef.current) channelRef.current.postMessage({ type: 'SYNC_STATE', state, language: newLang });
                if (displayWindowOpenedRef.current) displayWindowOpenedRef.current.postMessage({ type: 'SYNC_STATE', state, language: newLang }, '*');
              }}
              className="ml-2 px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded transition-colors outline-none cursor-pointer border-none"
            >
              <option value="zh">繁體中文</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-lg">
            <button
              onClick={() => setIsToolbarExpanded(!isToolbarExpanded)}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors flex items-center justify-center"
              title="Expand Toolbar"
            >
              <Menu size={18} />
            </button>
            <div className="w-px h-6 bg-slate-700 mx-1"></div>
            <button
              onClick={() => {
                const win = window.open('/?mode=display', '_blank');
                if (win) displayWindowOpenedRef.current = win;
              }}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors flex items-center space-x-1"
              title="Open Display Window"
            >
              <ExternalLink size={18} />
              {isToolbarExpanded && <span className="text-xs font-medium ml-1">Project</span>}
            </button>
            <div className="w-px h-6 bg-slate-700 mx-1"></div>
            <div 
              className={`hidden sm:flex p-1.5 rounded-md items-center space-x-1 transition-colors ${
                isGamepadConnected 
                  ? 'bg-green-600 text-white' 
                  : 'text-slate-500'
              }`}
              title={isGamepadConnected ? "Gamepad Connected" : "Gamepad Disconnected"}
            >
              <Gamepad2 size={18} />
              {isToolbarExpanded && <span className="text-xs font-medium ml-1">Gamepad</span>}
            </div>
            <button
              onClick={() => setIsUserGuideModalOpen(true)}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors flex items-center space-x-1"
              title="User Guide"
            >
              <BookOpen size={18} />
              {isToolbarExpanded && <span className="text-xs font-medium ml-1">Guide</span>}
            </button>
            <button
              onClick={() => setIsShortcutModalOpen(true)}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors flex items-center space-x-1"
              title="Shortcut Settings"
            >
              <Keyboard size={18} />
              {isToolbarExpanded && <span className="text-xs font-medium ml-1">Shortcuts</span>}
            </button>
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="p-1.5 rounded-md text-red-400 hover:text-white hover:bg-red-900/50 transition-colors"
              title="Reset Game"
            >
              <RotateCcw size={18} />
            </button>
            <div className="w-px h-6 bg-slate-700 mx-1"></div>
            <button 
              onClick={toggleFullscreen}
              className={`p-1.5 rounded-md transition-colors ${
                isFullscreen || isPseudoFullscreen 
                  ? 'text-yellow-400 bg-slate-700 hover:text-white' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
              title={
                isFullscreen || isPseudoFullscreen
                  ? (language === 'zh' ? '退出全螢幕' : language === 'en' ? 'Exit Fullscreen' : '全画面終了')
                  : (language === 'zh' ? '全螢幕' : language === 'en' ? 'Fullscreen' : '全画面')
              }
            >
              {isFullscreen || isPseudoFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
            <div className="w-px h-6 bg-slate-700 mx-1"></div>
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors flex items-center space-x-1"
              title={language === 'zh' ? '設定' : language === 'en' ? 'Settings' : '設定'}
            >
              <Settings size={18} />
              {isToolbarExpanded && <span className="text-xs font-medium ml-1">{language === 'zh' ? '設定' : language === 'en' ? 'Settings' : '設定'}</span>}
            </button>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative flex">
        {/* Split Screen Layout */}
        <div className="w-full h-full flex flex-row gap-0 overflow-hidden">
          {/* Left/Top: Display */}
          <div 
            className={`flex-none p-4 bg-slate-950 flex flex-col items-center justify-center overflow-y-auto overscroll-contain overflow-x-hidden border-r border-slate-700 relative w-[var(--left-width)]`}
            style={{ 
              '--left-width': isDisplayMode ? '100%' : `calc(${100 - controlPanelWidth}% - 4px)`,
              ...(isDisplayMode ? { zoom: '150%' } : {})
            } as React.CSSProperties}
          >
              
              {isDisplayMode && (
                <div className="absolute top-4 left-4 flex gap-2 z-50 opacity-30 hover:opacity-100 transition-opacity">
                  <div className="bg-slate-800/80 rounded-md p-1 flex">
                    {(['default', 'lineup', 'rhe', 'broadcast'] as const).map(mode => {
                      const isActive = (localDisplayMode || state.displayMode) === mode;
                      return (
                        <button
                          key={mode}
                          onClick={() => setLocalDisplayMode(mode)}
                          className={`px-3 py-1 text-xs font-medium rounded capitalize transition-colors ${
                            isActive 
                              ? 'bg-blue-600 text-white' 
                              : 'text-slate-400 hover:text-white hover:bg-slate-700'
                          }`}
                        >
                          {mode}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {isDisplayMode && (
                <button 
                  onClick={toggleFullscreen}
                  className="absolute top-4 right-4 p-2 bg-slate-800/60 hover:bg-slate-700/80 text-white rounded-md transition-colors z-50 opacity-40 hover:opacity-100 shadow-lg backdrop-blur-xs"
                  title={
                    isFullscreen || isPseudoFullscreen
                      ? (language === 'zh' ? '退出全螢幕' : language === 'en' ? 'Exit Fullscreen' : '全画面終了')
                      : (language === 'zh' ? '全螢幕' : language === 'en' ? 'Fullscreen' : '全画面')
                  }
                >
                  {isFullscreen || isPseudoFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
                </button>
              )}

              <div className="w-full max-w-full aspect-video flex items-center justify-center">
                <div className="w-full transform scale-90 xl:scale-100 origin-center h-full">
                  <ScoreboardDisplay ref={displayRef} state={localDisplayMode ? { ...state, displayMode: localDisplayMode } : state} dispatch={handleDispatch} language={language} />
                </div>
              </div>
          </div>
          
          {/* Resize Handle */}
          {!isDisplayMode && (
            <div 
              className="flex w-1 bg-slate-700 hover:bg-blue-500 cursor-col-resize transition-colors z-50 items-center justify-center shrink-0"
              onMouseDown={(e) => {
                e.preventDefault();
                isResizingRef.current = true;
                document.body.style.cursor = 'col-resize';
              }}
            >
              <div className="w-px h-8 bg-slate-500/50"></div>
            </div>
          )}

          {/* Right/Bottom: Controls */}
          {!isDisplayMode && (
            <div 
              className="flex-1 bg-gray-100 overflow-y-auto overscroll-contain shadow-inner"
              style={{ flexBasis: `${controlPanelWidth}%` }}
            >
                <ScoreboardControls state={state} dispatch={handleDispatch} language={language} />
            </div>
          )}
        </div>
      </main>

       {/* Footer */}
       <footer className="bg-slate-900 text-slate-500 text-[10px] text-center p-1 border-t border-slate-800 flex flex-col sm:flex-row justify-center items-center gap-1 z-50 relative">
          <span>Made by Yorunann</span>
          <span className="text-slate-600 ml-2">v26.9.23.0</span>
       </footer>

        <ShortcutSettingsModal
          isOpen={isShortcutModalOpen}
          onClose={() => setIsShortcutModalOpen(false)}
          shortcuts={shortcuts}
          onSave={setShortcuts}
          language={language}
        />

        <UserGuideModal
          isOpen={isUserGuideModalOpen}
          onClose={() => setIsUserGuideModalOpen(false)}
          language={language}
        />

        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          language={language}
        />

        {/* Pseudo Fullscreen Immersive Mode for iPhone / unsupported browsers */}
        {isPseudoFullscreen && (
          <div className="fixed inset-0 z-[150] bg-slate-950 flex flex-col items-center justify-center overflow-hidden p-2 select-none touch-manipulation">
            {/* Floating Top Bar with Mode Switcher & Exit Button */}
            <div className="absolute top-3 right-3 flex items-center gap-2 z-50">
              <div className="bg-slate-800/85 backdrop-blur-md rounded-lg p-1 flex border border-slate-700 shadow-xl">
                {(['default', 'lineup', 'rhe', 'broadcast'] as const).map(mode => {
                  const isActive = (localDisplayMode || state.displayMode) === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => setLocalDisplayMode(mode)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded capitalize transition-colors ${
                        isActive 
                          ? 'bg-blue-600 text-white' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                      }`}
                    >
                      {mode}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-white rounded-lg shadow-xl backdrop-blur-md border border-slate-600 transition-all text-xs font-bold"
                title={language === 'zh' ? '退出全螢幕' : language === 'en' ? 'Exit Fullscreen' : '全画面終了'}
              >
                <Minimize size={16} className="text-yellow-400" />
                <span>{language === 'zh' ? '退出全螢幕' : language === 'en' ? 'Exit' : '終了'}</span>
              </button>
            </div>

            {/* iOS Tip Banner */}
            {showIosTip && (
              <div className="absolute bottom-4 left-4 right-4 max-w-lg mx-auto bg-slate-900/95 border border-yellow-500/50 text-slate-200 text-xs p-3.5 rounded-xl shadow-2xl z-50 flex items-start gap-3 backdrop-blur-md animate-in fade-in slide-in-from-bottom-3">
                <span className="text-lg shrink-0">💡</span>
                <div className="flex-1 leading-relaxed">
                  <div className="font-bold text-yellow-300 mb-1">
                    {language === 'zh' ? 'iPhone 全螢幕說明' : language === 'en' ? 'iPhone Fullscreen Tip' : 'iPhone 全画面ヒント'}
                  </div>
                  {language === 'zh' ? (
                    <span>
                      已為您開啟全版沈浸模式！若想要<strong>完全隱藏 Safari 網址列與底欄</strong>，可點擊 Safari 底部「<strong>分享</strong>」按鈕 ➔ 選擇「<strong>加入主畫面</strong>」，即可像原生 App 一樣以 100% 完整無邊框全螢幕開啟！
                    </span>
                  ) : (
                    <span>
                      Immersive mode active! Due to iOS limitations, to completely hide Safari's address and bottom bars, tap <strong>Share</strong> ➔ <strong>Add to Home Screen</strong> for a 100% borderless app!
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowIosTip(false);
                    sessionStorage.setItem('ios_fullscreen_tip_dismissed', '1');
                  }}
                  className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 shrink-0"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {/* Scoreboard display */}
            <div className="w-full h-full max-w-full aspect-video flex items-center justify-center">
              <div className="w-full transform scale-95 md:scale-100 origin-center h-full">
                <ScoreboardDisplay 
                  state={localDisplayMode ? { ...state, displayMode: localDisplayMode } : state} 
                  dispatch={handleDispatch} 
                  language={language} 
                />
              </div>
            </div>
          </div>
        )}

        {/* Reset Confirmation Modal */}
        {isResetConfirmOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[200] p-4 backdrop-blur-sm">
            <div className="bg-slate-800 border-2 border-red-500/50 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RotateCcw size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {language === 'en' ? 'Reset Game' : language === 'zh' ? '重置比賽' : '試合をリセット'}
                </h3>
                <p className="text-slate-400 mb-6">
                  {language === 'en' 
                    ? 'Are you sure you want to reset the game? This will clear all scores, counts, and innings, but keep the current team names and lineups. This action cannot be undone.' 
                    : language === 'zh'
                    ? '確定要重置比賽嗎？這將會清除所有比分、好壞球與局數，但會保留當前的隊伍名稱與打線。此操作無法復原。'
                    : '試合をリセットしてもよろしいですか？ すべてのスコア、カウント、イニングはクリアされますが、現在のチーム名とラインナップは保持されます。この操作は元に戻せません。'}
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setIsResetConfirmOpen(false)}
                    className="flex-1 px-4 py-3 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-colors"
                  >
                    {language === 'en' ? 'Cancel' : language === 'zh' ? '取消' : 'キャンセル'}
                  </button>
                  <button
                    onClick={handleConfirmReset}
                    className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500 transition-colors shadow-lg shadow-red-900/20"
                  >
                    {language === 'en' ? 'Reset All' : language === 'zh' ? '確認重置' : 'リセット'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};