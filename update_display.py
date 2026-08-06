import re

with open('components/ScoreboardDisplay.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Default mode timer
text = re.sub(
    r'(<div \n                  className={`flex items-center space-x-1 px-2 py-1 rounded border-2 cursor-pointer select-none active:scale-95 transition-all \${state\.timer <= 8 && state\.isTimerRunning \? \'bg-red-900/80 border-red-500 animate-pulse\' : \'bg-black/40 border-slate-600/50\'}`}\n                  onMouseDown=\{handleTimerMouseDown\}\n                  onMouseUp=\{handleTimerMouseUp\}\n                  onMouseLeave=\{handleTimerMouseUp\}\n                  onTouchStart=\{handleTimerMouseDown\}\n                  onTouchEnd=\{handleTimerMouseUp\}\n                  onClick=\{handleTimerClick\}\n               >\n                    <Timer size=\{20\} className=\{state\.isTimerRunning \? "text-green-400 animate-spin" : "text-slate-400"\} />\n                    <span className=\{`text-3xl sm:text-4xl lg:text-5xl font-display font-bold w-\[40px\] sm:w-\[50px\] lg:w-\[70px\] text-center \${state\.timer <= 8 \? \'text-white\' : \'text-yellow-400\'}`\}>\n                      \{state\.timer\}\n                    </span>\n               </div>)',
    r'{state.showTimer && (\1)}',
    text
)

# RHE mode timer
text = re.sub(
    r'(<div \n                      className={`flex items-center space-x-1 px-4 py-2 rounded border-2 cursor-pointer select-none active:scale-95 transition-all \${state\.timer <= 8 && state\.isTimerRunning \? \'bg-red-900/80 border-red-500 animate-pulse\' : \'bg-black/40 border-slate-600/50\'}`}\n                      onMouseDown=\{handleTimerMouseDown\}\n                      onMouseUp=\{handleTimerMouseUp\}\n                      onMouseLeave=\{handleTimerMouseUp\}\n                      onTouchStart=\{handleTimerMouseDown\}\n                      onTouchEnd=\{handleTimerMouseUp\}\n                      onClick=\{handleTimerClick\}\n                   >\n                        <Timer size=\{24\} className=\{state\.isTimerRunning \? "text-green-400 animate-spin" : "text-slate-400"\} />\n                        <span className=\{`text-5xl lg:text-6xl font-display font-bold w-\[60px\] lg:w-\[80px\] text-center \${state\.timer <= 8 \? \'text-white\' : \'text-yellow-400\'}`\}>\n                          \{state\.timer\}\n                        </span>\n                   </div>)',
    r'{state.showTimer && (\1)}',
    text
)

# Broadcast mode timer
text = re.sub(
    r'(<div className={`w-\[4\.5rem\] border-slate-700 p-2 flex items-center justify-center text-2xl font-bold font-display shrink-0 \${state\.timer <= 8 && state\.isTimerRunning \? \'text-red-500 animate-pulse\' : \'text-yellow-400\'} border-l-\[3px\]`}>\n                \{state\.timer\}\n              </div>)',
    r'{state.showTimer && (\n              \1\n              )}',
    text
)

with open('components/ScoreboardDisplay.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated ScoreboardDisplay.tsx")
