import re

with open('components/LineupImportModal.tsx', 'r') as f:
    code = f.read()

# 1. Update Props
props_target = '''interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (players: Player[], mode: 'append' | 'replace') => void;
  language?: 'en' | 'zh' | 'ja';
  currentPlayers?: Player[];
}'''
props_replacement = '''interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (players: Player[]) => void;
  language?: 'en' | 'zh' | 'ja';
  currentPlayers?: Player[];
}'''
if props_target in code:
    code = code.replace(props_target, props_replacement)
else:
    print("WARNING: props_target not found")

# 2. Add localCurrentPlayers state and effect
state_target = '''  const [previewTab, setPreviewTab] = useState<'import' | 'current'>('import');
  const [isConfirming, setIsConfirming] = useState(false);'''
state_replacement = '''  const [previewTab, setPreviewTab] = useState<'import' | 'current'>('import');
  const [localCurrentPlayers, setLocalCurrentPlayers] = useState<Player[]>([]);
  
  useEffect(() => {
    if (isOpen) {
      setLocalCurrentPlayers(currentPlayers || []);
      setPreviewTab('import');
    }
  }, [isOpen, currentPlayers]);

  const handleUpdateCurrent = (index: number, field: keyof Player, value: string) => {
    setLocalCurrentPlayers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveCurrentRow = (index: number) => {
    setLocalCurrentPlayers(prev => prev.filter((_, idx) => idx !== index));
  };'''
if state_target in code:
    code = code.replace(state_target, state_replacement)
else:
    print("WARNING: state_target not found")

# 3. Replace handleImport entirely with two new functions
handle_import_target = '''  const handleImport = () => {
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
  };'''

handle_import_replacement = '''  const handleImportReplace = () => {
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
  };'''
if handle_import_target in code:
    code = code.replace(handle_import_target, handle_import_replacement)
else:
    print("WARNING: handle_import_target not found")
    # let's try finding a looser match
    match = re.search(r'const handleImport = \(\) => \{.*?onClose\(\);\s*};', code, re.DOTALL)
    if match:
        code = code[:match.start()] + handle_import_replacement + code[match.end():]
        print("Used regex to replace handleImport")
    else:
        print("Regex also failed to find handleImport")

# 4. Update the tabs UI
tabs_target = '''            <div className="flex justify-between items-center mb-2">
              <div className="flex gap-2">
                <button 
                  onClick={() => setPreviewTab('import')} 
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${previewTab === 'import' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                  {language === 'en' ? 'Preview Import' : language === 'zh' ? '現在的預覽匯入' : 'インポートのプレビュー'}
                  <span className="ml-1 text-xs font-normal">({previewData.length})</span>
                </button>
                <button 
                  onClick={() => setPreviewTab('current')} 
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${previewTab === 'current' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                  {language === 'en' ? 'Current Players' : language === 'zh' ? '現在已經匯入進去的球員' : '現在の選手'}
                  <span className="ml-1 text-xs font-normal">({currentPlayers.length})</span>
                </button>
              </div>
            </div>'''
tabs_replacement = '''            <div className="flex border-b border-slate-700 mb-2 w-full">
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
            </div>'''
if tabs_target in code:
    code = code.replace(tabs_target, tabs_replacement)
else:
    print("WARNING: tabs_target not found")

# 5. Make the current players editable in the table
current_players_table_target = '''                  {previewTab === 'current' ? (
                    currentPlayers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-500">
                          {language === 'en' 
                            ? 'No players imported yet' 
                            : language === 'zh' 
                            ? '目前沒有任何球員' 
                            : '選手はいません'}
                        </td>
                      </tr>
                    ) : currentPlayers.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-3 py-1.5 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="px-1.5 py-1.5 text-white font-semibold uppercase text-center">{p.position}</td>
                        <td className="px-1.5 py-1.5 text-white font-mono text-center">{p.number}</td>
                        <td className="px-1.5 py-1.5 text-white font-medium">{p.name}</td>
                        <td className="px-1.5 py-1.5 text-white font-mono text-center">{p.stat}</td>
                        <td className="px-1.5 py-1.5 text-center"></td>
                      </tr>
                    ))
                  ) : ('''
current_players_table_replacement = '''                  {previewTab === 'current' ? (
                    localCurrentPlayers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-500">
                          {language === 'en' 
                            ? 'No players imported yet' 
                            : language === 'zh' 
                            ? '目前沒有任何球員' 
                            : '選手はいません'}
                        </td>
                      </tr>
                    ) : localCurrentPlayers.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-3 py-1.5 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="px-1.5 py-1.5">
                          <input 
                            type="text" 
                            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500 text-center font-semibold uppercase"
                            value={p.position || ''}
                            onChange={(e) => handleUpdateCurrent(idx, 'position', e.target.value)}
                            placeholder="POS"
                          />
                        </td>
                        <td className="px-1.5 py-1.5">
                          <input 
                            type="text" 
                            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500 font-mono text-center"
                            value={p.number || ''}
                            onChange={(e) => handleUpdateCurrent(idx, 'number', e.target.value)}
                            placeholder="00"
                          />
                        </td>
                        <td className="px-1.5 py-1.5">
                          <input 
                            type="text" 
                            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500 font-medium"
                            value={p.name || ''}
                            onChange={(e) => handleUpdateCurrent(idx, 'name', e.target.value)}
                            placeholder="Name"
                          />
                        </td>
                        <td className="px-1.5 py-1.5">
                          <input 
                            type="text" 
                            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500 font-mono text-center"
                            value={p.stat || ''}
                            onChange={(e) => handleUpdateCurrent(idx, 'stat', e.target.value)}
                            placeholder=".000"
                          />
                        </td>
                        <td className="px-1.5 py-1.5 text-center">
                          <button 
                            onClick={() => handleRemoveCurrentRow(idx)}
                            className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-800 transition-colors"
                            title="Remove row"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : ('''
if current_players_table_target in code:
    code = code.replace(current_players_table_target, current_players_table_replacement)
else:
    print("WARNING: current_players_table_target not found")

# 6. Update the footer buttons (remove isConfirming logic and just show two buttons)
footer_target = '''          <div className="flex gap-3">
            <button 
              onClick={() => { setIsConfirming(false); onClose(); }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white rounded-lg font-medium text-sm transition-colors"
            >
              {language === 'en' ? 'Cancel' : language === 'zh' ? '取消' : 'キャンセル'}
            </button>
            {!isConfirming ? (
              <button 
                onClick={() => setIsConfirming(true)}
                disabled={previewData.length === 0}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-lg text-sm flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:cursor-not-allowed"
              >
                <Check size={16} />
                {language === 'en' ? 'Confirm Import' : language === 'zh' ? '確認匯入' : 'インポートの確認'}
              </button>
            ) : (
              <>
                <button 
                  onClick={() => handleImport('replace')}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-sm transition-colors shadow-md"
                >
                  {language === 'en' ? 'Clear & Import' : language === 'zh' ? '清空名單後匯入' : 'クリアしてインポート'}
                </button>
                <button 
                  onClick={() => handleImport('append')}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg text-sm transition-colors shadow-md"
                >
                  {language === 'en' ? 'Append' : language === 'zh' ? '直接接續現有名單' : '追加'}
                </button>
              </>
            )}
          </div>'''
footer_replacement = '''          <div className="flex gap-3">
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
          </div>'''
if footer_target in code:
    code = code.replace(footer_target, footer_replacement)
else:
    print("WARNING: footer_target not found")
    # regex fallback
    match = re.search(r'<div className="flex gap-3">.*?</div>', code, re.DOTALL)
    if match:
        code = code[:match.start()] + footer_replacement + code[match.end():]
        print("Used regex to replace footer")

with open('components/LineupImportModal.tsx', 'w') as f:
    f.write(code)

