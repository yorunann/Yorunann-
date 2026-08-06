import re
with open('components/ScoreboardControls.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace the grid-cols-2 wrapper for the controls tab
old_wrapper = '''        {activeTab === 'controls' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* Game State Actions */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide border-b pb-1">{language === 'en' ? 'Umpire Controls' : language === 'zh' ? 'Umpire Controls 裁判控制' : '審判コントロール'}</h3>
            
            <div className="grid grid-cols-1 gap-2">'''

new_wrapper = '''        {activeTab === 'controls' && (
          <div className="flex flex-col gap-6">
           {/* Game State Actions */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide border-b pb-1">{language === 'en' ? 'Umpire Controls' : language === 'zh' ? 'Umpire Controls 裁判控制' : '審判コントロール'}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid grid-cols-1 gap-2 h-max">'''

text = text.replace(old_wrapper, new_wrapper)

# At the end of the balls/strikes section, we need to close the left column and start the right column
old_end_left = '''              <button 
                className="w-full bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 rounded shadow transition-transform active:scale-95 text-lg"
                onClick={() => dispatch({ type: 'RESET_COUNT' })}
              >
                {language === 'en' ? 'Reset Count' : language === 'zh' ? '重置好壞球' : 'カウントリセット'}
              </button>
            </div>
            
            <div className="pt-2">'''

new_end_left = '''              <button 
                className="w-full bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 rounded shadow transition-transform active:scale-95 text-lg"
                onClick={() => dispatch({ type: 'RESET_COUNT' })}
              >
                {language === 'en' ? 'Reset Count' : language === 'zh' ? '重置好壞球' : 'カウントリセット'}
              </button>
            </div>
            
            <div className="flex flex-col gap-0 h-max">'''

text = text.replace(old_end_left, new_end_left)

# Remove the `mt-3` from the first div in the right column
text = text.replace('<div className="flex flex-col gap-1.5 mt-3">', '<div className="flex flex-col gap-1.5">')

# The inning is after the right column ends (or we can just put it inside the right column)
old_inning = '''              </div>
            </div>
            
            <div className="flex pt-2 items-center">
              <div className="flex-1 flex items-center gap-1 bg-white border rounded px-2 py-2">
                 <span className="text-xs font-bold text-gray-500">INN:</span>'''

new_inning = '''              </div>
            
            <div className="flex pt-4 items-center">
              <div className="flex-1 flex items-center gap-1 bg-white border rounded px-2 py-2">
                 <span className="text-xs font-bold text-gray-500">INN:</span>'''

text = text.replace(old_inning, new_inning)

# After the inning ends, we need to close the md:grid-cols-2 div
old_inning_end = '''                  <button 
                    className="ml-auto bg-blue-800 hover:bg-blue-900 text-white font-bold px-2 rounded text-xs"
                    onClick={() => dispatch({ type: 'NEXT_INNING' })}
                    title="Next Inning (Top/Bottom)"
                  >
                    Next
                  </button>
              </div>
            </div>
          </div>
          
          {/* Settings & Timer */}'''

new_inning_end = '''                  <button 
                    className="ml-auto bg-blue-800 hover:bg-blue-900 text-white font-bold px-2 rounded text-xs"
                    onClick={() => dispatch({ type: 'NEXT_INNING' })}
                    title="Next Inning (Top/Bottom)"
                  >
                    Next
                  </button>
              </div>
            </div>
            </div>
          </div>
          
          {/* Settings & Timer */}'''

text = text.replace(old_inning_end, new_inning_end)

with open('components/ScoreboardControls.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
    
print("Updated Layout.")
