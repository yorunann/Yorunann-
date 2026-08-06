import re

with open('components/ScoreboardControls.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace NEXT_BATTER next to RESET_GAME to PREVIOUS_BATTER
text = re.sub(
    r'<User size=\{14\} /> \{language === \'en\' \? \'Next Batter\' : language === \'zh\' \? \'下一位打者\' : \'次の打者へ\'\}',
    r'<User size={14} /> {language === \'en\' ? \'Previous Batter\' : language === \'zh\' ? \'上一位打者\' : \'前の打者へ\'}',
    text
)
text = re.sub(
    r'onClick=\{\(\) => dispatch\(\{ type: \'NEXT_BATTER\' \}\)\}',
    r'onClick={() => dispatch({ type: \'PREVIOUS_BATTER\' })}',
    text
)

# Reorder Hide buttons and add Hide Timer
old_hide_buttons = r'''                {/* Show/Hide Player Stat Toggle */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <button 
                    className={`flex items-center justify-center space-x-2 px-3 py-2 rounded border text-sm transition-colors ${state.showPlayerStat ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-white border-gray-300 text-gray-500'}`}
                    onClick={() => dispatch({type: 'TOGGLE_VISIBILITY', field: 'showPlayerStat'})}
                  >
                     {state.showPlayerStat ? <Eye size={14} /> : <EyeOff size={14} />}
                     <span>{language === 'en' ? 'Hide Stats' : language === 'zh' ? '隱藏數據' : '成績非表示'}</span>
                  </button>
                  <button 
                    className={`flex items-center justify-center space-x-2 px-3 py-2 rounded border text-sm transition-colors ${state.showCount ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-white border-gray-300 text-gray-500'}`}
                    onClick={() => dispatch({type: 'TOGGLE_VISIBILITY', field: 'showCount'})}
                  >
                     {state.showCount ? <Eye size={14} /> : <EyeOff size={14} />}
                     <span>{language === 'en' ? 'Hide Pitch Count' : language === 'zh' ? '隱藏投球數' : '球数非表示'}</span>
                  </button>
                  <button 
                    className={`flex items-center justify-center space-x-2 px-3 py-2 rounded border text-sm transition-colors ${state.showBatterInfo ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-white border-gray-300 text-gray-500'}`}
                    onClick={() => dispatch({type: 'TOGGLE_VISIBILITY', field: 'showBatterInfo'})}
                  >
                     {state.showBatterInfo ? <Eye size={14} /> : <EyeOff size={14} />}
                     <span>{language === 'en' ? 'Hide Batter' : language === 'zh' ? '隱藏打者' : '打者非表示'}</span>
                  </button>
                  <button 
                    className={`flex items-center justify-center space-x-2 px-3 py-2 rounded border text-sm transition-colors ${state.showPitcherInfo ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-white border-gray-300 text-gray-500'}`}
                    onClick={() => dispatch({type: 'TOGGLE_VISIBILITY', field: 'showPitcherInfo'})}
                  >
                     {state.showPitcherInfo ? <Eye size={14} /> : <EyeOff size={14} />}
                     <span>{language === 'en' ? 'Hide Pitcher' : language === 'zh' ? '隱藏投手' : '投手非表示'}</span>
                  </button>
                </div>'''

new_hide_buttons = r'''                {/* Show/Hide Player Stat Toggle */}
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    className={`flex items-center justify-center space-x-2 px-3 py-2 rounded border text-sm transition-colors ${state.showPlayerStat ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-white border-gray-300 text-gray-500'}`}
                    onClick={() => dispatch({type: 'TOGGLE_VISIBILITY', field: 'showPlayerStat'})}
                  >
                     {state.showPlayerStat ? <Eye size={14} /> : <EyeOff size={14} />}
                     <span>{language === 'en' ? 'Hide Stats' : language === 'zh' ? '隱藏數據' : '成績非表示'}</span>
                  </button>
                  <button 
                    className={`flex items-center justify-center space-x-2 px-3 py-2 rounded border text-sm transition-colors ${state.showCount ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-white border-gray-300 text-gray-500'}`}
                    onClick={() => dispatch({type: 'TOGGLE_VISIBILITY', field: 'showCount'})}
                  >
                     {state.showCount ? <Eye size={14} /> : <EyeOff size={14} />}
                     <span>{language === 'en' ? 'Hide Pitch Count' : language === 'zh' ? '隱藏投球數' : '球数非表示'}</span>
                  </button>
                  <button 
                    className={`flex items-center justify-center space-x-2 px-3 py-2 rounded border text-sm transition-colors ${state.showBatterInfo ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-white border-gray-300 text-gray-500'}`}
                    onClick={() => dispatch({type: 'TOGGLE_VISIBILITY', field: 'showBatterInfo'})}
                  >
                     {state.showBatterInfo ? <Eye size={14} /> : <EyeOff size={14} />}
                     <span>{language === 'en' ? 'Hide Batter' : language === 'zh' ? '隱藏打者' : '打者非表示'}</span>
                  </button>
                  <button 
                    className={`flex items-center justify-center space-x-2 px-3 py-2 rounded border text-sm transition-colors ${state.showPitcherInfo ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-white border-gray-300 text-gray-500'}`}
                    onClick={() => dispatch({type: 'TOGGLE_VISIBILITY', field: 'showPitcherInfo'})}
                  >
                     {state.showPitcherInfo ? <Eye size={14} /> : <EyeOff size={14} />}
                     <span>{language === 'en' ? 'Hide Pitcher' : language === 'zh' ? '隱藏投手' : '投手非表示'}</span>
                  </button>
                </div>'''

text = text.replace(old_hide_buttons, new_hide_buttons)

old_timer_controls = r'''             {/* Timer Controls */}
             <div className="bg-white p-2 rounded border shadow-sm flex items-center space-x-2">
               <div className="flex-1">
                 <label className="block text-xs text-gray-500 font-bold mb-1">{language === 'en' ? 'PITCH TIMER (Long Press Display to Reset)' : language === 'zh' ? 'PITCH TIMER 投球計時器 (長按數字重置)' : 'ピッチクロック (長押しでリセット)'}</label>
                 <div className="flex items-center space-x-2">
                    <input 
                      type="number" 
                      className="border p-1 rounded w-16 text-lg font-mono text-slate-900 bg-white"
                      value={state.timer}
                      onChange={(e) => dispatch({type: 'SET_TIMER', value: parseInt(e.target.value) || 0})}
                    />
                    <button 
                      className={`flex-1 p-2 rounded text-white flex items-center justify-center font-bold gap-2 ${state.isTimerRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                      onClick={() => dispatch({type: 'TOGGLE_TIMER'})}
                      title={state.isTimerRunning ? "Pause" : "Start"}
                    >
                      {state.isTimerRunning ? <Pause size={16} /> : <Play size={16} />}
                      {state.isTimerRunning ? "STOP" : "START"}
                    </button>
                    <button 
                       className="p-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
                       onClick={() => dispatch({type: 'RESET_TIMER'})}
                       title="Reset Timer"
                    >
                      <RotateCcw size={16} />
                    </button>
                 </div>
               </div>
             </div>'''

new_timer_controls = r'''             {/* Timer Controls */}
             <div className="bg-white p-2 rounded border shadow-sm flex flex-col space-y-2">
               <div className="flex justify-between items-center">
                 <label className="block text-xs text-gray-500 font-bold">{language === 'en' ? 'PITCH TIMER (Long Press Display to Reset)' : language === 'zh' ? 'PITCH TIMER 投球計時器 (長按重置)' : 'ピッチクロック (長押しでリセット)'}</label>
               </div>
               <div className="flex items-center space-x-2">
                  <input 
                    type="number" 
                    className="border p-1 rounded w-16 text-lg font-mono text-slate-900 bg-white"
                    value={state.timer}
                    onChange={(e) => dispatch({type: 'SET_TIMER', value: parseInt(e.target.value) || 0})}
                  />
                  <button 
                    className={`flex-1 p-2 rounded text-white flex items-center justify-center font-bold gap-2 ${state.isTimerRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                    onClick={() => dispatch({type: 'TOGGLE_TIMER'})}
                    title={state.isTimerRunning ? "Pause" : "Start"}
                  >
                    {state.isTimerRunning ? <Pause size={16} /> : <Play size={16} />}
                    {state.isTimerRunning ? "STOP" : "START"}
                  </button>
                  <button 
                     className="p-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 flex-shrink-0"
                     onClick={() => dispatch({type: 'RESET_TIMER'})}
                     title="Reset Timer"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button 
                    className={`p-2 rounded flex items-center justify-center border transition-colors flex-shrink-0 ${state.showTimer ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-white border-gray-300 text-gray-500'}`}
                    onClick={() => dispatch({type: 'TOGGLE_VISIBILITY', field: 'showTimer'})}
                    title={language === 'en' ? 'Hide Timer' : language === 'zh' ? '隱藏計時器' : 'タイマー非表示'}
                  >
                    {state.showTimer ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
               </div>
             </div>'''

text = text.replace(old_timer_controls, new_timer_controls)

with open('components/ScoreboardControls.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated ScoreboardControls.tsx")
