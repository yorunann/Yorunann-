import re

with open('components/ScoreboardDisplay.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(
    'const pitchInfoHeight = 48;',
    'const pitchInfoHeight = (state.showCount || state.showTimer) ? 48 : 0;'
)

bottom_row_old = '''          {/* Bottom Row: Pitch Count/Clock */}
            <div className={`flex border-t-[3px] border-slate-700 w-full shrink-0`} style={{ height: '48px' }}>
              <div className="flex-1" />
              {state.showCount && (
              <div className={`w-[5rem] border-slate-700 p-2 flex items-center justify-center text-lg font-bold font-display text-slate-300 shrink-0 border-l-[3px]`}>
                {pitcher.stat || '0'}
              </div>
              )}
              {state.showTimer && (
              <div className={`w-[4.5rem] border-slate-700 p-2 flex items-center justify-center text-2xl font-bold font-display shrink-0 ${state.timer <= 8 && state.isTimerRunning ? 'text-red-500 animate-pulse' : 'text-yellow-400'} border-l-[3px]`}>
                {state.timer}
              </div>
              )}
            </div>'''

bottom_row_new = '''          {/* Bottom Row: Pitch Count/Clock */}
            {(state.showCount || state.showTimer) && (
            <div className={`flex border-t-[3px] border-slate-700 w-full shrink-0`} style={{ height: '48px' }}>
              <div className="flex-1" />
              {state.showCount && (
              <div className={`w-[5rem] border-slate-700 p-2 flex items-center justify-center text-lg font-bold font-display text-slate-300 shrink-0 border-l-[3px]`}>
                {pitcher.stat || '0'}
              </div>
              )}
              {state.showTimer && (
              <div className={`w-[4.5rem] border-slate-700 p-2 flex items-center justify-center text-2xl font-bold font-display shrink-0 ${state.timer <= 8 && state.isTimerRunning ? 'text-red-500 animate-pulse' : 'text-yellow-400'} border-l-[3px]`}>
                {state.timer}
              </div>
              )}
            </div>
            )}'''

text = text.replace(bottom_row_old, bottom_row_new)

with open('components/ScoreboardDisplay.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

