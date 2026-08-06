import React, { useState, useEffect } from 'react';
import { X, Keyboard, Gamepad2, Layout, List } from 'lucide-react';
import { ShortcutMap, ShortcutAction, DEFAULT_SHORTCUTS } from '../hooks/useShortcuts';
import GamepadVisualSetup from './GamepadVisualSetup';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: ShortcutMap;
  onSave: (newShortcuts: ShortcutMap) => void;
  language?: 'en' | 'zh';
}

const ACTION_LABELS: Record<ShortcutAction, { en: string, zh: string }> = {
  INCREMENT_BALL: { en: 'Ball', zh: '壞球' },
  INCREMENT_STRIKE: { en: 'Strike', zh: '好球' },
  INCREMENT_OUT: { en: 'Out', zh: '出局' },
  TOGGLE_BASE_1: { en: '1st Base', zh: '一壘' },
  TOGGLE_BASE_2: { en: '2nd Base', zh: '二壘' },
  TOGGLE_BASE_3: { en: '3rd Base', zh: '三壘' },
  INCREMENT_PITCH_COUNT: { en: 'Increase Pitch Count', zh: '增加投球數' },
  DECREMENT_PITCH_COUNT: { en: 'Decrease Pitch Count', zh: '減少投球數' },
  NEXT_BATTER: { en: 'Next Batter', zh: '下一個打者' },
  PREVIOUS_BATTER: { en: 'Previous Batter', zh: '上一個打者' },
  TOGGLE_TIMER: { en: 'Start/Stop Timer', zh: '投球計時器' },
  NEXT_HALF_INNING: { en: 'Next Half Inning', zh: '下個半局' },
  PREVIOUS_HALF_INNING: { en: 'Previous Half Inning', zh: '上個半局' },
  NEXT_FULL_INNING: { en: 'Next Inning', zh: '下一局' },
  PREVIOUS_FULL_INNING: { en: 'Previous Inning', zh: '上一局' },
  ADD_AWAY_SCORE: { en: 'Add Away Score', zh: '客隊加分' },
  ADD_HOME_SCORE: { en: 'Add Home Score', zh: '主隊加分' },
  HOME_RUN: { en: 'Home Run (Long Press)', zh: '全壘打 (長按)' },
  RESET_COUNT: { en: 'Reset Count', zh: '重置好壞球' },
  SINGLE: { en: 'Single', zh: '一壘安打' },
  DOUBLE: { en: 'Double', zh: '二壘安打' },
  TRIPLE: { en: 'Triple', zh: '三壘安打' },
  RESET_SCORE: { en: 'Reset Score (Long Press)', zh: '重置雙方分數 (長按)' },
  TOGGLE_DISPLAY_MODE: { en: 'Cycle Display Mode', zh: '循環切換顯示模式' },
  TOGGLE_LINEUP_MODE: { en: 'Toggle Lineup Mode', zh: '切換打線模式' },
  TOGGLE_RHE_MODE: { en: 'Toggle RHE Mode', zh: '切換局間模式' },
};

const GAMEPAD_MAPPING = [
  { action: { en: 'Ball', zh: '壞球' }, button: '△ (Triangle)' },
  { action: { en: 'Strike', zh: '好球' }, button: '◯ (Circle)' },
  { action: { en: 'Out', zh: '出局' }, button: '✕ (Cross)' },
  { action: { en: 'Out + Next Batter + Reset', zh: '出局+下一棒+清空球數' }, button: '✕ (Long Press)' },
  { action: { en: 'Reset Count', zh: '重置好壞球' }, button: '□ (Square)' },
  { action: { en: 'Toggle 1st Base', zh: '一壘有人切換' }, button: 'D-Pad Right (→)' },
  { action: { en: 'Single', zh: '一壘安打' }, button: 'D-Pad Right (Long Press)' },
  { action: { en: 'Toggle 2nd Base', zh: '二壘有人切換' }, button: 'D-Pad Up (↑)' },
  { action: { en: 'Double', zh: '二壘安打' }, button: 'D-Pad Up (Long Press)' },
  { action: { en: 'Toggle 3rd Base', zh: '三壘有人切換' }, button: 'D-Pad Left (←)' },
  { action: { en: 'Triple', zh: '三壘安打' }, button: 'D-Pad Left (Long Press)' },
  { action: { en: 'Clear Bases', zh: '清除壘包' }, button: 'D-Pad Down (Long Press)' },
  { action: { en: 'Next Half Inning', zh: '下個半局' }, button: 'L & R Sticks Down (雙搖桿向下)' },
  { action: { en: 'Previous Half Inning', zh: '上個半局' }, button: 'L & R Sticks Up (雙搖桿向上)' },
  { action: { en: 'Next Batter', zh: '下一棒' }, button: 'R1' },
  { action: { en: 'Previous Batter', zh: '上一棒' }, button: 'L1' },
  { action: { en: 'Hide Batter Info', zh: '隱藏打者資訊' }, button: 'L1 (Long Press)' },
  { action: { en: 'Hide Pitcher Info', zh: '隱藏投手資訊' }, button: 'R1 (Long Press)' },
  { action: { en: 'Show Batter Info + Next Batter', zh: '顯示打者資訊+下一棒' }, button: 'L1 (When Hidden)' },
  { action: { en: 'Show Pitcher Info', zh: '顯示投手資訊' }, button: 'R1 (When Hidden)' },
  { action: { en: 'Away Score +1', zh: '客隊加分' }, button: 'L2' },
  { action: { en: 'Home Score +1', zh: '主隊加分' }, button: 'R2' },
  { action: { en: 'Toggle Display Mode', zh: '切換顯示模式' }, button: 'Options' },
  { action: { en: 'Reset Game', zh: '確認是否重置整個比賽' }, button: 'Options (Long Press)' },
  { action: { en: 'Start/Stop Timer', zh: '暫停/開始投球計時器' }, button: 'Share' },
  { action: { en: 'Home Run Animation', zh: '全壘打動畫' }, button: 'Touchpad (Long Press)' },
];

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
  const [activeTab, setActiveTab] = useState<'keyboard' | 'gamepad'>('keyboard');
  const [gamepadView, setGamepadView] = useState<'visual' | 'list'>('visual');

  useEffect(() => {
    if (isOpen) {
      setLocalShortcuts(shortcuts);
      setEditingAction(null);
      setActiveTab('keyboard');
    }
  }, [isOpen, shortcuts]);

  useEffect(() => {
    if (!editingAction || activeTab !== 'keyboard') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      
      let keyToSave = e.key;
      
      // Handle left/right shift specifically
      if (e.key === 'Shift') {
        keyToSave = e.code; // 'ShiftLeft' or 'ShiftRight'
      } else if (['Control', 'Alt', 'Meta'].includes(e.key)) {
        // Ignore other modifier keys alone
        return;
      }

      setLocalShortcuts(prev => ({
        ...prev,
        [editingAction]: keyToSave
      }));
      setEditingAction(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingAction, activeTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">{language === 'en' ? 'Shortcut Settings' : language === 'zh' ? '快捷鍵設定' : 'ショートカット設定'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex border-b border-slate-700">
          <button
            className={`flex-1 py-3 flex items-center justify-center gap-2 font-medium transition-colors ${
              activeTab === 'keyboard' ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-700/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
            }`}
            onClick={() => setActiveTab('keyboard')}
          >
            <Keyboard size={18} />
            {language === 'en' ? 'Keyboard' : language === 'zh' ? '鍵盤' : 'キーボード'}
          </button>
          <button
            className={`flex-1 py-3 flex items-center justify-center gap-2 font-medium transition-colors ${
              activeTab === 'gamepad' ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-700/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
            }`}
            onClick={() => setActiveTab('gamepad')}
          >
            <Gamepad2 size={18} />
            {language === 'en' ? 'Gamepad (PS4)' : language === 'zh' ? '遊戲手把 (PS4)' : 'ゲームパッド (PS4)'}
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1">
          {activeTab === 'keyboard' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.keys(ACTION_LABELS) as ShortcutAction[]).map((action) => (
                <div key={action} className="flex justify-between items-center bg-slate-700/50 p-3 rounded-lg">
                  <span className="text-slate-200 text-sm">{ACTION_LABELS[action][language]}</span>
                  <button
                    onClick={() => setEditingAction(action)}
                    className={`px-3 py-1.5 rounded-md min-w-[80px] text-center font-mono text-sm transition-colors ${
                      editingAction === action
                        ? 'bg-blue-500 text-white animate-pulse'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {editingAction === action ? (language === 'en' ? 'Press key...' : language === 'zh' ? '請按下按鍵...' : 'キーを押してください...') : formatKey(localShortcuts[action])}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setGamepadView('visual')}
                  className={`p-2 rounded-lg flex items-center gap-2 text-xs font-medium transition-all ${gamepadView === 'visual' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-slate-200'}`}
                >
                  <Layout size={14} />
                  {language === 'en' ? 'Visual' : language === 'zh' ? '視覺化' : 'ビジュアル'}
                </button>
                <button 
                  onClick={() => setGamepadView('list')}
                  className={`p-2 rounded-lg flex items-center gap-2 text-xs font-medium transition-all ${gamepadView === 'list' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-slate-200'}`}
                >
                  <List size={14} />
                  {language === 'en' ? 'List' : language === 'zh' ? '列表' : 'リスト'}
                </button>
              </div>

              {gamepadView === 'visual' ? (
                <GamepadVisualSetup language={language} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {GAMEPAD_MAPPING.map((mapping, index) => (
                    <div key={index} className="flex justify-between items-center bg-slate-700/50 p-3 rounded-lg">
                      <span className="text-slate-200 text-sm">{mapping.action[language]}</span>
                      <div className="px-3 py-1.5 rounded-md min-w-[80px] text-center font-mono text-sm bg-slate-900 text-slate-300">
                        {mapping.button}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg text-sm text-blue-200">
                {language === 'en' 
                  ? 'Note: Connect your controller via Bluetooth or USB and press any button to activate. Gamepad mapping is currently fixed.' 
                  : '提示：請透過藍牙或 USB 連接手把，並在網頁上按下任意鍵以啟用。目前手把按鍵配置為固定設定。'}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-700 flex justify-between">
          {activeTab === 'keyboard' ? (
            <button
              onClick={() => setLocalShortcuts(DEFAULT_SHORTCUTS)}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              {language === 'en' ? 'Reset to Default' : language === 'zh' ? '恢復預設' : 'デフォルトに戻す'}
            </button>
          ) : (
            <div></div> // Empty div for spacing
          )}
          <div className="space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              {language === 'en' ? 'Cancel' : language === 'zh' ? '取消' : 'キャンセル'}
            </button>
            <button
              onClick={() => {
                onSave(localShortcuts);
                onClose();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
            >
              {language === 'en' ? 'Save Changes' : language === 'zh' ? '儲存變更' : '変更を保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
