import re

with open('components/ScoreboardDisplay.tsx', 'r') as f:
    code = f.read()

target = "className={`absolute bg-slate-900/90 backdrop-blur-md border-[4px] border-slate-700 text-white font-display shadow-2xl pointer-events-auto overflow-hidden flex flex-col origin-top-left ${state.isAdjustmentMode ? 'cursor-move ring-4 ring-blue-500 ring-offset-4 ring-offset-transparent' : ''}`}"
replacement = "className={`absolute bg-gradient-to-br from-slate-900/60 via-slate-800/70 to-slate-900/60 backdrop-blur-md border border-white/20 text-white font-display shadow-[0_8px_32px_rgba(0,0,0,0.5)] pointer-events-auto overflow-hidden flex flex-col origin-top-left ${state.isAdjustmentMode ? 'cursor-move ring-4 ring-blue-500 ring-offset-4 ring-offset-transparent' : ''}`}"

code = code.replace(target, replacement)

with open('components/ScoreboardDisplay.tsx', 'w') as f:
    f.write(code)

