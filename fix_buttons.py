import re
with open('components/ScoreboardControls.tsx', 'r') as f:
    text = f.read()

target = """        <div className="flex items-center justify-between gap-2">
           <div className="flex items-center gap-2">
             <div className="flex flex-col gap-1">
               <div className="flex items-center gap-1" title={language === 'en' ? 'Team Color' : language === 'zh' ? '隊伍色' : 'チーム色'}>
                 <input type="color" className="w-6 h-6 rounded cursor-pointer border-none p-0" value={draft.color} onChange={(e) => updateDraft('color', e.target.value)} />
                 <span className="text-[9px] text-gray-500 font-bold leading-none w-10">{language === 'en' ? 'TEAM' : language === 'zh' ? '隊伍色' : 'チーム'}</span>
               </div>
               <div className="flex items-center gap-1" title={language === 'en' ? 'Base Color' : language === 'zh' ? '壘包色' : 'ベース色'}>
                 <input type="color" className="w-6 h-6 rounded cursor-pointer border-none p-0" value={draft.baseColor || '#facc15'} onChange={(e) => updateDraft('baseColor', e.target.value)} />
                 <span className="text-[9px] text-gray-500 font-bold leading-none w-10">{language === 'en' ? 'BASE' : language === 'zh' ? '壘包色' : 'ベース'}</span>
               </div>
             </div>
             <label className="cursor-pointer bg-white border rounded p-1.5 hover:bg-gray-50 h-full flex items-center justify-center" title="Upload Logo">
               <ImageIcon size={16} className="text-gray-500" />
               <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
             </label>
           </div>
           
           <div className="flex flex-col gap-1 items-end">
               <div className="flex items-center border-2 border-slate-400 bg-white rounded text-black overflow-hidden shadow-sm">
                  <button className="px-3 py-1 hover:bg-gray-100 text-black font-bold border-r-2 border-slate-200" onClick={() => dispatch({type: 'ADD_SCORE', team: teamKey, amount: -1})}>-</button>
                  <span className="px-3 font-mono font-bold text-black text-lg min-w-[2.5rem] text-center">{globalTeam.score}</span>
                  <button className="px-3 py-1 hover:bg-gray-100 text-black font-bold border-l-2 border-slate-200" onClick={() => dispatch({type: 'ADD_SCORE', team: teamKey, amount: 1})}>+</button>
               </div>
               <div className="flex w-full gap-1">
                 <button 
                   onClick={() => {
                     if (confirm(language === 'en' ? 'Reset this team?' : language === 'zh' ? '確定要重置此隊伍的陣容與設定嗎？' : 'このチームのラインナップと設定をリセットしますか？')) {
                       dispatch({ type: 'RESET_TEAM', team: teamKey });
                     }
                   }} 
                   className="bg-red-600 hover:bg-red-700 text-white flex items-center justify-center py-1 px-3 rounded shadow"
                   title={language === 'en' ? 'Reset Team' : language === 'zh' ? '重置隊伍' : 'チームリセット'}
                 >
                   <RotateCcw size={14} />
                 </button>
                 <button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-3 rounded shadow flex-1">
                   {language === 'en' ? 'Update Info' : language === 'zh' ? '更新資訊' : '情報更新'}
                 </button>
               </div>
           </div>
        </div>"""

replacement = """        <div className="flex items-center justify-between gap-1">
           <div className="flex items-center gap-1 shrink-0">
             <div className="flex flex-col gap-1">
               <div className="flex items-center gap-1" title={language === 'en' ? 'Team Color' : language === 'zh' ? '隊伍色' : 'チーム色'}>
                 <input type="color" className="w-6 h-6 rounded cursor-pointer border-none p-0 shrink-0" value={draft.color} onChange={(e) => updateDraft('color', e.target.value)} />
                 <span className="text-[9px] text-gray-500 font-bold leading-none w-8">{language === 'en' ? 'TEAM' : language === 'zh' ? '隊伍' : 'チーム'}</span>
               </div>
               <div className="flex items-center gap-1" title={language === 'en' ? 'Base Color' : language === 'zh' ? '壘包色' : 'ベース色'}>
                 <input type="color" className="w-6 h-6 rounded cursor-pointer border-none p-0 shrink-0" value={draft.baseColor || '#facc15'} onChange={(e) => updateDraft('baseColor', e.target.value)} />
                 <span className="text-[9px] text-gray-500 font-bold leading-none w-8">{language === 'en' ? 'BASE' : language === 'zh' ? '壘包' : 'ベース'}</span>
               </div>
             </div>
             <label className="cursor-pointer bg-white border rounded p-1 hover:bg-gray-50 h-full flex items-center justify-center shrink-0" title="Upload Logo">
               <ImageIcon size={16} className="text-gray-500" />
               <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
             </label>
           </div>
           
           <div className="flex flex-col gap-1 shrink w-[120px]">
               <div className="flex items-center justify-between border-2 border-slate-400 bg-white rounded text-black overflow-hidden shadow-sm">
                  <button className="px-2 py-1 hover:bg-gray-100 text-black font-bold border-r-2 border-slate-200 flex-1" onClick={() => dispatch({type: 'ADD_SCORE', team: teamKey, amount: -1})}>-</button>
                  <span className="font-mono font-bold text-black text-base min-w-[1.5rem] text-center">{globalTeam.score}</span>
                  <button className="px-2 py-1 hover:bg-gray-100 text-black font-bold border-l-2 border-slate-200 flex-1" onClick={() => dispatch({type: 'ADD_SCORE', team: teamKey, amount: 1})}>+</button>
               </div>
               <div className="flex gap-1 w-full">
                 <button 
                   onClick={() => {
                     if (confirm(language === 'en' ? 'Reset this team?' : language === 'zh' ? '確定要重置此隊伍的陣容與設定嗎？' : 'このチームのラインナップと設定をリセットしますか？')) {
                       dispatch({ type: 'RESET_TEAM', team: teamKey });
                     }
                   }} 
                   className="bg-red-600 hover:bg-red-700 text-white flex items-center justify-center py-1 px-1.5 rounded shadow shrink-0"
                   title={language === 'en' ? 'Reset Team' : language === 'zh' ? '重置隊伍' : 'チームリセット'}
                 >
                   <RotateCcw size={12} />
                 </button>
                 <button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold py-1 px-1 rounded shadow flex-1 whitespace-nowrap overflow-hidden text-ellipsis text-center">
                   {language === 'en' ? 'Update Info' : language === 'zh' ? '更新資訊' : '情報更新'}
                 </button>
               </div>
           </div>
        </div>"""

if target in text:
    text = text.replace(target, replacement)
    with open('components/ScoreboardControls.tsx', 'w') as f:
        f.write(text)
    print("Success")
else:
    print("Failed")
