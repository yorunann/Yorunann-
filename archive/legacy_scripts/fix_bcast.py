import re
with open('components/ScoreboardDisplay.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. pitchInfoHeight = 0
text = re.sub(r'const pitchInfoHeight = state\.showCount \? 48 : 0;', 'const pitchInfoHeight = 0;', text)

# 2. Remove bottom row
target_bottom = '''          {/* Bottom Row: Pitch Count */}
            {state.showCount && (
            <div className={`flex border-t-[3px] border-slate-700 w-full shrink-0`} style={{ height: '48px' }}>
              <div className="flex-1" />
              <div className={`w-[5rem] border-slate-700 p-2 flex items-center justify-center text-lg font-bold font-display text-slate-300 shrink-0 border-l-[3px]`}>
                {pitcher.stat || '0'}
              </div>
            </div>
            )}'''
            
text = text.replace(target_bottom, '')

with open('components/ScoreboardDisplay.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
