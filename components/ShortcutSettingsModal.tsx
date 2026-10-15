import React, { useState, useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';
import { ShortcutMap, ShortcutAction, DEFAULT_SHORTCUTS } from '../hooks/useShortcuts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: ShortcutMap;
  onSave: (newShortcuts: ShortcutMap) => void;
  language?: 'en' | 'zh' | 'ja';
}

const ACTION_LABELS: Record<ShortcutAction, { en: string, zh: string, ja: string }> = {
  INCREMENT_BALL: { en: 'Ball', zh: '壞球', ja: 'ボール' },
  INCREMENT_STRIKE: { en: 'Strike', zh: '好球', ja: 'ストライク' },
  INCREMENT_OUT: { en: 'Out', zh: '出局', ja: 'アウト' },
  TOGGLE_BASE_1: { en: '1st Base', zh: '一壘', ja: '一塁' },
  TOGGLE_BASE_2: { en: '2nd Base', zh: '二壘', ja: '二塁' },
  TOGGLE_BASE_3: { en: '3rd Base', zh: '三壘', ja: '三塁' },
  INCREMENT_PITCH_COUNT: { en: 'Increase Pitch Count', zh: '增加投球數', ja: '投球数増加' },
  DECREMENT_PITCH_COUNT: { en: 'Decrease Pitch Count', zh: '減少投球數', ja: '投球数減少' },
  NEXT_BATTER: { en: 'Next Batter', zh: '下一個打者', ja: '次の打者' },
  PREVIOUS_BATTER: { en: 'Previous Batter', zh: '上一個打者', ja: '前の打者' },
  TOGGLE_TIMER: { en: 'Start/Stop Timer', zh: '投球計時器', ja: 'タイマー開始/停止' },
  NEXT_HALF_INNING: { en: 'Next Half Inning', zh: '下個半局', ja: '次の回' },
  PREVIOUS_HALF_INNING: { en: 'Previous Half Inning', zh: '上個半局', ja: '前の回' },
  NEXT_FULL_INNING: { en: 'Next Inning', zh: '下一局', ja: '次イニング' },
  PREVIOUS_FULL_INNING: { en: 'Previous Inning', zh: '上一局', ja: '前イニング' },
  ADD_AWAY_SCORE: { en: 'Add Away Score', zh: '客隊加分', ja: 'ビジター得点' },
  ADD_HOME_SCORE: { en: 'Add Home Score', zh: '主隊加分', ja: 'ホーム得点' },
  HOME_RUN: { en: 'Home Run (Long Press)', zh: '全壘打 (長按)', ja: 'ホームラン (長押し)' },
  RESET_COUNT: { en: 'Reset Count', zh: '重置好壞球', ja: 'カウントリセット' },
  SINGLE: { en: 'Single', zh: '一壘安打', ja: '単打' },
  DOUBLE: { en: 'Double', zh: '二壘安打', ja: '二塁打' },
  TRIPLE: { en: 'Triple', zh: '三壘安打', ja: '三塁打' },
  RESET_SCORE: { en: 'Reset Score (Long Press)', zh: '重置雙方分數 (長按)', ja: 'スコアリセット (長押し)' },
  TOGGLE_DISPLAY_MODE: { en: 'Cycle Display Mode', zh: '循環切換顯示模式', ja: '表示モード切替' },
  TOGGLE_LINEUP_MODE: { en: 'Toggle Lineup Mode', zh: '切換打線模式', ja: 'スタメンモード切替' },
  TOGGLE_RHE_MODE: { en: 'Toggle RHE Mode', zh: '切換局間模式', ja: 'RHEモード切替' },
};

const formatKey = (key: string) => {
  if (key === ' ') return 'Space';
  if (key === 'ArrowUp') return '↑';
  if (key === 'ArrowDown') return '↓';
  if (key === 'ArrowLeft') return '←';
  if (key === 'ArrowRight') return '→';
  if (key === 'ShiftLeft') return 'L-Shift';
  if (key === 'ShiftRight') return 'R-Shift';
  return key.toUpperCase();
};

export const ShortcutSettingsModal: React.FC<Props> = ({ isOpen, onClose, shortcuts, onSave, language = 'zh' }) => {
  const [localShortcuts, setLocalShortcuts] = useState<ShortcutMap>(shortcuts);
  const [editingAction, setEditingAction] = useState<ShortcutAction | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalShortcuts(shortcuts);
      setEditingAction(null);
    }
  }, [isOpen, shortcuts]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editingAction) return;
      e.preventDefault();
      
      let key = e.key;
      if (e.code.startsWith('Key')) key = e.key.toLowerCase();
      if (e.code.startsWith('Digit')) key = e.key;
      if (e.code === 'Space') key = ' ';
      
      setLocalShortcuts(prev => ({
        ...prev,
        [editingAction]: key
      }));
      setEditingAction(null);
    };

    if (editingAction) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [editingAction]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[200] p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
          <div className="flex items-center gap-2">
            <Keyboard className="text-blue-400" size={20} />
            <h2 className="text-lg font-bold text-white">
              {language === 'en' ? 'Keyboard Shortcut Settings' : language === 'zh' ? '鍵盤快捷鍵設定' : 'キーボードショートカット設定'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(Object.keys(ACTION_LABELS) as ShortcutAction[]).map((action) => (
              <div key={action} className="flex justify-between items-center bg-slate-700/50 p-2.5 rounded-lg border border-slate-600/30">
                <span className="text-slate-200 text-sm font-medium">{ACTION_LABELS[action][language] || ACTION_LABELS[action].zh}</span>
                <button
                  onClick={() => setEditingAction(action)}
                  className={`px-3 py-1.5 rounded-md min-w-[80px] text-center font-mono text-xs font-bold transition-all cursor-pointer ${
                    editingAction === action
                      ? 'bg-blue-500 text-white animate-pulse shadow-md'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-600 hover:text-white border border-slate-700'
                  }`}
                >
                  {editingAction === action
                    ? (language === 'en' ? 'Press key...' : language === 'zh' ? '請按鍵...' : 'キーを押す...')
                    : formatKey(localShortcuts[action])}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-slate-700 flex justify-between items-center bg-slate-850">
          <button
            onClick={() => setLocalShortcuts(DEFAULT_SHORTCUTS)}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            {language === 'en' ? 'Reset to Default' : language === 'zh' ? '恢復預設' : 'デフォルトに戻す'}
          </button>
          <div className="space-x-2 flex">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              {language === 'en' ? 'Cancel' : language === 'zh' ? '取消' : 'キャンセル'}
            </button>
            <button
              onClick={() => {
                onSave(localShortcuts);
                onClose();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-md"
            >
              {language === 'en' ? 'Save Changes' : language === 'zh' ? '儲存變更' : '変更を保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
