

import React, { useReducer, useEffect, useRef, useState } from 'react';
import { GameState, ActionType, Player } from './types';
import { INITIAL_STATE } from './constants';
import { ScoreboardDisplay } from './components/ScoreboardDisplay';
import { ScoreboardControls } from './components/ScoreboardControls';
import { MonitorPlay, Maximize, Keyboard, Settings, ExternalLink, RotateCcw, Gamepad2, BookOpen, Plus, Minus } from 'lucide-react';
import { useShortcuts, DEFAULT_SHORTCUTS, ShortcutMap } from './hooks/useShortcuts';
import { useGamepad } from './hooks/useGamepad';
import { ShortcutSettingsModal } from './components/ShortcutSettingsModal';
import { UserGuideModal } from './components/UserGuideModal';

import { reducer } from './reducer';

export const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const displayRef = useRef<HTMLDivElement>(null);

  const [isShortcutModeEnabled, setIsShortcutModeEnabled] = useState(false);
  const [isShortcutModalOpen, setIsShortcutModalOpen] = useState(false);
  const [isUserGuideModalOpen, setIsUserGuideModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [shortcuts, setShortcuts] = useState<ShortcutMap>(DEFAULT_SHORTCUTS);
  const [language, setLanguage] = useState<'en' | 'zh' | 'ja'>('zh');
  const [history, setHistory] = useState<GameState[]>([]);
  const [controlPanelWidth, setControlPanelWidth] = useState(33.33); // percentage
  const [localDisplayMode, setLocalDisplayMode] = useState<GameState['displayMode'] | null>(null);
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
        handleSyncState(JSON.parse(savedState));
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

  // In display mode, shortcuts are always enabled so it can be controlled standalone
  useShortcuts(isDisplayMode || isShortcutModeEnabled, shortcuts, handleDispatch, state);
  
  const handleConfirmReset = () => {
    handleDispatch({ type: 'RESET_GAME' });
    setIsResetConfirmOpen(false);
  };

  const handleCancelReset = () => {
    setIsResetConfirmOpen(false);
  };

  const isGamepadConnected = useGamepad(
    isDisplayMode || isShortcutModeEnabled, 
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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
       // Request fullscreen on the display element if it exists, otherwise fallback to root
       if (displayRef.current) {
          displayRef.current.requestFullscreen().catch(err => {
             console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
          });
       } else {
          document.documentElement.requestFullscreen();
       }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col font-sans overflow-hidden">
      {/* Navigation Header */}
      {!isDisplayMode && (
        <header className="bg-slate-800 border-b border-slate-700 p-3 flex justify-between items-center z-50 shrink-0">
          <div className="flex items-center space-x-2">
            <MonitorPlay className="text-yellow-400" />
            <h1 className="text-white font-bold text-xl hidden md:block">Pro Baseball Scoreboard</h1>
            <h1 className="text-white font-bold text-xl md:hidden">PBS</h1>
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
              onClick={() => {
                const win = window.open('/?mode=display', '_blank');
                if (win) displayWindowOpenedRef.current = win;
              }}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors flex items-center space-x-1"
              title="Open Display Window"
            >
              <ExternalLink size={18} />
              <span className="text-xs font-medium hidden sm:inline">Project</span>
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
              <span className="text-xs font-medium hidden sm:inline">Gamepad</span>
            </div>
            <button
              onClick={() => setIsUserGuideModalOpen(true)}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors flex items-center space-x-1"
              title="User Guide"
            >
              <BookOpen size={18} />
              <span className="text-xs font-medium hidden sm:inline">Guide</span>
            </button>
            <button
              onClick={() => setIsShortcutModeEnabled(!isShortcutModeEnabled)}
              className={`p-1.5 rounded-md transition-colors flex items-center space-x-1 ${
                isShortcutModeEnabled 
                  ? 'bg-blue-600 text-white hover:bg-blue-500' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
              title="Toggle Shortcut Mode"
            >
              <Keyboard size={18} />
              <span className="text-xs font-medium hidden sm:inline">Shortcuts</span>
            </button>
            <button
              onClick={() => setIsShortcutModalOpen(true)}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              title="Shortcut Settings"
            >
              <Settings size={18} />
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
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              title="Toggle Display Fullscreen"
            >
              <Maximize size={18} />
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
                  className="absolute top-4 right-4 p-2 bg-slate-800/50 hover:bg-slate-700/80 text-white rounded-md transition-colors z-50 opacity-30 hover:opacity-100"
                  title="Toggle Fullscreen"
                >
                  <Maximize size={24} />
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
          <span className="text-slate-600 ml-2">v26.8.18.1</span>
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