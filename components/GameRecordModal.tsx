import React, { useState, useEffect } from 'react';
import { 
  X, Save, FileText, Download, Upload, Printer, Copy, Check, 
  Edit2, Trash2, Plus, Minus, Calendar, Trophy, ChevronRight, 
  Share2, RotateCcw, History, User, ListOrdered, Sparkles, CheckCircle2
} from 'lucide-react';
import { GameState, Team, Player, SavedGameRecord } from '../types';

interface GameRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: GameState;
  dispatch: React.Dispatch<any>;
  language: 'en' | 'zh' | 'ja';
}

const STORAGE_KEY = 'baseball_game_records_archive';

export const GameRecordModal: React.FC<GameRecordModalProps> = ({
  isOpen,
  onClose,
  state,
  dispatch,
  language
}) => {
  const [activeTab, setActiveTab] = useState<'boxscore' | 'edit' | 'archive' | 'export'>('boxscore');
  const [activeTeamTab, setActiveTeamTab] = useState<'away' | 'home'>('away');
  const [savedRecords, setSavedRecords] = useState<SavedGameRecord[]>([]);
  const [recordTitle, setRecordTitle] = useState('');
  const [recordNotes, setRecordNotes] = useState('');
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Edit draft states
  const [editingAwayTeam, setEditingAwayTeam] = useState<Team>(() => JSON.parse(JSON.stringify(state.awayTeam)));
  const [editingHomeTeam, setEditingHomeTeam] = useState<Team>(() => JSON.parse(JSON.stringify(state.homeTeam)));
  const [isSavedNotify, setIsSavedNotify] = useState(false);

  // Sync draft states when state changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setEditingAwayTeam(JSON.parse(JSON.stringify(state.awayTeam)));
      setEditingHomeTeam(JSON.parse(JSON.stringify(state.homeTeam)));
      setRecordTitle(`${state.awayTeam.name} vs ${state.homeTeam.name} (${new Date().toLocaleDateString()})`);
      loadSavedRecords();
    }
  }, [isOpen, state]);

  const loadSavedRecords = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        setSavedRecords(JSON.parse(data));
      } else {
        setSavedRecords([]);
      }
    } catch (e) {
      console.error('Failed to load saved records:', e);
    }
  };

  const saveCurrentGame = () => {
    try {
      const newRecord: SavedGameRecord = {
        id: `game-${Date.now()}`,
        title: recordTitle.trim() || `${state.awayTeam.name} vs ${state.homeTeam.name}`,
        date: new Date().toLocaleString(),
        awayTeamName: state.awayTeam.name,
        homeTeamName: state.homeTeam.name,
        awayScore: state.awayTeam.score,
        homeScore: state.homeTeam.score,
        totalInnings: state.inning,
        gameState: JSON.parse(JSON.stringify(state)),
        createdAt: Date.now(),
        notes: recordNotes.trim()
      };

      const updated = [newRecord, ...savedRecords];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setSavedRecords(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      console.error('Failed to save game record:', e);
    }
  };

  const deleteRecord = (id: string) => {
    if (confirm(language === 'zh' ? '確定要刪除這筆歷史紀錄嗎？' : 'Delete this record?')) {
      const updated = savedRecords.filter(r => r.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setSavedRecords(updated);
    }
  };

  const loadRecordToBoard = (record: SavedGameRecord) => {
    if (confirm(language === 'zh' ? '確定要將此場紀錄載入至計分板嗎？這將會取代當前比賽畫面。' : 'Load this game record to the scoreboard? This will replace current game.')) {
      dispatch({ type: 'REPLACE_STATE', state: record.gameState });
      onClose();
    }
  };

  // Compute player batting stats
  const getPlayerBattingStats = (p: Player) => {
    const atBats = p.atBats || [];
    let hits = p.hits ?? 0;
    let walks = p.walks ?? 0;
    let strikeouts = p.strikeouts ?? 0;
    let runs = p.runs ?? 0;
    let rbi = p.rbi ?? 0;

    // If explicit stats not provided, calculate from atBats history
    if (p.hits === undefined && atBats.length > 0) {
      hits = atBats.filter(ab => ab.includes('安') || ab.includes('HR') || ab.includes('全壘打') || ab.includes('1B') || ab.includes('2B') || ab.includes('3B')).length;
      walks = atBats.filter(ab => ab.includes('四球') || ab.includes('觸身') || ab.includes('保送') || ab.includes('BB') || ab.includes('HBP')).length;
      strikeouts = atBats.filter(ab => ab.includes('三振') || ab.includes('K') || ab.includes('SO')).length;
    }

    const nonAb = walks; // BB, HBP don't count towards AB
    const abCount = Math.max(hits, atBats.length - nonAb);
    const avg = abCount > 0 ? (hits / abCount).toFixed(3).replace(/^0\./, '.') : '.000';

    return {
      pa: atBats.length,
      ab: abCount,
      h: hits,
      r: runs,
      rbi: rbi,
      bb: walks,
      so: strikeouts,
      avg: p.avg || avg,
      atBats
    };
  };

  // Team totals
  const getTeamTotals = (team: Team) => {
    let totalAB = 0;
    let totalH = 0;
    let totalR = team.score;
    let totalRBI = 0;
    let totalBB = 0;
    let totalSO = 0;

    team.lineup.forEach(p => {
      const s = getPlayerBattingStats(p);
      totalAB += s.ab;
      totalH += s.h;
      totalRBI += s.rbi;
      totalBB += s.bb;
      totalSO += s.so;
    });

    return {
      ab: totalAB,
      r: totalR,
      h: totalH,
      rbi: totalRBI,
      bb: totalBB,
      so: totalSO,
      avg: totalAB > 0 ? (totalH / totalAB).toFixed(3).replace(/^0\./, '.') : '.000'
    };
  };

  // Apply edits to game state
  const handleApplyEdits = () => {
    dispatch({
      type: 'REPLACE_STATE',
      state: {
        ...state,
        awayTeam: editingAwayTeam,
        homeTeam: editingHomeTeam
      }
    });
    setIsSavedNotify(true);
    setTimeout(() => setIsSavedNotify(false), 2000);
  };

  // Update editing player
  const handleUpdateEditingPlayer = (
    team: 'away' | 'home', 
    type: 'lineup' | 'bench' | 'pitcher', 
    index: number, 
    field: keyof Player, 
    value: any
  ) => {
    const isAway = team === 'away';
    const setter = isAway ? setEditingAwayTeam : setEditingHomeTeam;

    setter(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      if (type === 'pitcher') {
        next.pitcher = { ...next.pitcher, [field]: value };
      } else if (type === 'lineup') {
        if (next.lineup[index]) {
          next.lineup[index] = { ...next.lineup[index], [field]: value };
        }
      } else if (type === 'bench') {
        if (next.bench[index]) {
          next.bench[index] = { ...next.bench[index], [field]: value };
        }
      }
      return next;
    });
  };

  // Add / Remove at-bat result in edit mode
  const handleAddAtBat = (team: 'away' | 'home', index: number, result: string) => {
    const isAway = team === 'away';
    const setter = isAway ? setEditingAwayTeam : setEditingHomeTeam;

    setter(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const player = next.lineup[index];
      if (player) {
        player.atBats = [...(player.atBats || []), result];
      }
      return next;
    });
  };

  const handleRemoveAtBat = (team: 'away' | 'home', playerIndex: number, abIndex: number) => {
    const isAway = team === 'away';
    const setter = isAway ? setEditingAwayTeam : setEditingHomeTeam;

    setter(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const player = next.lineup[playerIndex];
      if (player && player.atBats) {
        player.atBats = player.atBats.filter((_: any, i: number) => i !== abIndex);
      }
      return next;
    });
  };

  // Generate plain text Box Score for clipboard
  const generateTextReport = () => {
    const maxInnings = Math.max(9, state.awayTeam.inningScores.length, state.homeTeam.inningScores.length);
    const inningHeaders = Array.from({ length: maxInnings }, (_, i) => String(i + 1).padStart(2, ' ')).join(' ');
    
    const awayScores = Array.from({ length: maxInnings }, (_, i) => {
      const s = state.awayTeam.inningScores[i];
      return (s !== null && s !== undefined ? String(s) : '-').padStart(2, ' ');
    }).join(' ');

    const homeScores = Array.from({ length: maxInnings }, (_, i) => {
      const s = state.homeTeam.inningScores[i];
      return (s !== null && s !== undefined ? String(s) : '-').padStart(2, ' ');
    }).join(' ');

    const awayTotals = getTeamTotals(state.awayTeam);
    const homeTotals = getTeamTotals(state.homeTeam);

    let text = `========================================================\n`;
    text += `⚾ 棒球比賽攻守紀錄表 (BOX SCORE)\n`;
    text += `賽事：${recordTitle || `${state.awayTeam.name} vs ${state.homeTeam.name}`}\n`;
    text += `日期：${new Date().toLocaleDateString()} | 局數：第 ${state.inning} 局\n`;
    text += `--------------------------------------------------------\n`;
    text += `隊伍           ${inningHeaders} |  R  H  E\n`;
    text += `${state.awayTeam.name.padEnd(12, ' ')}  ${awayScores} | ${String(state.awayTeam.score).padStart(2, ' ')} ${String(state.awayTeam.hits).padStart(2, ' ')} ${String(state.awayTeam.errors).padStart(2, ' ')}\n`;
    text += `${state.homeTeam.name.padEnd(12, ' ')}  ${homeScores} | ${String(state.homeTeam.score).padStart(2, ' ')} ${String(state.homeTeam.hits).padStart(2, ' ')} ${String(state.homeTeam.errors).padStart(2, ' ')}\n`;
    text += `--------------------------------------------------------\n\n`;

    // Away Batting
    text += `【${state.awayTeam.name} 打擊成績】\n`;
    text += `棒次  背號  姓名        位置  AB  R  H RBI BB SO   AVG   打席結果\n`;
    state.awayTeam.lineup.forEach((p, idx) => {
      const s = getPlayerBattingStats(p);
      const order = String(idx + 1).padStart(2, ' ');
      const no = (p.number || '--').padStart(3, ' ');
      const name = (p.name || '---').padEnd(10, ' ');
      const pos = (p.position || 'DH').padEnd(4, ' ');
      const abStr = (s.atBats.length > 0 ? `[${s.atBats.join(', ')}]` : '-');
      text += ` ${order}   #${no}  ${name} ${pos}  ${String(s.ab).padStart(2, ' ')} ${String(s.r).padStart(2, ' ')} ${String(s.h).padStart(2, ' ')} ${String(s.rbi).padStart(2, ' ')}  ${String(s.bb).padStart(2, ' ')} ${String(s.so).padStart(2, ' ')}  ${s.avg}  ${abStr}\n`;
    });
    text += `團隊總計: AB: ${awayTotals.ab} | H: ${awayTotals.h} | R: ${awayTotals.r} | RBI: ${awayTotals.rbi} | BB: ${awayTotals.bb} | SO: ${awayTotals.so} | AVG: ${awayTotals.avg}\n\n`;

    // Away Pitching
    const ap = state.awayTeam.pitcher;
    text += `【${state.awayTeam.name} 投手成績】\n`;
    text += `#${ap.number || '--'} ${ap.name || '---'} | 局數: ${ap.inningsPitched || '0.0'} | 三振: ${ap.strikeouts || 0} | 球數: ${ap.pitchCount || ap.stat || 0}\n\n`;

    // Home Batting
    text += `【${state.homeTeam.name} 打擊成績】\n`;
    text += `棒次  背號  姓名        位置  AB  R  H RBI BB SO   AVG   打席結果\n`;
    state.homeTeam.lineup.forEach((p, idx) => {
      const s = getPlayerBattingStats(p);
      const order = String(idx + 1).padStart(2, ' ');
      const no = (p.number || '--').padStart(3, ' ');
      const name = (p.name || '---').padEnd(10, ' ');
      const pos = (p.position || 'DH').padEnd(4, ' ');
      const abStr = (s.atBats.length > 0 ? `[${s.atBats.join(', ')}]` : '-');
      text += ` ${order}   #${no}  ${name} ${pos}  ${String(s.ab).padStart(2, ' ')} ${String(s.r).padStart(2, ' ')} ${String(s.h).padStart(2, ' ')} ${String(s.rbi).padStart(2, ' ')}  ${String(s.bb).padStart(2, ' ')} ${String(s.so).padStart(2, ' ')}  ${s.avg}  ${abStr}\n`;
    });
    text += `團隊總計: AB: ${homeTotals.ab} | H: ${homeTotals.h} | R: ${homeTotals.r} | RBI: ${homeTotals.rbi} | BB: ${homeTotals.bb} | SO: ${homeTotals.so} | AVG: ${homeTotals.avg}\n\n`;

    // Home Pitching
    const hp = state.homeTeam.pitcher;
    text += `【${state.homeTeam.name} 投手成績】\n`;
    text += `#${hp.number || '--'} ${hp.name || '---'} | 局數: ${hp.inningsPitched || '0.0'} | 三振: ${hp.strikeouts || 0} | 球數: ${hp.pitchCount || hp.stat || 0}\n`;
    text += `========================================================\n`;

    return text;
  };

  const handleCopyTextReport = () => {
    const text = generateTextReport();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `baseball-record-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported && (imported.awayTeam || imported.homeTeam)) {
          dispatch({ type: 'REPLACE_STATE', state: imported });
          alert(language === 'zh' ? '成功匯入比賽紀錄！' : 'Game record successfully imported!');
          onClose();
        } else {
          alert(language === 'zh' ? '檔案格式不符' : 'Invalid file format');
        }
      } catch (err) {
        alert(language === 'zh' ? '無法解析 JSON 檔案' : 'Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  const currentDisplayTeam = activeTeamTab === 'away' ? state.awayTeam : state.homeTeam;
  const currentEditingTeam = activeTeamTab === 'away' ? editingAwayTeam : editingHomeTeam;
  const maxInnings = Math.max(9, state.awayTeam.inningScores.length, state.homeTeam.inningScores.length);
  const inningsArray = Array.from({ length: maxInnings }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-[250] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-slate-700/80 rounded-2xl w-full max-w-5xl h-[92vh] max-h-[900px] flex flex-col shadow-2xl overflow-hidden text-white">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>{language === 'zh' ? '比賽攻守紀錄表與數據管理' : language === 'ja' ? '試合スコアブックと選手記録' : 'Game Box Score & Player Records'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600/30 text-blue-300 border border-blue-500/40 font-mono">
                  v3.0 Records
                </span>
              </h2>
              <p className="text-xs text-slate-400 hidden sm:block">
                {language === 'zh' ? '即時彙整雙方攻守成績、修改個人數據、保存歷史比賽與一鍵匯出紀錄表' : 'View, edit, save game box scores and export clean records'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-4 sm:px-6 pt-2.5 pb-2 border-b border-slate-800/80 bg-slate-900/90 shrink-0 gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setActiveTab('boxscore')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'boxscore'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText size={15} />
              <span>{language === 'zh' ? '攻守紀錄表' : language === 'ja' ? 'ボックススコア' : 'Box Score'}</span>
            </button>

            <button
              onClick={() => setActiveTab('edit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'edit'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Edit2 size={15} />
              <span>{language === 'zh' ? '更改數據紀錄' : language === 'ja' ? '記録の変更' : 'Edit Records'}</span>
            </button>

            <button
              onClick={() => setActiveTab('archive')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'archive'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <History size={15} />
              <span>{language === 'zh' ? '存檔紀錄簿' : language === 'ja' ? '保存済み記録' : 'Saved Archive'}</span>
              {savedRecords.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">
                  {savedRecords.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('export')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'export'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Share2 size={15} />
              <span>{language === 'zh' ? '匯出整理與分享' : language === 'ja' ? '出力と共有' : 'Export & Share'}</span>
            </button>
          </div>

          {/* Quick Copy Button */}
          <button
            onClick={handleCopyTextReport}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer shrink-0 ${
              copied
                ? 'bg-emerald-900/50 border-emerald-500 text-emerald-300'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? (language === 'zh' ? '已複製純文字！' : 'Copied!') : (language === 'zh' ? '複製紀錄文字' : 'Copy Text')}</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
          
          {/* TAB 1: BOX SCORE VIEW */}
          {activeTab === 'boxscore' && (
            <div className="space-y-4">
              
              {/* Line Score (每局比分總表) */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-lg overflow-x-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Trophy size={14} className="text-yellow-400" />
                    <span>{language === 'zh' ? '比賽即時記分板 (Line Score)' : 'Game Line Score'}</span>
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {language === 'zh' ? `目前：${state.isTop ? '▲ 上半局' : '▼ 下半局'} 第 ${state.inning} 局` : `Current: ${state.isTop ? 'Top' : 'Bot'} Inning ${state.inning}`}
                  </span>
                </div>

                <table className="w-full text-center border-collapse text-xs sm:text-sm font-mono min-w-[500px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold">
                      <th className="py-1.5 px-3 text-left font-sans">{language === 'zh' ? '隊伍' : 'Team'}</th>
                      {inningsArray.map(inn => (
                        <th key={inn} className="py-1.5 px-2 font-bold w-8">{inn}</th>
                      ))}
                      <th className="py-1.5 px-3 font-black text-yellow-400 border-l border-slate-800 w-10">R</th>
                      <th className="py-1.5 px-3 font-bold text-sky-400 w-10">H</th>
                      <th className="py-1.5 px-3 font-bold text-rose-400 w-10">E</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Away Team Row */}
                    <tr className="border-b border-slate-800/60 font-bold hover:bg-slate-800/30">
                      <td className="py-2 px-3 text-left font-sans flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: state.awayTeam.color }} />
                        <span className="text-white font-bold">{state.awayTeam.name}</span>
                        {state.isTop && <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.2 rounded font-bold">攻</span>}
                      </td>
                      {inningsArray.map((_, i) => (
                        <td key={i} className="py-2 px-2 text-slate-300">
                          {state.awayTeam.inningScores[i] !== null && state.awayTeam.inningScores[i] !== undefined 
                            ? state.awayTeam.inningScores[i] 
                            : '-'}
                        </td>
                      ))}
                      <td className="py-2 px-3 font-black text-yellow-400 border-l border-slate-800 text-base">
                        {state.awayTeam.score}
                      </td>
                      <td className="py-2 px-3 font-bold text-sky-400 text-sm">
                        {state.awayTeam.hits}
                      </td>
                      <td className="py-2 px-3 font-bold text-rose-400 text-sm">
                        {state.awayTeam.errors}
                      </td>
                    </tr>

                    {/* Home Team Row */}
                    <tr className="font-bold hover:bg-slate-800/30">
                      <td className="py-2 px-3 text-left font-sans flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: state.homeTeam.color }} />
                        <span className="text-white font-bold">{state.homeTeam.name}</span>
                        {!state.isTop && <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.2 rounded font-bold">攻</span>}
                      </td>
                      {inningsArray.map((_, i) => (
                        <td key={i} className="py-2 px-2 text-slate-300">
                          {state.homeTeam.inningScores[i] !== null && state.homeTeam.inningScores[i] !== undefined 
                            ? state.homeTeam.inningScores[i] 
                            : '-'}
                        </td>
                      ))}
                      <td className="py-2 px-3 font-black text-yellow-400 border-l border-slate-800 text-base">
                        {state.homeTeam.score}
                      </td>
                      <td className="py-2 px-3 font-bold text-sky-400 text-sm">
                        {state.homeTeam.hits}
                      </td>
                      <td className="py-2 px-3 font-bold text-rose-400 text-sm">
                        {state.homeTeam.errors}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Team Selector & Pitcher Card */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTeamTab('away')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTeamTab === 'away'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: state.awayTeam.color }} />
                    <span>{state.awayTeam.name} {language === 'zh' ? '打線成績' : 'Batting'}</span>
                  </button>

                  <button
                    onClick={() => setActiveTeamTab('home')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTeamTab === 'home'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: state.homeTeam.color }} />
                    <span>{state.homeTeam.name} {language === 'zh' ? '打線成績' : 'Batting'}</span>
                  </button>
                </div>

                {/* Pitcher Summary Badge */}
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 px-3 py-1.5 rounded-lg text-xs font-mono">
                  <span className="text-slate-400 font-bold">{currentDisplayTeam.name} 投手:</span>
                  <span className="text-white font-bold">{currentDisplayTeam.pitcher.name || '---'} #{currentDisplayTeam.pitcher.number}</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-yellow-400 font-bold">局數: {currentDisplayTeam.pitcher.inningsPitched || '0.0'}</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-sky-300 font-bold">用球: {currentDisplayTeam.pitcher.pitchCount ?? (currentDisplayTeam.pitcher.stat || 0)}</span>
                </div>
              </div>

              {/* Batting Records Table */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-lg overflow-x-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-slate-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentDisplayTeam.color }} />
                    <span>{currentDisplayTeam.name} {language === 'zh' ? '全體球員攻守數據明細表' : 'Batting Box Score'}</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {language === 'zh' ? '點擊上方「更改數據紀錄」可直接編輯修正任何數據' : 'Switch to Edit tab to modify player stats'}
                  </span>
                </div>

                <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-mono font-bold text-center">
                      <th className="py-2 px-2 text-left font-sans w-12">{language === 'zh' ? '棒次' : 'Ord'}</th>
                      <th className="py-2 px-2 w-12 font-sans">{language === 'zh' ? '背號' : 'No.'}</th>
                      <th className="py-2 px-3 text-left font-sans">{language === 'zh' ? '選手姓名' : 'Name'}</th>
                      <th className="py-2 px-2 w-12 font-sans">{language === 'zh' ? '守備' : 'Pos'}</th>
                      <th className="py-2 px-2 w-12 font-bold">{language === 'zh' ? '打數' : 'AB'}</th>
                      <th className="py-2 px-2 w-12 font-bold">{language === 'zh' ? '得分' : 'R'}</th>
                      <th className="py-2 px-2 w-12 font-bold text-yellow-400">{language === 'zh' ? '安打' : 'H'}</th>
                      <th className="py-2 px-2 w-12 font-bold">{language === 'zh' ? '打點' : 'RBI'}</th>
                      <th className="py-2 px-2 w-12 font-bold text-sky-400">{language === 'zh' ? '四死' : 'BB'}</th>
                      <th className="py-2 px-2 w-12 font-bold text-rose-400">{language === 'zh' ? '三振' : 'SO'}</th>
                      <th className="py-2 px-3 w-16 font-bold text-amber-300">{language === 'zh' ? '打擊率' : 'AVG'}</th>
                      <th className="py-2 px-3 text-left font-sans">{language === 'zh' ? '打席結果歷程' : 'At-Bat Breakdown'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentDisplayTeam.lineup.map((p, idx) => {
                      const s = getPlayerBattingStats(p);
                      const isCurrentBatter = (state.isTop && activeTeamTab === 'away') || (!state.isTop && activeTeamTab === 'home') 
                        ? currentDisplayTeam.currentBatterIndex === idx 
                        : false;

                      return (
                        <tr 
                          key={p.id || idx} 
                          className={`border-b border-slate-800/60 font-mono text-center hover:bg-slate-800/40 transition-colors ${
                            isCurrentBatter ? 'bg-blue-950/40 border-l-2 border-l-blue-400' : ''
                          }`}
                        >
                          <td className="py-2 px-2 text-left font-bold text-slate-300">
                            {idx + 1}.
                          </td>
                          <td className="py-2 px-2 text-slate-400 font-bold">
                            #{p.number || '--'}
                          </td>
                          <td className="py-2 px-3 text-left font-sans font-bold text-white flex items-center gap-1.5">
                            <span>{p.name}</span>
                            {isCurrentBatter && (
                              <span className="text-[9px] bg-blue-500 text-white px-1 rounded font-bold">打擊中</span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-slate-400 font-sans font-bold">
                            {p.position || 'DH'}
                          </td>
                          <td className="py-2 px-2 font-bold text-slate-200">
                            {s.ab}
                          </td>
                          <td className="py-2 px-2 font-bold text-slate-200">
                            {s.r}
                          </td>
                          <td className="py-2 px-2 font-bold text-yellow-400">
                            {s.h}
                          </td>
                          <td className="py-2 px-2 font-bold text-slate-200">
                            {s.rbi}
                          </td>
                          <td className="py-2 px-2 font-bold text-sky-400">
                            {s.bb}
                          </td>
                          <td className="py-2 px-2 font-bold text-rose-400">
                            {s.so}
                          </td>
                          <td className="py-2 px-3 font-bold text-amber-300">
                            {s.avg}
                          </td>
                          <td className="py-2 px-3 text-left">
                            <div className="flex flex-wrap items-center gap-1 font-sans">
                              {s.atBats.length === 0 ? (
                                <span className="text-slate-500 text-xs">-</span>
                              ) : (
                                s.atBats.map((ab, abIdx) => (
                                  <span 
                                    key={abIdx} 
                                    className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-slate-800 border border-slate-700 text-slate-300 shadow-sm"
                                  >
                                    {ab}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Team Total Row */}
                    {(() => {
                      const totals = getTeamTotals(currentDisplayTeam);
                      return (
                        <tr className="bg-slate-900/90 font-mono font-bold text-center border-t-2 border-slate-700">
                          <td colSpan={4} className="py-2.5 px-3 text-left font-sans font-black text-yellow-400">
                            {language === 'zh' ? '團隊合計 (TOTALS)' : 'TEAM TOTALS'}
                          </td>
                          <td className="py-2.5 px-2 text-white">{totals.ab}</td>
                          <td className="py-2.5 px-2 text-white">{totals.r}</td>
                          <td className="py-2.5 px-2 text-yellow-400">{totals.h}</td>
                          <td className="py-2.5 px-2 text-white">{totals.rbi}</td>
                          <td className="py-2.5 px-2 text-sky-400">{totals.bb}</td>
                          <td className="py-2.5 px-2 text-rose-400">{totals.so}</td>
                          <td className="py-2.5 px-3 text-amber-300">{totals.avg}</td>
                          <td className="py-2.5 px-3 text-left text-slate-400 text-xs font-sans">
                            {currentDisplayTeam.lineup.length} 位打者出賽
                          </td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Pitching Summary Table */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-lg overflow-x-auto">
                <div className="text-xs font-black text-slate-300 mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentDisplayTeam.color }} />
                  <span>{currentDisplayTeam.name} {language === 'zh' ? '投手投球成績' : 'Pitching Records'}</span>
                </div>

                <table className="w-full text-center border-collapse text-xs sm:text-sm font-mono min-w-[600px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold">
                      <th className="py-2 px-3 text-left font-sans">{language === 'zh' ? '投手姓名' : 'Pitcher'}</th>
                      <th className="py-2 px-2">{language === 'zh' ? '背號' : 'No.'}</th>
                      <th className="py-2 px-2 text-yellow-400">{language === 'zh' ? '投球局數' : 'IP'}</th>
                      <th className="py-2 px-2 text-sky-400">{language === 'zh' ? '用球數' : 'NP'}</th>
                      <th className="py-2 px-2 text-rose-400">{language === 'zh' ? '奪三振' : 'SO'}</th>
                      <th className="py-2 px-2">{language === 'zh' ? '被安打' : 'H'}</th>
                      <th className="py-2 px-2">{language === 'zh' ? '失分' : 'R'}</th>
                      <th className="py-2 px-2">{language === 'zh' ? '責失' : 'ER'}</th>
                      <th className="py-2 px-2">{language === 'zh' ? '四死球' : 'BB'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-800/60 font-bold hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 text-left font-sans text-white font-bold flex items-center gap-2">
                        <span>{currentDisplayTeam.pitcher.name || '---'}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">P</span>
                      </td>
                      <td className="py-2.5 px-2 text-slate-400">#{currentDisplayTeam.pitcher.number || '--'}</td>
                      <td className="py-2.5 px-2 text-yellow-400 font-black">{currentDisplayTeam.pitcher.inningsPitched || '0.0'}</td>
                      <td className="py-2.5 px-2 text-sky-300 font-bold">{currentDisplayTeam.pitcher.pitchCount ?? (currentDisplayTeam.pitcher.stat || 0)}</td>
                      <td className="py-2.5 px-2 text-rose-400 font-bold">{currentDisplayTeam.pitcher.strikeouts || 0}</td>
                      <td className="py-2.5 px-2 text-slate-300">{currentDisplayTeam.pitcher.hitsAllowed || 0}</td>
                      <td className="py-2.5 px-2 text-slate-300">{currentDisplayTeam.pitcher.runsAllowed || 0}</td>
                      <td className="py-2.5 px-2 text-slate-300">{currentDisplayTeam.pitcher.earnedRuns || 0}</td>
                      <td className="py-2.5 px-2 text-slate-300">{currentDisplayTeam.pitcher.walks || 0}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: EDIT RECORDS (更改球員與攻守紀錄) */}
          {activeTab === 'edit' && (
            <div className="space-y-4">
              
              {/* Top Banner with Save Action */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-amber-950/40 border border-amber-500/50 p-3 sm:p-4 rounded-xl">
                <div>
                  <h3 className="font-bold text-amber-300 text-sm flex items-center gap-2">
                    <Edit2 size={16} />
                    <span>{language === 'zh' ? '即時更改選手數據紀錄' : 'Edit Player Statistics'}</span>
                  </h3>
                  <p className="text-xs text-amber-200/80 mt-0.5">
                    {language === 'zh' ? '在此可直接手動微調任何選手的姓名、背號、打數、得分、安打、打點、打席結果歷程與投手用球數' : 'Modify player names, numbers, AB, H, R, RBI, and at-bat results here.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleApplyEdits}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black shadow-lg transition-all cursor-pointer ${
                      isSavedNotify
                        ? 'bg-emerald-600 text-white shadow-emerald-900/40'
                        : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/40 active:scale-95'
                    }`}
                  >
                    {isSavedNotify ? <Check size={16} /> : <Save size={16} />}
                    <span>{isSavedNotify ? (language === 'zh' ? '已儲存生效！' : 'Saved!') : (language === 'zh' ? '保存更改至比賽' : 'Save Changes')}</span>
                  </button>
                </div>
              </div>

              {/* Team Selector in Edit Mode */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTeamTab('away')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTeamTab === 'away'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: editingAwayTeam.color }} />
                  <span>{editingAwayTeam.name} (客隊)</span>
                </button>

                <button
                  onClick={() => setActiveTeamTab('home')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTeamTab === 'home'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: editingHomeTeam.color }} />
                  <span>{editingHomeTeam.name} (主隊)</span>
                </button>
              </div>

              {/* Pitcher Editor Card */}
              <div className="bg-slate-950/80 border border-slate-800 p-3 sm:p-4 rounded-xl space-y-3">
                <div className="font-bold text-xs text-slate-300 flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5">
                    <User size={14} className="text-yellow-400" />
                    <span>{currentEditingTeam.name} 投手數據修改</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">PITCHER</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs font-mono">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">姓名</label>
                    <input 
                      type="text" 
                      value={currentEditingTeam.pitcher.name || ''} 
                      onChange={(e) => handleUpdateEditingPlayer(activeTeamTab, 'pitcher', 0, 'name', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 px-2 py-1.5 rounded text-white font-sans font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">背號</label>
                    <input 
                      type="text" 
                      value={currentEditingTeam.pitcher.number || ''} 
                      onChange={(e) => handleUpdateEditingPlayer(activeTeamTab, 'pitcher', 0, 'number', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 px-2 py-1.5 rounded text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">投球局數 (IP)</label>
                    <input 
                      type="text" 
                      value={currentEditingTeam.pitcher.inningsPitched || ''} 
                      placeholder="e.g. 5.1"
                      onChange={(e) => handleUpdateEditingPlayer(activeTeamTab, 'pitcher', 0, 'inningsPitched', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 px-2 py-1.5 rounded text-yellow-400 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">用球數 (NP)</label>
                    <input 
                      type="number" 
                      value={currentEditingTeam.pitcher.pitchCount ?? (currentEditingTeam.pitcher.stat || 0)} 
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0;
                        handleUpdateEditingPlayer(activeTeamTab, 'pitcher', 0, 'pitchCount', val);
                        handleUpdateEditingPlayer(activeTeamTab, 'pitcher', 0, 'stat', String(val));
                      }}
                      className="w-full bg-slate-900 border border-slate-700 px-2 py-1.5 rounded text-sky-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">奪三振 (K)</label>
                    <input 
                      type="number" 
                      value={currentEditingTeam.pitcher.strikeouts || 0} 
                      onChange={(e) => handleUpdateEditingPlayer(activeTeamTab, 'pitcher', 0, 'strikeouts', parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 px-2 py-1.5 rounded text-rose-400 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">失分 (R)</label>
                    <input 
                      type="number" 
                      value={currentEditingTeam.pitcher.runsAllowed || 0} 
                      onChange={(e) => handleUpdateEditingPlayer(activeTeamTab, 'pitcher', 0, 'runsAllowed', parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 px-2 py-1.5 rounded text-slate-200 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Lineup Players Edit List */}
              <div className="bg-slate-950/80 border border-slate-800 p-3 sm:p-4 rounded-xl space-y-3">
                <div className="font-bold text-xs text-slate-300 flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5">
                    <ListOrdered size={14} className="text-blue-400" />
                    <span>{currentEditingTeam.name} 先發打線個別選手修改 ({currentEditingTeam.lineup.length} 人)</span>
                  </span>
                  <span className="text-[11px] text-slate-400">可修改數值與增減打席結果</span>
                </div>

                <div className="space-y-3">
                  {currentEditingTeam.lineup.map((p, idx) => {
                    const stats = getPlayerBattingStats(p);
                    return (
                      <div 
                        key={p.id || idx} 
                        className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl space-y-2.5 hover:border-slate-700 transition-colors"
                      >
                        {/* Row 1: Player Profile & Quick Numbers */}
                        <div className="grid grid-cols-2 sm:grid-cols-12 gap-2 text-xs items-center font-mono">
                          <div className="sm:col-span-1 font-bold text-slate-400 text-center">
                            第 {idx + 1} 棒
                          </div>
                          <div className="sm:col-span-3">
                            <input 
                              type="text" 
                              value={p.name} 
                              onChange={(e) => handleUpdateEditingPlayer(activeTeamTab, 'lineup', idx, 'name', e.target.value)}
                              placeholder="選手姓名"
                              className="w-full bg-slate-950 border border-slate-700 px-2 py-1 rounded text-white font-sans font-bold"
                            />
                          </div>
                          <div className="sm:col-span-2 flex items-center gap-1">
                            <span className="text-slate-400 text-[10px]">#</span>
                            <input 
                              type="text" 
                              value={p.number || ''} 
                              onChange={(e) => handleUpdateEditingPlayer(activeTeamTab, 'lineup', idx, 'number', e.target.value)}
                              placeholder="背號"
                              className="w-12 bg-slate-950 border border-slate-700 px-1.5 py-1 rounded text-white font-bold text-center"
                            />
                            <input 
                              type="text" 
                              value={p.position || 'DH'} 
                              onChange={(e) => handleUpdateEditingPlayer(activeTeamTab, 'lineup', idx, 'position', e.target.value)}
                              placeholder="守備"
                              className="w-12 bg-slate-950 border border-slate-700 px-1.5 py-1 rounded text-slate-300 font-sans text-center"
                            />
                          </div>
                          
                          {/* Quick Stats Edit */}
                          <div className="sm:col-span-6 flex flex-wrap items-center gap-2 justify-end">
                            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                              <span className="text-[10px] text-slate-400">得</span>
                              <input 
                                type="number" 
                                value={p.runs || 0} 
                                onChange={(e) => handleUpdateEditingPlayer(activeTeamTab, 'lineup', idx, 'runs', parseInt(e.target.value, 10) || 0)}
                                className="w-8 bg-transparent text-white font-bold text-center outline-none" 
                              />
                            </div>
                            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                              <span className="text-[10px] text-yellow-400">安</span>
                              <input 
                                type="number" 
                                value={p.hits !== undefined ? p.hits : stats.h} 
                                onChange={(e) => handleUpdateEditingPlayer(activeTeamTab, 'lineup', idx, 'hits', parseInt(e.target.value, 10) || 0)}
                                className="w-8 bg-transparent text-yellow-400 font-bold text-center outline-none" 
                              />
                            </div>
                            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                              <span className="text-[10px] text-slate-400">點</span>
                              <input 
                                type="number" 
                                value={p.rbi || 0} 
                                onChange={(e) => handleUpdateEditingPlayer(activeTeamTab, 'lineup', idx, 'rbi', parseInt(e.target.value, 10) || 0)}
                                className="w-8 bg-transparent text-white font-bold text-center outline-none" 
                              />
                            </div>
                            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                              <span className="text-[10px] text-sky-400">保</span>
                              <input 
                                type="number" 
                                value={p.walks !== undefined ? p.walks : stats.bb} 
                                onChange={(e) => handleUpdateEditingPlayer(activeTeamTab, 'lineup', idx, 'walks', parseInt(e.target.value, 10) || 0)}
                                className="w-8 bg-transparent text-sky-400 font-bold text-center outline-none" 
                              />
                            </div>
                            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                              <span className="text-[10px] text-rose-400">K</span>
                              <input 
                                type="number" 
                                value={p.strikeouts !== undefined ? p.strikeouts : stats.so} 
                                onChange={(e) => handleUpdateEditingPlayer(activeTeamTab, 'lineup', idx, 'strikeouts', parseInt(e.target.value, 10) || 0)}
                                className="w-8 bg-transparent text-rose-400 font-bold text-center outline-none" 
                              />
                            </div>
                          </div>
                        </div>

                        {/* Row 2: At-Bat History Management */}
                        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-xs">
                          <span className="text-[10px] font-bold text-slate-500 font-sans mr-1">打席紀錄:</span>
                          {(p.atBats || []).map((ab, abIdx) => (
                            <span 
                              key={abIdx} 
                              className="group/badge inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold"
                            >
                              <span>{ab}</span>
                              <button 
                                onClick={() => handleRemoveAtBat(activeTeamTab, idx, abIdx)}
                                className="text-slate-500 hover:text-red-400 transition-colors ml-0.5 cursor-pointer"
                                title="刪除此打席"
                              >
                                ×
                              </button>
                            </span>
                          ))}

                          {/* Quick Add At-Bat Outcome Buttons */}
                          <div className="inline-flex items-center gap-1 ml-auto">
                            <span className="text-[10px] text-slate-500 font-sans">+新增:</span>
                            {['一安', '二安', '三安', 'HR', '四球', '三振', '出局'].map(outcome => (
                              <button
                                key={outcome}
                                onClick={() => handleAddAtBat(activeTeamTab, idx, outcome)}
                                className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded border border-slate-700 cursor-pointer active:scale-95"
                              >
                                {outcome}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ARCHIVE & SAVED RECORDS (儲存與歷史紀錄管理) */}
          {activeTab === 'archive' && (
            <div className="space-y-4">
              
              {/* Save Current Game Box */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-3 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Save size={16} className="text-emerald-400" />
                    <span>{language === 'zh' ? '將當前比賽儲存為歷史紀錄' : 'Save Current Game to Archive'}</span>
                  </h3>
                  {saveSuccess && (
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={14} />
                      <span>{language === 'zh' ? '已成功儲存！' : 'Saved successfully!'}</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      {language === 'zh' ? '紀錄標題 / 賽事名稱' : 'Record Title'}
                    </label>
                    <input 
                      type="text" 
                      value={recordTitle} 
                      onChange={(e) => setRecordTitle(e.target.value)}
                      placeholder="例：2026/10/01 週末友誼賽 G1"
                      className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg text-sm text-white font-bold outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      {language === 'zh' ? '備註說明 (選填)' : 'Notes (Optional)'}
                    </label>
                    <input 
                      type="text" 
                      value={recordNotes} 
                      onChange={(e) => setRecordNotes(e.target.value)}
                      placeholder="例：九局下再見全壘打"
                      className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg text-sm text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={saveCurrentGame}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/40 active:scale-95 transition-all cursor-pointer"
                  >
                    <Save size={15} />
                    <span>{language === 'zh' ? '保存此場紀錄' : 'Save Game Record'}</span>
                  </button>
                </div>
              </div>

              {/* Saved Records List */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-3 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <History size={16} className="text-blue-400" />
                    <span>{language === 'zh' ? '已儲存之歷史比賽紀錄' : 'Saved Game Archives'}</span>
                    <span className="text-xs font-mono text-slate-400">({savedRecords.length} 場)</span>
                  </h3>
                </div>

                {savedRecords.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs">
                    <p className="text-2xl mb-2">📋</p>
                    <p>{language === 'zh' ? '目前尚無儲存的歷史紀錄，可點擊上方「保存此場紀錄」將比賽存檔。' : 'No saved records yet.'}</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {savedRecords.map(rec => (
                      <div 
                        key={rec.id} 
                        className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-3 sm:p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="font-bold text-white text-sm flex items-center gap-2">
                            <span>{rec.title}</span>
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                              第 {rec.totalInnings} 局
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-3 font-mono">
                            <span className="text-white font-bold">
                              {rec.awayTeamName} {rec.awayScore} : {rec.homeScore} {rec.homeTeamName}
                            </span>
                            <span>·</span>
                            <span>{rec.date}</span>
                            {rec.notes && (
                              <>
                                <span>·</span>
                                <span className="text-slate-500 font-sans italic">{rec.notes}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <button
                            onClick={() => loadRecordToBoard(rec)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95"
                            title="載入這場比賽至計分板"
                          >
                            <RotateCcw size={13} />
                            <span>{language === 'zh' ? '載入至計分板' : 'Load Game'}</span>
                          </button>

                          <button
                            onClick={() => deleteRecord(rec.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                            title="刪除此紀錄"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: EXPORT & SHARE (整理紀錄表、複製純文字與 JSON 備份) */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              
              {/* Quick Actions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* 1. Copy Plain Text Box Score */}
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex flex-col justify-between space-y-3">
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2">
                      <Copy size={16} />
                    </div>
                    <h4 className="font-bold text-white text-sm">
                      {language === 'zh' ? '一鍵複製純文字紀錄表' : 'Copy Plain Text Box Score'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {language === 'zh' ? '整理為排版工整之文字成績表，適合直接貼在 LINE 群組或社群軟體。' : 'Formatted for messaging apps and social media.'}
                    </p>
                  </div>
                  <button
                    onClick={handleCopyTextReport}
                    className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      copied 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'
                    }`}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? (language === 'zh' ? '已複製到剪貼簿！' : 'Copied!') : (language === 'zh' ? '複製文字紀錄' : 'Copy Box Score')}</span>
                  </button>
                </div>

                {/* 2. Download JSON Backup */}
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex flex-col justify-between space-y-3">
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                      <Download size={16} />
                    </div>
                    <h4 className="font-bold text-white text-sm">
                      {language === 'zh' ? '匯出 JSON 紀錄備份' : 'Export JSON Backup'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {language === 'zh' ? '完整將比賽陣容、數據與分數導出為檔案，可隨時重新匯入。' : 'Save complete game dataset as a downloadable file.'}
                    </p>
                  </div>
                  <button
                    onClick={handleExportJson}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    <Download size={14} />
                    <span>{language === 'zh' ? '下載 JSON 檔' : 'Download JSON'}</span>
                  </button>
                </div>

                {/* 3. Import JSON File */}
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex flex-col justify-between space-y-3">
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center mb-2">
                      <Upload size={16} />
                    </div>
                    <h4 className="font-bold text-white text-sm">
                      {language === 'zh' ? '匯入 JSON 紀錄檔案' : 'Import JSON Record'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {language === 'zh' ? '載入先前備份的比賽紀錄檔案至計分板。' : 'Restore a previously exported game record.'}
                    </p>
                  </div>
                  <label className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 text-center">
                    <Upload size={14} />
                    <span>{language === 'zh' ? '選擇檔案匯入' : 'Upload File'}</span>
                    <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Text Preview Box */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <FileText size={14} />
                    <span>{language === 'zh' ? '文字紀錄表預覽 (Text Preview)' : 'Text Report Preview'}</span>
                  </span>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <Printer size={13} />
                    <span>{language === 'zh' ? '列印 / 存為 PDF' : 'Print / Save PDF'}</span>
                  </button>
                </div>

                <pre className="w-full bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre leading-relaxed select-text">
                  {generateTextReport()}
                </pre>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between shrink-0 text-xs">
          <span className="text-slate-500">
            {language === 'zh' ? '支援完整先發、替補、各局得分、局數打擊歷程與投手數據整理' : 'Supports complete box scores, lineup stats, and archives.'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            {language === 'zh' ? '關閉' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
