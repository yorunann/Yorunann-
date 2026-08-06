import re
with open('components/ScoreboardControls.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

old_undo = '''                <button 
                  className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded text-xs shadow-md flex items-center justify-center gap-1"
                  onClick={() => dispatch({ type: 'UNDO' })}
                  title={language === 'en' ? 'Undo (Ctrl+Z)' : language === 'zh' ? '復原 (Ctrl+Z)' : '元に戻す (Ctrl+Z)'}
                >
                  <RotateCcw size={14} /> {language === 'en' ? 'Undo' : language === 'zh' ? '復原' : '元に戻す'}
                </button>'''

new_undo = '''                <div className="flex flex-col gap-2">
                  <button 
                    className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded text-xs shadow-md flex items-center justify-center gap-1 h-[42px]"
                    onClick={() => dispatch({ type: 'UNDO' })}
                    title={language === 'en' ? 'Undo (Ctrl+Z)' : language === 'zh' ? '復原 (Ctrl+Z)' : '元に戻す (Ctrl+Z)'}
                  >
                    <RotateCcw size={14} /> {language === 'en' ? 'Undo' : language === 'zh' ? '復原' : '元に戻す'}
                  </button>
                  <div className="flex gap-2">
                    <button 
                      className="bg-slate-500 hover:bg-slate-600 text-white flex-1 py-1 rounded text-xs font-bold"
                      onClick={() => dispatch({ type: 'INCREMENT_PLAYER_STAT', role: 'pitcher' })}
                      title="Pitch +"
                    >
                      +
                    </button>
                    <button 
                      className="bg-slate-500 hover:bg-slate-600 text-white flex-1 py-1 rounded text-xs font-bold"
                      onClick={() => dispatch({ type: 'DECREMENT_PLAYER_STAT', role: 'pitcher' })}
                      title="Pitch -"
                    >
                      -
                    </button>
                  </div>
                </div>'''

if old_undo in text:
    text = text.replace(old_undo, new_undo)
    with open('components/ScoreboardControls.tsx', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Replaced successfully")
else:
    print("Old section not found")
