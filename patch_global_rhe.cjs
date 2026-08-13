const fs = require('fs');
let content = fs.readFileSync('components/ScoreboardControls.tsx', 'utf8');

const rheComponent = `
const InningsAndRHEEditor: React.FC<{ state: GameState, dispatch: React.Dispatch<ActionType>, language?: 'en' | 'zh' | 'ja' }> = ({ state, dispatch, language = 'zh' }) => {
  const maxInnings = Math.max(state.awayTeam.inningScores.length, state.homeTeam.inningScores.length);
  const innings = Array.from({ length: maxInnings }, (_, i) => i);

  const handleScoreChange = (teamKey: 'away' | 'home', idx: number, val: string) => {
    const team = state[teamKey + 'Team' as 'awayTeam' | 'homeTeam'];
    const newScores = [...team.inningScores];
    newScores[idx] = val === '' ? null : (parseInt(val) || 0);
    dispatch({ type: 'UPDATE_TEAM', team: teamKey, data: { inningScores: newScores } });
  };

  const handleAddInning = () => {
    dispatch({ type: 'UPDATE_TEAM', team: 'away', data: { inningScores: [...state.awayTeam.inningScores, null] } });
    dispatch({ type: 'UPDATE_TEAM', team: 'home', data: { inningScores: [...state.homeTeam.inningScores, null] } });
  };

  const handleDeleteInning = (idx: number) => {
    if (confirm(language === 'en' ? 'Delete this inning?' : language === 'zh' ? '確定要刪除這局嗎？' : 'このイニングを削除しますか？')) {
      const awayScores = [...state.awayTeam.inningScores];
      const homeScores = [...state.homeTeam.inningScores];
      awayScores.splice(idx, 1);
      homeScores.splice(idx, 1);
      dispatch({ type: 'UPDATE_TEAM', team: 'away', data: { inningScores: awayScores } });
      dispatch({ type: 'UPDATE_TEAM', team: 'home', data: { inningScores: homeScores } });
    }
  };

  const handleStatChange = (teamKey: 'away' | 'home', field: 'hits' | 'errors', val: number) => {
    dispatch({ type: 'UPDATE_TEAM', team: teamKey, data: { [field]: val } });
  };

  return (
    <div className="bg-white p-3 rounded-lg border shadow-sm mt-4">
      <h4 className="font-bold text-sm text-gray-800 mb-3 uppercase tracking-wide border-b pb-1">
        {language === 'en' ? 'Innings & RHE Configuration' : language === 'zh' ? '局數與 RHE 設定' : 'イニングとRHE設定'}
      </h4>
      
      <div className="flex gap-4 min-w-0 overflow-x-auto pb-4">
        {/* Team Labels & RHE */}
        <div className="flex flex-col gap-2 shrink-0 border-r pr-4">
          <div className="h-6"></div> {/* Spacer for inning numbers */}
          <div className="flex items-center justify-between gap-4 h-8">
             <span className="font-bold text-xs" style={{ color: state.awayTeam.color }}>{state.awayTeam.name}</span>
             <div className="flex gap-2">
                <div className="flex items-center gap-1"><span className="text-xs font-bold text-slate-500">H</span><input type="number" className="w-10 border rounded px-1 text-xs" value={state.awayTeam.hits} onChange={(e) => handleStatChange('away', 'hits', parseInt(e.target.value) || 0)} /></div>
                <div className="flex items-center gap-1"><span className="text-xs font-bold text-slate-500">E</span><input type="number" className="w-10 border rounded px-1 text-xs" value={state.awayTeam.errors} onChange={(e) => handleStatChange('away', 'errors', parseInt(e.target.value) || 0)} /></div>
             </div>
          </div>
          <div className="flex items-center justify-between gap-4 h-8">
             <span className="font-bold text-xs" style={{ color: state.homeTeam.color }}>{state.homeTeam.name}</span>
             <div className="flex gap-2">
                <div className="flex items-center gap-1"><span className="text-xs font-bold text-slate-500">H</span><input type="number" className="w-10 border rounded px-1 text-xs" value={state.homeTeam.hits} onChange={(e) => handleStatChange('home', 'hits', parseInt(e.target.value) || 0)} /></div>
                <div className="flex items-center gap-1"><span className="text-xs font-bold text-slate-500">E</span><input type="number" className="w-10 border rounded px-1 text-xs" value={state.homeTeam.errors} onChange={(e) => handleStatChange('home', 'errors', parseInt(e.target.value) || 0)} /></div>
             </div>
          </div>
        </div>

        {/* Innings */}
        {innings.map(idx => (
          <div key={idx} className="flex flex-col gap-2 items-center shrink-0">
            <div className="h-6 flex items-center justify-between w-full">
              <span className="text-xs font-bold text-slate-500 w-full text-center">{idx + 1}</span>
              <button onClick={() => handleDeleteInning(idx)} className="text-red-400 hover:text-red-600 p-0.5"><Trash2 size={10} /></button>
            </div>
            <input 
              className="w-10 h-8 border rounded px-1 text-center text-sm font-bold bg-slate-50" 
              value={state.awayTeam.inningScores[idx] === null || state.awayTeam.inningScores[idx] === undefined ? '' : state.awayTeam.inningScores[idx]}
              onChange={(e) => handleScoreChange('away', idx, e.target.value)}
            />
            <input 
              className="w-10 h-8 border rounded px-1 text-center text-sm font-bold bg-slate-50" 
              value={state.homeTeam.inningScores[idx] === null || state.homeTeam.inningScores[idx] === undefined ? '' : state.homeTeam.inningScores[idx]}
              onChange={(e) => handleScoreChange('home', idx, e.target.value)}
            />
          </div>
        ))}
        
        {/* Add Inning */}
        <div className="flex flex-col items-center justify-center shrink-0 pl-2">
          <button 
            onClick={handleAddInning}
            className="w-8 h-full min-h-[80px] flex items-center justify-center border-2 border-dashed rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors"
            title="Add Inning"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
`;

const insertIndex = content.indexOf('const TeamEditor: React.FC');
if (insertIndex !== -1) {
    const before = content.substring(0, insertIndex);
    const after = content.substring(insertIndex);
    content = before + rheComponent + '\n' + after;
}

// Now inject it at the end of the info tab
const injectSearch = `                  </button>\n                </div>\n              </div>\n            </div>`;
const injectReplace = `                  </button>\n                </div>\n              </div>\n            </div>\n\n            {/* Global RHE and Innings Editor */}\n            <InningsAndRHEEditor state={state} dispatch={dispatch} language={language} />`;
content = content.replace(injectSearch, injectReplace);

fs.writeFileSync('components/ScoreboardControls.tsx', content);
