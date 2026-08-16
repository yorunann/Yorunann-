import React, { useState, useEffect } from 'react';
import { X, Check, FileText, Trash2, RotateCcw } from 'lucide-react';
import { Player } from '../types';
import { parseLineupText } from '../utils/parseLineupText';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (players: Player[]) => void;
  language?: 'en' | 'zh' | 'ja';
}

export const LineupImportModal: React.FC<Props> = ({ isOpen, onClose, onImport, language = 'zh' }) => {
  const [text, setText] = useState('');
  const [previewData, setPreviewData] = useState<Partial<Player>[]>([]);

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

  const handleImport = () => {
    if (previewData.length === 0) return;
    const players: Player[] = previewData.map((p, index) => ({
      id: Math.random().toString(36).substring(2, 9),
      name: p.name || `Player ${index + 1}`,
      number: p.number || '00',
      stat: p.stat || p.avg || '.000',
      position: p.position || 'DH'
    }));
    onImport(players);
    onClose();
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
              <span>{language === 'en' ? 'Supports all formats: Chinese / English positions, numbers, names, batting averages.' : language === 'zh' ? '支援自動識別：中英文守備位置、背號、姓名、打擊率等任意排列' : '漢英表記の守備位置、背番号、選手名、打率の自動判別に対応'}</span>
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
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-slate-200">
                {language === 'en' ? 'Preview & Edit' : language === 'zh' ? '即時預覽與修正' : 'プレビューと編集'}
                <span className="ml-2 text-xs font-normal text-blue-400">
                  ({previewData.length} {language === 'en' ? 'players' : language === 'zh' ? '位球員' : '名'})
                </span>
              </label>
            </div>

            <div className="flex-1 bg-slate-900 border border-slate-700 rounded-lg overflow-y-auto shadow-inner">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs uppercase bg-slate-800/90 text-slate-400 sticky top-0 backdrop-blur z-10 border-b border-slate-700">
                  <tr>
                    <th className="px-3 py-2.5 w-12 text-center">#</th>
                    <th className="px-2 py-2.5 w-24">
                      {language === 'en' ? 'POS' : language === 'zh' ? '守備' : '守備'}
                    </th>
                    <th className="px-2 py-2.5 w-24">
                      {language === 'en' ? 'NO.' : language === 'zh' ? '背號' : '背番号'}
                    </th>
                    <th className="px-2 py-2.5">
                      {language === 'en' ? 'NAME' : language === 'zh' ? '姓名' : '選手名'}
                    </th>
                    <th className="px-2 py-2.5 w-24">
                      {language === 'en' ? 'AVG' : language === 'zh' ? '打擊率' : '打率'}
                    </th>
                    <th className="px-2 py-2.5 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {previewData.length === 0 ? (
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
                      <td className="px-3 py-1.5 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="px-1.5 py-1.5">
                        <input 
                          type="text" 
                          className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500 text-center font-semibold uppercase"
                          value={p.position || ''}
                          onChange={(e) => handleUpdatePreview(idx, 'position', e.target.value)}
                          placeholder="POS"
                        />
                      </td>
                      <td className="px-1.5 py-1.5">
                        <input 
                          type="text" 
                          className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500 font-mono text-center"
                          value={p.number || ''}
                          onChange={(e) => handleUpdatePreview(idx, 'number', e.target.value)}
                          placeholder="00"
                        />
                      </td>
                      <td className="px-1.5 py-1.5">
                        <input 
                          type="text" 
                          className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500 font-medium"
                          value={p.name || ''}
                          onChange={(e) => handleUpdatePreview(idx, 'name', e.target.value)}
                          placeholder="Name"
                        />
                      </td>
                      <td className="px-1.5 py-1.5">
                        <input 
                          type="text" 
                          className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500 font-mono text-center"
                          value={p.stat || p.avg || ''}
                          onChange={(e) => handleUpdatePreview(idx, 'stat', e.target.value)}
                          placeholder=".000"
                        />
                      </td>
                      <td className="px-1.5 py-1.5 text-center">
                        <button 
                          onClick={() => handleRemoveRow(idx)}
                          className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-800 transition-colors"
                          title="Remove row"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
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
              onClick={handleImport}
              disabled={previewData.length === 0}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-lg text-sm flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:cursor-not-allowed"
            >
              <Check size={16} />
              {language === 'en' ? 'Confirm Import' : language === 'zh' ? '確認匯入' : 'インポートの確認'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
