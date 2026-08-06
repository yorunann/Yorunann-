import re

with open('components/ScoreboardControls.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Remove the old Walk button and WP/PB button.
# Walk is here:
walk_old = '''            <div className="pt-2">
               <button 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 mt-2 rounded shadow transition-transform active:scale-95 text-xs"
                onClick={() => dispatch({ type: 'WALK' })}
              >
                {language === 'en' ? 'BB / Walk' : language === 'zh' ? '保送 (Walk)' : '四死球 (Walk)'}
              </button>
              
              <div className={language === 'ja' ? "grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3" : "grid grid-cols-3 gap-2 mt-3"}>'''

walk_new = '''            <div className="pt-2">
              <div className={language === 'ja' ? "grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3" : "grid grid-cols-3 gap-2 mt-3"}>'''

text = text.replace(walk_old, walk_new)

# 2. Add Walk and WP/PB after 3B in the grid.
triple_old = '''                <button 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded shadow transition-transform active:scale-95 text-xs text-center"
                  onClick={() => dispatch({ type: 'TRIPLE' })}
                >
                  {language === 'en' ? '3B / Triple' : language === 'zh' ? '三壘安' : 'スリーベース (3B)'}
                </button>
              </div>'''

triple_new = '''                <button 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded shadow transition-transform active:scale-95 text-xs text-center"
                  onClick={() => dispatch({ type: 'TRIPLE' })}
                >
                  {language === 'en' ? '3B / Triple' : language === 'zh' ? '三壘安' : 'スリーベース (3B)'}
                </button>
                <button 
                  className="sm:col-span-2 col-span-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded shadow transition-transform active:scale-95 text-xs"
                  onClick={() => dispatch({ type: 'WALK' })}
                >
                  {language === 'en' ? 'BB / Walk' : language === 'zh' ? '保送 (Walk)' : '四死球 (Walk)'}
                </button>
                <button 
                  className="col-span-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 rounded text-xs shadow-md"
                  onClick={() => dispatch({ type: 'WILD_PITCH' })}
                  title={language === 'en' ? 'Wild Pitch / Passed Ball' : language === 'zh' ? '暴投 / 捕逸' : '暴投 / 捕逸'}
                >
                  {language === 'en' ? 'WP / PB' : language === 'zh' ? '暴投/捕逸' : '暴投/捕逸'}
                </button>
              </div>'''

text = text.replace(triple_old, triple_new)

# 3. Remove WP/PB from the bottom flex container
wp_old = '''                <button 
                  className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded text-xs shadow-md"
                  onClick={() => dispatch({ type: 'WILD_PITCH' })}
                  title={language === 'en' ? 'Wild Pitch / Passed Ball' : language === 'zh' ? '暴投 / 捕逸' : '暴投 / 捕逸'}
                >
                  {language === 'en' ? 'WP / PB' : language === 'zh' ? '暴投/捕逸' : '暴投/捕逸'}
                </button>
'''
# wait, there's a trailing newline or not? Let's use re.sub just in case
text = text.replace(wp_old, '')

with open('components/ScoreboardControls.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
