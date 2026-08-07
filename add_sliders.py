import re
with open("components/ScoreboardControls.tsx", "r") as f:
    text = f.read()

target = """               <button
                 onClick={() => dispatch({ type: 'TOGGLE_ADJUSTMENT_MODE' })}
                 className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
                   state.isAdjustmentMode 
                     ? 'bg-blue-600 text-white shadow-inner' 
                     : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                 }`}
               >
                 {state.isAdjustmentMode ? <Check size={16} /> : <Settings size={16} />}
                 {state.isAdjustmentMode 
                   ? (language === 'en' ? 'Finish Adjustment' : language === 'zh' ? '結束調整' : '調整終了') 
                   : (language === 'en' ? 'Adjustment Mode' : language === 'zh' ? '調整模式' : '調整モード')}
               </button>
             </div>"""

replacement = """               <button
                 onClick={() => dispatch({ type: 'TOGGLE_ADJUSTMENT_MODE' })}
                 className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
                   state.isAdjustmentMode 
                     ? 'bg-blue-600 text-white shadow-inner' 
                     : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                 }`}
               >
                 {state.isAdjustmentMode ? <Check size={16} /> : <Settings size={16} />}
                 {state.isAdjustmentMode 
                   ? (language === 'en' ? 'Finish Adjustment' : language === 'zh' ? '結束調整' : '調整終了') 
                   : (language === 'en' ? 'Adjustment Mode' : language === 'zh' ? '調整模式' : '調整モード')}
               </button>
               {state.isAdjustmentMode && (
                 <div className="mt-3 space-y-2 bg-slate-50 p-2 rounded border text-xs">
                    <div className="flex items-center justify-between gap-2">
                       <span className="text-slate-600 whitespace-nowrap">{language === 'en' ? 'Team Name Size' : language === 'zh' ? '隊名大小' : 'チーム名サイズ'}</span>
                       <input type="range" min="12" max="64" value={state.meta.broadcastTeamNameSize ?? 24} onChange={(e) => dispatch({ type: 'UPDATE_META', field: 'broadcastTeamNameSize', value: parseInt(e.target.value) })} className="w-24" />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                       <span className="text-slate-600 whitespace-nowrap">{language === 'en' ? 'Player Name Size' : language === 'zh' ? '球員名大小' : '選手名サイズ'}</span>
                       <input type="range" min="10" max="48" value={state.meta.broadcastPlayerNameSize ?? 20} onChange={(e) => dispatch({ type: 'UPDATE_META', field: 'broadcastPlayerNameSize', value: parseInt(e.target.value) })} className="w-24" />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                       <span className="text-slate-600 whitespace-nowrap">{language === 'en' ? 'Score Size' : language === 'zh' ? '分數大小' : 'スコアサイズ'}</span>
                       <input type="range" min="16" max="72" value={state.meta.broadcastScoreSize ?? 30} onChange={(e) => dispatch({ type: 'UPDATE_META', field: 'broadcastScoreSize', value: parseInt(e.target.value) })} className="w-24" />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                       <span className="text-slate-600 whitespace-nowrap">{language === 'en' ? 'Timer Size' : language === 'zh' ? '計時器大小' : 'タイマーサイズ'}</span>
                       <input type="range" min="12" max="64" value={state.meta.broadcastTimerSize ?? 24} onChange={(e) => dispatch({ type: 'UPDATE_META', field: 'broadcastTimerSize', value: parseInt(e.target.value) })} className="w-24" />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                       <span className="text-slate-600 whitespace-nowrap">{language === 'en' ? 'Inning Size' : language === 'zh' ? '局數大小' : 'イニングサイズ'}</span>
                       <input type="range" min="12" max="64" value={state.meta.broadcastInningSize ?? 24} onChange={(e) => dispatch({ type: 'UPDATE_META', field: 'broadcastInningSize', value: parseInt(e.target.value) })} className="w-24" />
                    </div>
                 </div>
               )}
             </div>"""

if target in text:
    text = text.replace(target, replacement)
    with open("components/ScoreboardControls.tsx", "w") as f:
        f.write(text)
    print("Success")
else:
    print("Failed")
