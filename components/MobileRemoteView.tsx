import React, { useState } from 'react';
import { GameState, ActionType } from '../types';
import { getPitcherCount } from '../reducer';
import { ConnectionStatus } from '../hooks/usePeerSync';
import {
  Smartphone,
  Wifi,
  WifiOff,
  RotateCcw,
  Zap,
  Sliders,
  ArrowRightLeft,
  AlertCircle
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
}) => {
  const [activeTab, setActiveTab] = useState<'fast' | 'full'>('fast');
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

  const handleClearBases = () => {
    ([0, 1, 2] as const).forEach(b => {
      if (state.bases[b]) {
        handleAction({ type: 'TOGGLE_BASE', baseIndex: b });
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none touch-manipulation pb-12">
      {/* Top Connection Bar */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400">
            <Smartphone size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold tracking-tight text-white">
                {language === 'zh' ? '手機遙控台' : 'Remote Controller'}
              </span>
              <span className="px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded">
                P2P
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className="font-mono text-yellow-400 font-bold">#{roomCode || '---'}</span>
              <span>·</span>
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
          <button
            onClick={() => setShowCodeInput(!showCodeInput)}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold rounded-lg border border-slate-700"
          >
            換房間
          </button>
          <button
            onClick={onExitRemoteMode}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[11px] rounded-lg border border-slate-700"
          >
            記分板
          </button>
        </div>
      </header>

      {/* Manual Room Code Change Drawer */}
      {showCodeInput && (
        <div className="bg-slate-900 border-b border-slate-700 p-3 flex flex-col gap-2">
          <label className="text-xs text-slate-300 font-bold">
            輸入遠端記分板畫面的 6 位數房間代碼：
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-md"
            >
              連接
            </button>
          </div>
        </div>
      )}

      {/* Connection Warning if Error */}
      {connectionStatus === 'error' && (
        <div className="bg-red-950/80 border-b border-red-800 px-3 py-2 flex items-center justify-between text-xs text-red-200">
          <div className="flex items-center gap-1.5">
            <AlertCircle size={15} className="text-red-400 shrink-0" />
            <span>{errorMessage || '連線中斷，請確認記分板網頁已開啟'}</span>
          </div>
          <button
            onClick={onReconnect}
            className="px-2 py-1 bg-red-800 hover:bg-red-700 text-white rounded font-bold text-[10px]"
          >
            重新連線
          </button>
        </div>
      )}

      {/* Live Mini Game Status Banner */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 p-3 shadow-inner">
        <div className="flex items-center justify-between">
          {/* Away Team */}
          <div className="flex-1 flex flex-col items-center">
            <span className="text-xs font-bold text-slate-300 truncate max-w-[90px]">
              {state.awayTeam.name || '客隊'}
            </span>
            <span className="text-3xl font-black font-mono text-white tracking-tight">
              {state.awayTeam.score}
            </span>
          </div>

          {/* Inning & Count Centerpiece */}
          <div className="flex flex-col items-center px-3 py-1 bg-slate-900/90 rounded-xl border border-slate-800 shrink-0 shadow-lg">
            <div className="flex items-center gap-1 text-sm font-black text-yellow-400 font-mono">
              <span>{state.isTop ? '▲' : '▼'}</span>
              <span>{state.inning}局{state.isTop ? '上' : '下'}</span>
            </div>
            
            {/* Balls, Strikes, Outs dots */}
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-0.5">
                <span className="text-[10px] font-bold text-slate-400 font-mono">B</span>
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
              <div className="flex items-center gap-0.5">
                <span className="text-[10px] font-bold text-slate-400 font-mono">S</span>
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
              <div className="flex items-center gap-0.5">
                <span className="text-[10px] font-bold text-slate-400 font-mono">O</span>
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

          {/* Home Team */}
          <div className="flex-1 flex flex-col items-center">
            <span className="text-xs font-bold text-slate-300 truncate max-w-[90px]">
              {state.homeTeam.name || '主隊'}
            </span>
            <span className="text-3xl font-black font-mono text-white tracking-tight">
              {state.homeTeam.score}
            </span>
          </div>
        </div>

        {/* Current Matchup: Batter & Pitcher info */}
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5 truncate max-w-[48%]">
            <span className="px-1.5 py-0.5 bg-blue-900/60 text-blue-300 rounded font-black text-[9px]">
              打者
            </span>
            <span className="font-bold text-white truncate">
              {currentBatter?.name || '無'}
            </span>
            {currentBatter?.number && (
              <span className="text-slate-400 font-mono">#{currentBatter.number}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 truncate max-w-[48%] justify-end">
            <span className="px-1.5 py-0.5 bg-rose-900/60 text-rose-300 rounded font-black text-[9px]">
              投手
            </span>
            <span className="font-bold text-white truncate">
              {currentPitcher?.name || '無'}
            </span>
            <span className="text-yellow-400 font-mono font-bold">
              {currentPitchCount}球
            </span>
          </div>
        </div>
      </div>

      {/* Tab Switcher: Fast Remote vs Full Controls */}
      <div className="px-3 pt-3 flex gap-2">
        <button
          onClick={() => setActiveTab('fast')}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'fast'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Zap size={15} />
          <span>極簡快控模式</span>
        </button>
        <button
          onClick={() => setActiveTab('full')}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'full'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Sliders size={15} />
          <span>完整後台模式</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-3 overflow-y-auto">
        {activeTab === 'fast' ? (
          <div className="space-y-4">
            {/* 1. BSO Giant Thumb Buttons */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                球數控制 (點擊立即生效)
              </span>
              <div className="grid grid-cols-3 gap-2.5">
                {/* BALL */}
                <button
                  onClick={() => handleAction({ type: 'INCREMENT_BALL' })}
                  className="p-3.5 bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 active:scale-95 text-white font-black rounded-2xl shadow-lg border border-emerald-400/30 flex flex-col items-center justify-center gap-0.5 cursor-pointer"
                >
                  <span className="text-xl sm:text-2xl font-black font-mono">B</span>
                  <span className="text-xs font-bold text-emerald-100">好球 ({state.balls})</span>
                </button>

                {/* STRIKE */}
                <button
                  onClick={() => handleAction({ type: 'INCREMENT_STRIKE' })}
                  className="p-3.5 bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 font-black rounded-2xl shadow-lg border border-amber-300/40 flex flex-col items-center justify-center gap-0.5 cursor-pointer"
                >
                  <span className="text-xl sm:text-2xl font-black font-mono">S</span>
                  <span className="text-xs font-bold text-slate-950">壞球 ({state.strikes})</span>
                </button>

                {/* OUT */}
                <button
                  onClick={() => handleAction({ type: 'INCREMENT_OUT' })}
                  className="p-3.5 bg-gradient-to-b from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:scale-95 text-white font-black rounded-2xl shadow-lg border border-rose-400/30 flex flex-col items-center justify-center gap-0.5 cursor-pointer"
                >
                  <span className="text-xl sm:text-2xl font-black font-mono">O</span>
                  <span className="text-xs font-bold text-rose-100">出局 ({state.outs})</span>
                </button>
              </div>

              {/* Reset Count Button */}
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => handleAction({ type: 'RESET_COUNT' })}
                  className="flex-1 py-2 px-3 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition-colors"
                >
                  好壞球歸零 (Reset Count)
                </button>
                <button
                  onClick={() => handleAction({ type: 'UNDO' })}
                  className="py-2 px-4 bg-slate-800/90 hover:bg-slate-700 text-amber-400 hover:text-amber-300 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw size={14} />
                  <span>復原</span>
                </button>
              </div>
            </div>

            {/* 2. Run / Score +/- Buttons */}
            <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                比分調整 (+ / -)
              </span>
              <div className="grid grid-cols-2 gap-3">
                {/* Away Score Buttons */}
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex flex-col items-center gap-2">
                  <span className="text-xs font-bold text-slate-300 truncate max-w-full">
                    {state.awayTeam.name || '客隊'}
                  </span>
                  <div className="flex items-center gap-2 w-full">
                    <button
                      onClick={() => handleAction({ type: 'ADD_SCORE', team: 'away', amount: -1 })}
                      className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-black rounded-lg text-lg border border-slate-700"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => handleAction({ type: 'ADD_SCORE', team: 'away', amount: 1 })}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black rounded-lg text-lg shadow-md"
                    >
                      +1
                    </button>
                  </div>
                </div>

                {/* Home Score Buttons */}
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex flex-col items-center gap-2">
                  <span className="text-xs font-bold text-slate-300 truncate max-w-full">
                    {state.homeTeam.name || '主隊'}
                  </span>
                  <div className="flex items-center gap-2 w-full">
                    <button
                      onClick={() => handleAction({ type: 'ADD_SCORE', team: 'home', amount: -1 })}
                      className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-black rounded-lg text-lg border border-slate-700"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => handleAction({ type: 'ADD_SCORE', team: 'home', amount: 1 })}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black rounded-lg text-lg shadow-md"
                    >
                      +1
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Base Runners Interactive Toggle */}
            <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  壘包跑者 (點擊切換)
                </span>
                <button
                  onClick={handleClearBases}
                  className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                >
                  清空壘包
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { baseIndex: 0 as const, label: '一壘 (1B)' },
                  { baseIndex: 1 as const, label: '二壘 (2B)' },
                  { baseIndex: 2 as const, label: '三壘 (3B)' },
                ].map(({ baseIndex, label }) => {
                  const isOccupied = state.bases[baseIndex];
                  return (
                    <button
                      key={baseIndex}
                      onClick={() => handleAction({ type: 'TOGGLE_BASE', baseIndex })}
                      className={`py-3 px-2 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        isOccupied
                          ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-950/40 border border-amber-300'
                          : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rotate-45 border ${
                        isOccupied ? 'bg-slate-950 border-slate-900' : 'bg-transparent border-slate-500'
                      }`} />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Quick Batting Outcomes */}
            <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                常用打席結果 (自動記錄並前進)
              </span>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => handleAction({ type: 'SINGLE' })}
                  className="py-2.5 px-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-emerald-400 font-black rounded-xl text-xs border border-slate-700 cursor-pointer"
                >
                  一安 (1B)
                </button>
                <button
                  onClick={() => handleAction({ type: 'DOUBLE' })}
                  className="py-2.5 px-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-cyan-400 font-black rounded-xl text-xs border border-slate-700 cursor-pointer"
                >
                  二安 (2B)
                </button>
                <button
                  onClick={() => handleAction({ type: 'TRIPLE' })}
                  className="py-2.5 px-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-blue-400 font-black rounded-xl text-xs border border-slate-700 cursor-pointer"
                >
                  三安 (3B)
                </button>
                <button
                  onClick={() => handleAction({ type: 'HOME_RUN' })}
                  className="py-2.5 px-1 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 active:scale-95 text-white font-black rounded-xl text-xs shadow-md border border-yellow-400/40 cursor-pointer"
                >
                  全壘打 (HR)
                </button>
                <button
                  onClick={() => handleAction({ type: 'WALK', walkType: '四球' })}
                  className="py-2.5 px-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-emerald-300 font-bold rounded-xl text-xs border border-slate-700 cursor-pointer"
                >
                  四壞 (BB)
                </button>
                <button
                  onClick={() => handleAction({ type: 'BATTER_OUT', outType: '三振' })}
                  className="py-2.5 px-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-rose-400 font-bold rounded-xl text-xs border border-slate-700 cursor-pointer"
                >
                  三振 (K)
                </button>
                <button
                  onClick={() => handleAction({ type: 'BATTER_OUT', outType: '滾地' })}
                  className="py-2.5 px-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-bold rounded-xl text-xs border border-slate-700 cursor-pointer"
                >
                  滾地 (GO)
                </button>
                <button
                  onClick={() => handleAction({ type: 'BATTER_OUT', outType: '高飛' })}
                  className="py-2.5 px-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-bold rounded-xl text-xs border border-slate-700 cursor-pointer"
                >
                  高飛 (FO)
                </button>
              </div>

              {/* Double play & Sac fly */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  onClick={() => handleAction({ type: 'BATTER_OUT', outType: '雙殺' })}
                  className="py-2.5 px-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-orange-400 font-bold rounded-xl text-xs border border-slate-700 cursor-pointer"
                >
                  雙殺 (DP)
                </button>
                {state.outs < 2 && state.bases[2] ? (
                  <button
                    onClick={() => handleAction({ type: 'SAC_FLY' })}
                    className="py-2.5 px-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/60 active:scale-95 text-emerald-300 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    高飛犧牲打 (SF) +1分
                  </button>
                ) : (
                  <button
                    onClick={() => handleAction({ type: 'WALK', walkType: '觸身' })}
                    className="py-2.5 px-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-teal-300 font-bold rounded-xl text-xs border border-slate-700 cursor-pointer"
                  >
                    觸身球 (HBP)
                  </button>
                )}
              </div>
            </div>

            {/* 5. Inning & Pitch Count Controls */}
            <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 flex flex-col gap-2.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                局數與投手球數
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleAction({ type: 'NEXT_INNING' })}
                  className="py-2.5 px-3 bg-blue-600/30 hover:bg-blue-600/40 text-blue-300 border border-blue-500/40 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowRightLeft size={14} />
                  <span>換半局 (下一局)</span>
                </button>
                <button
                  onClick={() => handleAction({ type: 'PREVIOUS_HALF_INNING' })}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs border border-slate-700 cursor-pointer"
                >
                  回上一局
                </button>
              </div>

              {/* Pitch count */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span className="text-xs text-slate-300 font-medium">
                  投手球數 ({currentPitchCount} 球)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleAction({ type: 'DECREMENT_PLAYER_STAT', role: 'pitcher' })}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold border border-slate-700 cursor-pointer"
                  >
                    -1 球
                  </button>
                  <button
                    onClick={() => handleAction({ type: 'INCREMENT_PLAYER_STAT', role: 'pitcher' })}
                    className="px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/40 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    +1 球
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Full Controls Tab */
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-2 overflow-y-auto">
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
        )}
      </div>
    </div>
  );
};
