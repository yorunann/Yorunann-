import React, { useState } from 'react';
import { GameState, ActionType } from '../types';
import { getPitcherCount } from '../reducer';
import { ConnectionStatus } from '../hooks/usePeerSync';
import {
  Smartphone,
  Wifi,
  WifiOff,
  Tv,
  AlertCircle,
  Radio,
} from 'lucide-react';
import { ScoreboardControls } from './ScoreboardControls';
import { ScoreboardControlsV2 } from './ScoreboardControlsV2';

interface MobileRemoteViewProps {
  state: GameState;
  dispatch: (action: ActionType) => void;
  language: 'en' | 'zh' | 'ja';
  connectionStatus: ConnectionStatus;
  latency: number | null;
  errorMessage: string | null;
  roomCode: string;
  onChangeRoomCode: (newCode: string) => void;
  onReconnect: () => void;
  useBetaControls: boolean;
  onExitRemoteMode: () => void;
  onOpenRecordModal: () => void;
  onToggleProjectMode: () => void;
  onOpenObsModal?: () => void;
}

export const MobileRemoteView: React.FC<MobileRemoteViewProps> = ({
  state,
  dispatch,
  language,
  connectionStatus,
  latency,
  errorMessage,
  roomCode,
  onChangeRoomCode,
  onReconnect,
  useBetaControls,
  onExitRemoteMode,
  onOpenRecordModal,
  onToggleProjectMode,
  onOpenObsModal,
}) => {
  const [manualCodeInput, setManualCodeInput] = useState(roomCode);
  const [showCodeInput, setShowCodeInput] = useState(false);

  // Trigger tactile haptic vibration where supported
  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(35);
      } catch {
        // Ignored
      }
    }
  };

  const handleAction = (action: ActionType) => {
    triggerHaptic();
    dispatch(action);
  };

  const currentBatter = state.isTop
    ? state.awayTeam.lineup[state.awayTeam.currentBatterIndex]
    : state.homeTeam.lineup[state.homeTeam.currentBatterIndex];

  const currentPitcher = state.isTop
    ? state.homeTeam.pitcher
    : state.awayTeam.pitcher;

  const currentPitchCount = getPitcherCount(currentPitcher);

  const activeBaseColor = state.isTop
    ? (state.awayTeam.baseColor || state.awayTeam.color || '#facc15')
    : (state.homeTeam.baseColor || state.homeTeam.color || '#facc15');

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none touch-manipulation pb-10">
      {/* Top Connection Bar */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400">
            <Smartphone size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold tracking-tight text-white">
                {language === 'zh' ? '遠端控制台' : 'Remote Controller'}
              </span>
              <span className="font-mono text-yellow-400 text-[11px] font-black">
                #{roomCode || '---'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              {connectionStatus === 'connected' ? (
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  已連線 {latency !== null ? `(${latency}ms)` : ''}
                </span>
              ) : connectionStatus === 'connecting' ? (
                <span className="text-amber-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                  連線中...
                </span>
              ) : (
                <span className="text-red-400 flex items-center gap-1">
                  <WifiOff size={11} />
                  未連線
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* OBS Overlay & Live Console Button */}
          {onOpenObsModal && (
            <button
              onClick={onOpenObsModal}
              className="px-2.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer border border-purple-400/30"
              title={language === 'zh' ? '開啟 OBS 實況圖層與控制台 (可切換隱藏/開局動畫)' : 'Open OBS Overlay & Console'}
            >
              <Radio size={14} />
              <span>OBS</span>
            </button>
          )}

          {/* Project Mode Button */}
          <button
            onClick={onToggleProjectMode}
            className="px-2.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer border border-blue-400/30"
            title={language === 'zh' ? '在此裝置開啟大螢幕投影 (Project) 模式' : 'Open Display Projection'}
          >
            <Tv size={14} />
            <span>{language === 'zh' ? '投影模式' : 'Project'}</span>
          </button>

          <button
            onClick={() => setShowCodeInput(!showCodeInput)}
            className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold rounded-lg border border-slate-700 transition-colors"
          >
            {language === 'zh' ? '換房間' : 'Room'}
          </button>

          <button
            onClick={onExitRemoteMode}
            className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[11px] rounded-lg border border-slate-700 transition-colors"
            title={language === 'zh' ? '退出遠端連線模式' : 'Exit'}
          >
            {language === 'zh' ? '退出' : 'Exit'}
          </button>
        </div>
      </header>

      {/* Manual Room Code Change Drawer */}
      {showCodeInput && (
        <div className="bg-slate-900 border-b border-slate-700 p-3 flex flex-col gap-2 animate-in slide-in-from-top-2 duration-150">
          <label className="text-xs text-slate-300 font-bold">
            {language === 'zh' ? '輸入遠端記分板畫面的 6 位數房間代碼：' : 'Enter 6-character room code:'}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualCodeInput}
              onChange={(e) => setManualCodeInput(e.target.value.toUpperCase())}
              placeholder="例如: 8K2P9A"
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono font-bold text-yellow-400 uppercase tracking-wider"
              maxLength={10}
            />
            <button
              onClick={() => {
                onChangeRoomCode(manualCodeInput);
                setShowCodeInput(false);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-md cursor-pointer"
            >
              {language === 'zh' ? '連接' : 'Connect'}
            </button>
          </div>
        </div>
      )}

      {/* Connection Warning if Error */}
      {connectionStatus === 'error' && (
        <div className="bg-red-950/80 border-b border-red-800 px-3 py-2 flex items-center justify-between text-xs text-red-200">
          <div className="flex items-center gap-1.5">
            <AlertCircle size={15} className="text-red-400 shrink-0" />
            <span>{errorMessage || (language === 'zh' ? '連線中斷，請確認主機記分板網頁已開啟' : 'Connection lost, ensure host is open')}</span>
          </div>
          <button
            onClick={onReconnect}
            className="px-2 py-1 bg-red-800 hover:bg-red-700 text-white rounded font-bold text-[10px]"
          >
            {language === 'zh' ? '重新連線' : 'Reconnect'}
          </button>
        </div>
      )}

      {/* 戰況畫面 (Live Game Status Banner with Inning, Scores, BSO, and Bases Diamond!) */}
      <div className="bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-b border-slate-800 p-2.5 sm:p-3 shadow-inner">
        <div className="flex items-center justify-between gap-2">
          {/* Away Team */}
          <div className="flex-1 flex flex-col items-center min-w-0">
            <span className="text-xs sm:text-sm font-bold text-slate-300 truncate max-w-full text-center" style={{ color: state.awayTeam.color }}>
              {state.awayTeam.name || '客隊'}
            </span>
            <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight mt-0.5">
              {state.awayTeam.score}
            </span>
          </div>

          {/* Centerpiece: Inning, BSO Count & Interactive Bases Diamond */}
          <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-950/80 rounded-2xl border border-slate-800/80 shrink-0 shadow-xl">
            {/* Left: Inning & BSO */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-xs sm:text-sm font-black text-yellow-400 font-mono">
                <span>{state.isTop ? '▲' : '▼'}</span>
                <span>{state.inning}局{state.isTop ? '上' : '下'}</span>
              </div>
              
              {/* Balls, Strikes, Outs dots */}
              <div className="flex flex-col gap-1 mt-1 text-[10px] font-bold font-mono">
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 w-2.5 text-center">B</span>
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className={`w-2 h-2 rounded-full border ${
                          i < state.balls
                            ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]'
                            : 'bg-slate-800 border-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 w-2.5 text-center">S</span>
                  <div className="flex gap-1">
                    {[0, 1].map((i) => (
                      <span
                        key={i}
                        className={`w-2 h-2 rounded-full border ${
                          i < state.strikes
                            ? 'bg-amber-400 border-amber-300 shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                            : 'bg-slate-800 border-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 w-2.5 text-center">O</span>
                  <div className="flex gap-1">
                    {[0, 1].map((i) => (
                      <span
                        key={i}
                        className={`w-2 h-2 rounded-full border ${
                          i < state.outs
                            ? 'bg-rose-500 border-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.8)]'
                            : 'bg-slate-800 border-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Interactive Bases Diamond (壘包跑者即時控制) */}
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-bold text-slate-400 tracking-wider mb-0.5">
                {language === 'zh' ? '壘包' : 'BASES'}
              </span>
              <div className="relative w-20 h-16 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 80 64">
                  <polygon 
                    points="40,8 68,32 40,56 12,32" 
                    fill="rgba(30, 41, 59, 0.4)" 
                    stroke="rgba(148, 163, 184, 0.3)" 
                    strokeWidth="2" 
                  />
                </svg>

                {/* 2nd Base */}
                <button
                  type="button"
                  onClick={() => handleAction({ type: 'TOGGLE_BASE', baseIndex: 1 })}
                  className="absolute top-0.5 left-1/2 -translate-x-1/2 w-5 h-5 rotate-45 border-2 rounded-xs transition-all shadow-md active:scale-90 flex items-center justify-center cursor-pointer z-10"
                  style={{
                    backgroundColor: state.bases[1] ? activeBaseColor : '#1e293b',
                    borderColor: state.bases[1] ? '#ffffff' : '#64748b',
                    boxShadow: state.bases[1] ? `0 0 10px ${activeBaseColor}` : undefined
                  }}
                  title="二壘 (點擊切換)"
                >
                  <span className="-rotate-45 text-[8px] font-black text-slate-900 select-none">
                    {state.bases[1] ? '●' : '2'}
                  </span>
                </button>

                {/* 3rd Base */}
                <button
                  type="button"
                  onClick={() => handleAction({ type: 'TOGGLE_BASE', baseIndex: 2 })}
                  className="absolute left-1 top-5.5 w-5 h-5 rotate-45 border-2 rounded-xs transition-all shadow-md active:scale-90 flex items-center justify-center cursor-pointer z-10"
                  style={{
                    backgroundColor: state.bases[2] ? activeBaseColor : '#1e293b',
                    borderColor: state.bases[2] ? '#ffffff' : '#64748b',
                    boxShadow: state.bases[2] ? `0 0 10px ${activeBaseColor}` : undefined
                  }}
                  title="三壘 (點擊切換)"
                >
                  <span className="-rotate-45 text-[8px] font-black text-slate-900 select-none">
                    {state.bases[2] ? '●' : '3'}
                  </span>
                </button>

                {/* 1st Base */}
                <button
                  type="button"
                  onClick={() => handleAction({ type: 'TOGGLE_BASE', baseIndex: 0 })}
                  className="absolute right-1 top-5.5 w-5 h-5 rotate-45 border-2 rounded-xs transition-all shadow-md active:scale-90 flex items-center justify-center cursor-pointer z-10"
                  style={{
                    backgroundColor: state.bases[0] ? activeBaseColor : '#1e293b',
                    borderColor: state.bases[0] ? '#ffffff' : '#64748b',
                    boxShadow: state.bases[0] ? `0 0 10px ${activeBaseColor}` : undefined
                  }}
                  title="一壘 (點擊切換)"
                >
                  <span className="-rotate-45 text-[8px] font-black text-slate-900 select-none">
                    {state.bases[0] ? '●' : '1'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Home Team */}
          <div className="flex-1 flex flex-col items-center min-w-0">
            <span className="text-xs sm:text-sm font-bold text-slate-300 truncate max-w-full text-center" style={{ color: state.homeTeam.color }}>
              {state.homeTeam.name || '主隊'}
            </span>
            <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight mt-0.5">
              {state.homeTeam.score}
            </span>
          </div>
        </div>

        {/* Current Matchup: Batter & Pitcher info */}
        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-300 px-1">
          <div className="flex items-center gap-1.5 truncate max-w-[48%]">
            <span className="px-1.5 py-0.5 bg-blue-900/60 text-blue-300 rounded font-black text-[9px] shrink-0">
              {language === 'zh' ? '打者' : 'BAT'}
            </span>
            <span className="font-bold text-white truncate">
              {currentBatter?.name || '---'}
            </span>
            {currentBatter?.number && (
              <span className="text-slate-400 font-mono shrink-0">#{currentBatter.number}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 truncate max-w-[48%] justify-end">
            <span className="px-1.5 py-0.5 bg-rose-900/60 text-rose-300 rounded font-black text-[9px] shrink-0">
              {language === 'zh' ? '投手' : 'PIT'}
            </span>
            <span className="font-bold text-white truncate">
              {currentPitcher?.name || '---'}
            </span>
            <span className="text-yellow-400 font-mono font-bold shrink-0">
              {currentPitchCount}{language === 'zh' ? '球' : 'P'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area: 直接完整後台模式 (Full Control Console) */}
      <div className="flex-1 p-2 sm:p-3 overflow-y-auto">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-1 sm:p-2 shadow-2xl">
          {useBetaControls ? (
            <ScoreboardControlsV2
              state={state}
              dispatch={handleAction}
              language={language}
              onOpenRecordModal={onOpenRecordModal}
            />
          ) : (
            <ScoreboardControls
              state={state}
              dispatch={handleAction}
              language={language}
              onOpenRecordModal={onOpenRecordModal}
            />
          )}
        </div>
      </div>
    </div>
  );
};
