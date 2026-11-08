import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { ScoresheetSyncState } from '../hooks/useScoresheetSync';
import { extractScoresheetGameId } from '../utils/scoresheetSync';

type Language = 'en' | 'zh' | 'ja';

const TEXT: Record<Language, Record<string, string>> = {
  ja: {
    title: 'scoresheet 連携（読み取り専用）',
    placeholder: '試合ID または試合ページのURL',
    start: '連携開始',
    stop: '連携停止',
    invalid: '試合ID（UUID）が見つかりません',
    note: '連携中はスコア・イニング・アウト・走者・打順・投手が scoresheet の内容で上書きされます。打者とカウントは記録者が打席を確定した時点のものです。',
    idle: '未接続',
    loading: '取得中…',
    live: '連携中',
    final: '試合終了（取得を停止）',
    error: 'エラー',
    updated: '最終更新',
  },
  zh: {
    title: 'scoresheet 連動（唯讀）',
    placeholder: '比賽ID 或比賽頁面網址',
    start: '開始連動',
    stop: '停止連動',
    invalid: '找不到比賽ID（UUID）',
    note: '連動期間，比分、局數、出局數、跑者、打序與投手會以 scoresheet 的資料覆寫。打者與球數為記錄員確定打席當下的資料。',
    idle: '未連線',
    loading: '讀取中…',
    live: '連動中',
    final: '比賽結束（已停止讀取）',
    error: '錯誤',
    updated: '最後更新',
  },
  en: {
    title: 'scoresheet sync (read-only)',
    placeholder: 'Game ID or game page URL',
    start: 'Start sync',
    stop: 'Stop sync',
    invalid: 'No game ID (UUID) found',
    note: 'While syncing, score, inning, outs, runners, lineup and pitcher are overwritten from scoresheet. Batter and count reflect the last confirmed plate appearance.',
    idle: 'Not connected',
    loading: 'Loading…',
    live: 'Syncing',
    final: 'Final (polling stopped)',
    error: 'Error',
    updated: 'Last updated',
  },
};

const STATUS_COLOR: Record<ScoresheetSyncState['status'], string> = {
  idle: 'text-slate-400',
  loading: 'text-sky-300',
  live: 'text-emerald-300',
  final: 'text-slate-300',
  error: 'text-red-400',
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  syncState: ScoresheetSyncState;
  onStart: (gameId: string) => void;
  onStop: () => void;
}

export const ScoresheetSyncModal: React.FC<Props> = ({ isOpen, onClose, language, syncState, onStart, onStop }) => {
  const [input, setInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const t = TEXT[language] ?? TEXT.en;

  if (!isOpen) return null;

  const isActive = syncState.gameId !== null;

  const handleStart = () => {
    const gameId = extractScoresheetGameId(input);
    if (!gameId) {
      setInputError(t.invalid);
      return;
    }
    setInputError(null);
    onStart(gameId);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-5 text-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{t.title}</h2>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {isActive ? (
          <div className="mb-3 break-all rounded bg-slate-900 px-3 py-2 font-mono text-xs text-slate-300">{syncState.gameId}</div>
        ) : (
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            placeholder={t.placeholder}
            className="mb-2 w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-sky-500"
          />
        )}
        {inputError && <p className="mb-2 text-xs text-red-400">{inputError}</p>}

        <div className="mb-3 flex items-center justify-between text-sm">
          <span className={STATUS_COLOR[syncState.status]}>
            {t[syncState.status]}
            {syncState.error && ` (${syncState.error})`}
          </span>
          {syncState.lastUpdatedAt && (
            <span className="text-xs text-slate-400">
              {t.updated}: {new Date(syncState.lastUpdatedAt).toLocaleTimeString()}
            </span>
          )}
        </div>

        <p className="mb-4 text-xs leading-relaxed text-slate-400">{t.note}</p>

        {isActive ? (
          <button onClick={onStop} className="w-full rounded bg-red-600 py-2 text-sm font-bold hover:bg-red-500">
            {t.stop}
          </button>
        ) : (
          <button onClick={handleStart} className="w-full rounded bg-sky-600 py-2 text-sm font-bold hover:bg-sky-500">
            {t.start}
          </button>
        )}
      </div>
    </div>
  );
};
