import re

with open('components/ScoreboardControls.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

old_buttons = r'''             {/* Manual Batter Control & Reset Game */}
             <div className="grid grid-cols-2 gap-2">
               <button 
                  className="w-full bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-semibold py-2 rounded text-xs flex items-center justify-center gap-2 border border-indigo-200"
                  onClick={() => dispatch({ type: 'PREVIOUS_BATTER' })}
                >
                  <User size={14} /> {language === 'en' ? 'Previous Batter' : language === 'zh' ? '上一位打者' : '前の打者へ'}
               </button>
               <button 
                  className="w-full bg-red-100 hover:bg-red-200 text-red-800 font-semibold py-2 rounded text-xs flex items-center justify-center gap-2 border border-red-200"
                  onClick={() => dispatch({ type: 'RESET_GAME' })}
                >
                  <RefreshCw size={14} /> {language === 'en' ? 'Reset Game' : language === 'zh' ? '重置比賽' : '試合リセット'}
               </button>
             </div>'''

new_buttons = r'''             {/* Manual Batter Control */}
             <div className="grid grid-cols-2 gap-2">
               <button 
                  className="w-full bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-semibold py-2 rounded text-xs flex items-center justify-center gap-2 border border-indigo-200"
                  onClick={() => dispatch({ type: 'PREVIOUS_BATTER' })}
                >
                  <User size={14} /> {language === 'en' ? 'Previous Batter' : language === 'zh' ? '上一位打者' : '前の打者へ'}
               </button>
               <button 
                  className="w-full bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-semibold py-2 rounded text-xs flex items-center justify-center gap-2 border border-indigo-200"
                  onClick={() => dispatch({ type: 'NEXT_BATTER' })}
                >
                  <User size={14} /> {language === 'en' ? 'Next Batter' : language === 'zh' ? '下一位打者' : '次の打者へ'}
               </button>
             </div>'''

text = text.replace(old_buttons, new_buttons)

with open('components/ScoreboardControls.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

