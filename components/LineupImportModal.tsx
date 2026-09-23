import React, { useState, useEffect } from 'react';
import { X, Check, FileText, Trash2, RotateCcw } from 'lucide-react';
import { Player } from '../types';
import { parseLineupText } from '../utils/parseLineupText';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (players: Player[]) => void;
  language?: 'en' | 'zh' | 'ja';
  currentPlayers?: Player[];
}

export const LineupImportModal: React.FC<Props> = ({ isOpen, onClose, onImport, language = 'zh', currentPlayers = [] }) => {
  const [text, setText] = useState('');
  const [previewData, setPreviewData] = useState<Partial<Player>[]>([]);
  const [previewTab, setPreviewTab] = useState<'import' | 'current'>('import');
  const [localCurrentPlayers, setLocalCurrentPlayers] = useState<Player[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  
  useEffect(() => {
    if (isOpen) {
      setLocalCurrentPlayers(currentPlayers || []);
      setPreviewTab('import');
      setSelectedPlayerIds([]);
    }
  }, [isOpen, currentPlayers]);

  const handleToggleSelectAll = () => {
    if (selectedPlayerIds.length === localCurrentPlayers.length && localCurrentPlayers.length > 0) {
      setSelectedPlayerIds([]);
    } else {
      setSelectedPlayerIds(localCurrentPlayers.map(p => p.id));
    }
  };

  const handleToggleSelectPlayer = (id: string) => {
    setSelectedPlayerIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedPlayerIds.length === 0) return;
    const msg = language === 'en' 
      ? `Delete ${selectedPlayerIds.length} selected player(s)?` 
      : language === 'zh' 
      ? `確定要刪除選取的 ${selectedPlayerIds.length} 位球員嗎？` 
      : `選択した${selectedPlayerIds.length}名の選手を削除しますか？`;
    if (confirm(msg)) {
      setLocalCurrentPlayers(prev => prev.filter(p => !selectedPlayerIds.includes(p.id)));
      setSelectedPlayerIds([]);
    }
  };

  const handleUpdateCurrent = (index: number, field: keyof Player, value: string) => {
    setLocalCurrentPlayers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveCurrentRow = (index: number) => {
    const removedPlayer = localCurrentPlayers[index];
    if (removedPlayer) {
      setSelectedPlayerIds(prev => prev.filter(id => id !== removedPlayer.id));
    }
    setLocalCurrentPlayers(prev => prev.filter((_, idx) => idx !== index));
  };

  useEffect(() => {
    if (isOpen) {
      setText('');
      setPreviewData([]);
    }
  }, [isOpen]);

  const handleTextChange = (val: string) => {
    setText(val);
    if (val.trim()) {
      const parsed = parseLineupText(val);
      setPreviewData(parsed);
    } else {
      setPreviewData([]);
    }
  };

  const handleParse = () => {
    const parsed = parseLineupText(text);
    setPreviewData(parsed);
  };

  const handleClear = () => {
    setText('');
    setPreviewData([]);
  };

  const handleUpdatePreview = (index: number, field: keyof Player, value: string) => {
    const newData = [...previewData];
    newData[index] = { ...newData[index], [field]: value };
    setPreviewData(newData);
  };

  const handleRemoveRow = (index: number) => {
    setPreviewData(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleImportReplace = () => {
    if (confirm(language === 'en' ? 'Are you sure you want to clear the current lineup and import?' : language === 'zh' ? '確定要清空現有名單並匯入嗎？' : '現在のラインナップをクリアしてインポートしますか？')) {
      const players: Player[] = previewData.map((p, index) => ({
        id: Math.random().toString(36).substring(2, 9),
        name: p.name || `Player ${index + 1}`,
        number: p.number || '00',
        stat: p.stat || p.avg || '.000',
        position: p.position || 'DH'
      }));
      onImport(players);
      setPreviewData([]);
      setText('');
      onClose();
    }
  };

  const handleImportAppend = () => {
    const isSaveOnly = previewData.length === 0;
    const msg = isSaveOnly 
      ? (language === 'en' ? 'Save changes to current lineup?' : language === 'zh' ? '確定要儲存變更嗎？' : '変更を保存しますか？')
      : (language === 'en' ? 'Append these players to the current lineup?' : language === 'zh' ? '確定要直接接續現有名單並匯入嗎？' : '現在のラインナップに追加してインポートしますか？');
      
    if (confirm(msg)) {
      const players: Player[] = previewData.map((p, index) => ({
        id: Math.random().toString(36).substring(2, 9),
        name: p.name || `Player ${index + 1}`,
        number: p.number || '00',
        stat: p.stat || p.avg || '.000',
        position: p.position || 'DH'
      }));
      onImport([...localCurrentPlayers, ...players]);
      setPreviewData([]);
      setText('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-3 sm:p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-3.5 border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="text-blue-400" size={20} />
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {language === 'en' ? 'Paste Import Lineup' : language === 'zh' ? '貼上匯入打線' : 'ラインナップの貼り付けとインポート'}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content: Top & Bottom stacked layout (上下排版) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4 min-h-0">
          
          {/* Top Section: Text input area (輸入框) */}
          <div className="flex flex-col gap-2 shrink-0">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                <span>{language === 'en' ? 'Paste Lineup Text' : language === 'zh' ? '貼上打線文字' : 'ラインナップテキストを貼り付ける'}</span>
              </label>
              {text && (
                <button 
                  onClick={handleClear}
                  className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw size={12} />
                  {language === 'en' ? 'Clear' : language === 'zh' ? '清空' : 'クリア'}
                </button>
              )}
            </div>
            
            <textarea 
              className="w-full h-32 sm:h-36 bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono text-sm resize-none shadow-inner transition-colors"
              placeholder={
                language === 'en' 
                  ? "1.DH Ohtani 17 0.310\n2 RF 99 Judge .331\nSS Jeter #2" 
                  : language === 'zh' 
                  ? "1. 1B 彭政閔 23 0.391\n2 CF 24 陳傑憲 .362\nDH 張育成 99\n遊 江坤宇 #90" 
                  : "1. DH 大谷 16 0.310\n2 右 イチロー 51 .372\nサード 長嶋 3\nPH 村上 #55\nP 11 ダルビッシュ"
              }
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
            />
            
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>{language === 'en' ? 'Supports all formats: Chinese / English positions, numbers, names, batting averages. Delimiters: newline, full-width comma (，), enumeration comma (、), semicolon (;).' : language === 'zh' ? '支援自動識別：中英文守備位置、背號、姓名、打擊率（支援換行、全形逗號、頓號、分號分隔）' : '漢英表記の守備位置、背番号、選手名、打率（改行、読点「、」「，」、セミコロンに対応）'}</span>
              <button 
                onClick={handleParse}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-1.5 rounded text-xs transition-colors shrink-0 ml-2"
              >
                {language === 'en' ? 'Re-parse' : language === 'zh' ? '重新解析' : '再解析'}
              </button>
            </div>
          </div>

          {/* Bottom Section: Preview area (預覽處) */}
          <div className="flex-1 flex flex-col min-h-[220px]">
            <div className="flex justify-between items-center border-b border-slate-700 mb-2 w-full gap-2">
              <div className="flex flex-1">
                <button 
                  onClick={() => setPreviewTab('import')} 
                  className={`flex-1 py-2 text-sm font-bold uppercase transition-colors ${previewTab === 'import' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                >
                  {language === 'en' ? 'Preview Import' : language === 'zh' ? '匯入預覽' : 'プレビュー'}
                  <span className="ml-1 text-xs font-normal">({previewData.length})</span>
                </button>
                <button 
                  onClick={() => setPreviewTab('current')} 
                  className={`flex-1 py-2 text-sm font-bold uppercase transition-colors ${previewTab === 'current' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                >
                  {language === 'en' ? 'Current Players' : language === 'zh' ? '現有名單' : '現在の選手'}
                  <span className="ml-1 text-xs font-normal">({localCurrentPlayers.length})</span>
                </button>
              </div>
              {previewTab === 'current' && selectedPlayerIds.length > 0 && (
                <div className="shrink-0 py-1">
                  <button
                    onClick={handleBulkDelete}
                    className="px-2.5 py-1 bg-red-600/90 hover:bg-red-600 text-white font-semibold text-xs rounded shadow flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>
                      {language === 'en' 
                        ? `Delete Selected (${selectedPlayerIds.length})` 
                        : language === 'zh' 
                        ? `刪除所選 (${selectedPlayerIds.length})` 
                        : `選択削除 (${selectedPlayerIds.length})`}
                    </span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 bg-slate-900 border border-slate-700 rounded-lg overflow-x-auto overflow-y-auto shadow-inner">
              <table className="w-full text-left text-sm text-slate-300 min-w-[560px]">
                <thead className="text-xs uppercase bg-slate-800/90 text-slate-400 sticky top-0 backdrop-blur z-10 border-b border-slate-700 select-none">
                  <tr>
                    {previewTab === 'current' && (
                      <th className="px-2 py-2.5 w-10 text-center shrink-0">
                        <input
                          type="checkbox"
                          checked={localCurrentPlayers.length > 0 && selectedPlayerIds.length === localCurrentPlayers.length}
                          onChange={handleToggleSelectAll}
                          className="w-4 h-4 rounded text-blue-600 accent-blue-600 bg-slate-800 border-slate-600 cursor-pointer align-middle"
                          title={language === 'en' ? 'Select All' : language === 'zh' ? '全選' : 'すべて選択'}
                        />
                      </th>
                    )}
                    <th className="px-2 py-2.5 w-10 text-center shrink-0">#</th>
                    <th className="px-2 py-2.5 w-16 sm:w-20 text-center shrink-0">
                      {language === 'en' ? 'POS' : language === 'zh' ? '守備' : '守備'}
                    </th>
                    <th className="px-2 py-2.5 w-16 sm:w-20 text-center shrink-0">
                      {language === 'en' ? 'NO.' : language === 'zh' ? '背號' : '背番号'}
                    </th>
                    <th className="px-2 py-2.5 min-w-[150px] sm:min-w-[180px]">
                      {language === 'en' ? 'NAME' : language === 'zh' ? '姓名' : '選手名'}
                    </th>
                    <th className="px-2 py-2.5 w-20 sm:w-24 text-center shrink-0">
                      {language === 'en' ? 'AVG' : language === 'zh' ? '打擊率' : '打率'}
                    </th>
                    <th className="px-2 py-2.5 w-10 sm:w-12 text-center shrink-0"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {previewTab === 'current' ? (
                    localCurrentPlayers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-500">
                          {language === 'en' 
                            ? 'No players imported yet' 
                            : language === 'zh' 
                            ? '目前沒有任何球員' 
                            : '選手はいません'}
                        </td>
                      </tr>
                    ) : localCurrentPlayers.map((p, idx) => {
                      const isSelected = selectedPlayerIds.includes(p.id);
                      return (
                        <tr 
                          key={p.id || idx} 
                          className={`hover:bg-slate-800/40 transition-colors ${isSelected ? 'bg-blue-900/30' : ''}`}
                        >
                          <td className="px-2 py-1.5 text-center shrink-0">
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => handleToggleSelectPlayer(p.id)}
                              className="w-4 h-4 rounded text-blue-600 accent-blue-600 bg-slate-800 border-slate-600 cursor-pointer align-middle"
                            />
                          </td>
                          <td className="px-2 py-1.5 text-center font-bold text-slate-500 shrink-0">{idx + 1}</td>
                          <td className="px-1.5 py-1.5 shrink-0">
                            <input 
                              type="text" 
                              className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500 text-center font-semibold uppercase"
                              value={p.position || ''}
                              onChange={(e) => handleUpdateCurrent(idx, 'position', e.target.value)}
                              placeholder="POS"
                            />
                          </td>
                          <td className="px-1.5 py-1.5 shrink-0">
                            <input 
                              type="text" 
                              className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500 font-mono text-center"
                              value={p.number || ''}
                              onChange={(e) => handleUpdateCurrent(idx, 'number', e.target.value)}
                              placeholder="00"
                            />
                          </td>
                          <td className="px-1.5 py-1.5 min-w-[150px] sm:min-w-[180px]">
                            <input 
                              type="text" 
                              className="w-full min-w-[140px] bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500 font-medium"
                              value={p.name || ''}
                              onChange={(e) => handleUpdateCurrent(idx, 'name', e.target.value)}
                              placeholder="Name"
                            />
                          </td>
                          <td className="px-1.5 py-1.5 shrink-0">
                            <input 
                              type="text" 
                              className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500 font-mono text-center"
                              value={p.stat || ''}
                              onChange={(e) => handleUpdateCurrent(idx, 'stat', e.target.value)}
                              placeholder=".000"
                            />
                          </td>
                          <td className="px-1.5 py-1.5 text-center shrink-0">
                            <button 
                              onClick={() => handleRemoveCurrentRow(idx)}
                              className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-800 transition-colors"
                              title="Remove row"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    previewData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-500">
                          {language === 'en' 
                            ? 'Paste lineup text above to preview' 
                            : language === 'zh' 
                            ? '請於上方輸入框貼上文字，系統將自動解析預覽' 
                            : '上の入力欄にテキストを貼り付けると自動プレビューされます'}
                        </td>
                      </tr>
                    ) : previewData.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-2 py-1.5 text-center font-bold text-slate-500 shrink-0">{idx + 1}</td>
                      <td className="px-1.5 py-1.5 shrink-0">
                        <input 
                          type="text" 
                          className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500 text-center font-semibold uppercase"
                          value={p.position || ''}
                          onChange={(e) => handleUpdatePreview(idx, 'position', e.target.value)}
                          placeholder="POS"
                        />
                      </td>
                      <td className="px-1.5 py-1.5 shrink-0">
                        <input 
                          type="text" 
                          className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500 font-mono text-center"
                          value={p.number || ''}
                          onChange={(e) => handleUpdatePreview(idx, 'number', e.target.value)}
                          placeholder="00"
                        />
                      </td>
                      <td className="px-1.5 py-1.5 min-w-[150px] sm:min-w-[180px]">
                        <input 
                          type="text" 
                          className="w-full min-w-[140px] bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500 font-medium"
                          value={p.name || ''}
                          onChange={(e) => handleUpdatePreview(idx, 'name', e.target.value)}
                          placeholder="Name"
                        />
                      </td>
                      <td className="px-1.5 py-1.5 shrink-0">
                        <input 
                          type="text" 
                          className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500 font-mono text-center"
                          value={p.stat || p.avg || ''}
                          onChange={(e) => handleUpdatePreview(idx, 'stat', e.target.value)}
                          placeholder=".000"
                        />
                      </td>
                      <td className="px-1.5 py-1.5 text-center shrink-0">
                        <button 
                          onClick={() => handleRemoveRow(idx)}
                          className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-800 transition-colors"
                          title="Remove row"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-700 flex justify-between items-center bg-slate-800/80 rounded-b-xl shrink-0">
          <div className="text-xs text-slate-400">
            {previewData.length > 0 && (
              <span>
                {language === 'en' 
                  ? `Ready to import ${previewData.length} players` 
                  : language === 'zh' 
                  ? `即將匯入 ${previewData.length} 位球員` 
                  : `${previewData.length}名の選手をインポートします`}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white rounded-lg font-medium text-sm transition-colors"
            >
              {language === 'en' ? 'Cancel' : language === 'zh' ? '取消' : 'キャンセル'}
            </button>
            <button 
              onClick={handleImportReplace}
              disabled={previewData.length === 0}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-sm transition-colors shadow-md disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed"
            >
              {language === 'en' ? 'Clear & Import' : language === 'zh' ? '清空名單後匯入' : 'クリアしてインポート'}
            </button>
            <button 
              onClick={handleImportAppend}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-sm transition-colors shadow-md flex items-center gap-1"
            >
              <Check size={16} />
              {previewData.length === 0 
                ? (language === 'en' ? 'Save Changes' : language === 'zh' ? '儲存變更' : '変更を保存')
                : (language === 'en' ? 'Append' : language === 'zh' ? '直接接續現有名單' : '追加')
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
