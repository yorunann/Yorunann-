import React, { useState, useEffect } from 'react';
import { X, Check, Save } from 'lucide-react';
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

  const handleParse = () => {
    const parsed = parseLineupText(text);
    setPreviewData(parsed);
  };

  const handleUpdatePreview = (index: number, field: keyof Player, value: string) => {
    const newData = [...previewData];
    newData[index] = { ...newData[index], [field]: value };
    setPreviewData(newData);
  };

  const handleImport = () => {
    // Convert to Player array
    const players: Player[] = previewData.map(p => ({
      id: Math.random().toString(36).substring(2, 9),
      name: p.name || 'Player',
      number: p.number || '00',
      stat: p.stat || p.avg || '.000',
      position: p.position || 'DH'
    }));
    onImport(players);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">
            {language === 'en' ? 'Paste Import Lineup' : language === 'zh' ? '貼上匯入打線' : 'ラインナップの貼り付けとインポート'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col lg:flex-row gap-4 min-h-0">
          <div className="flex-1 flex flex-col gap-2 h-[300px] lg:h-auto">
             <label className="text-sm font-bold text-slate-300">
                 {language === 'en' ? 'Paste Lineup Text (Auto-parsing)' : language === 'zh' ? '貼上打線文字 (高容錯自動解析)' : 'ラインナップテキストを貼り付ける'}
             </label>
             <textarea 
               className="flex-1 w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-white focus:outline-none focus:border-blue-500 font-mono text-sm resize-none"
               placeholder={language === 'en' ? "1. CF #24 Player Name .305\n2. SS (1) Another Player .280" : language === 'zh' ? "支援格式範例:\n1棒 CF #24 姓名 .305\n2. 游擊 1號 王大明 0.280" : "1. CF #24 選手名 .305"}
               value={text}
               onChange={(e) => setText(e.target.value)}
             />
             <button 
                onClick={handleParse}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded transition-colors mt-2"
             >
                {language === 'en' ? 'Parse Text' : language === 'zh' ? '解析文字' : 'テキストを解析する'}
             </button>
          </div>

          <div className="flex-[1.5] flex flex-col min-h-0">
             <label className="text-sm font-bold text-slate-300 mb-2">
                 {language === 'en' ? 'Preview & Edit' : language === 'zh' ? '即時預覽與修正' : 'プレビューと編集'}
             </label>
             <div className="flex-1 bg-slate-900 border border-slate-700 rounded-md overflow-y-auto">
               <table className="w-full text-left text-sm text-slate-300">
                  <thead className="text-xs uppercase bg-slate-800 text-slate-400 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 w-12 text-center">#</th>
                      <th className="px-3 py-2 w-20">POS</th>
                      <th className="px-3 py-2 w-20">NO</th>
                      <th className="px-3 py-2">NAME</th>
                      <th className="px-3 py-2 w-24">AVG</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="text-center py-8 text-slate-500">
                                {language === 'en' ? 'No data yet' : language === 'zh' ? '尚未解析資料' : 'データはまだありません'}
                            </td>
                        </tr>
                    ) : previewData.map((p, idx) => (
                      <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50">
                        <td className="px-3 py-2 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="px-1 py-1">
                          <input 
                            type="text" 
                            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500"
                            value={p.position || ''}
                            onChange={(e) => handleUpdatePreview(idx, 'position', e.target.value)}
                          />
                        </td>
                        <td className="px-1 py-1">
                          <input 
                            type="text" 
                            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500 font-mono"
                            value={p.number || ''}
                            onChange={(e) => handleUpdatePreview(idx, 'number', e.target.value)}
                          />
                        </td>
                        <td className="px-1 py-1">
                          <input 
                            type="text" 
                            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500"
                            value={p.name || ''}
                            onChange={(e) => handleUpdatePreview(idx, 'name', e.target.value)}
                          />
                        </td>
                        <td className="px-1 py-1">
                          <input 
                            type="text" 
                            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500 font-mono"
                            value={p.stat || p.avg || ''}
                            onChange={(e) => handleUpdatePreview(idx, 'stat', e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 flex justify-end gap-3 bg-slate-800/50 rounded-b-xl">
          <button 
             onClick={onClose}
             className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-medium transition-colors"
          >
             {language === 'en' ? 'Cancel' : language === 'zh' ? '取消' : 'キャンセル'}
          </button>
          <button 
             onClick={handleImport}
             disabled={previewData.length === 0}
             className="px-6 py-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-600 disabled:text-slate-400 text-white font-bold rounded flex items-center gap-2 transition-colors"
          >
             <Check size={18} />
             {language === 'en' ? 'Confirm Import' : language === 'zh' ? '確認匯入' : 'インポートの確認'}
          </button>
        </div>
      </div>
    </div>
  );
};
