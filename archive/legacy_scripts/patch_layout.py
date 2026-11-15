import re

with open('components/ScoreboardDisplay.tsx', 'r') as f:
    code = f.read()

# 1. Left column container
code = code.replace(
    '<div className={`flex flex-col justify-center flex-1 border-r-[3px] border-slate-700 min-w-0`}>',
    '<div className={`flex flex-col justify-center flex-1 min-w-0`}>'
)

# 2. Away player row
code = code.replace(
    'className="border-b-[3px] border-slate-700 px-2 flex items-center gap-2 text-xl font-bold uppercase overflow-hidden shrink-0 min-h-0 relative"',
    'className="bg-slate-800/40 px-2 flex items-center gap-2 text-xl font-bold uppercase overflow-hidden shrink-0 min-h-0 relative"'
)

# 3. Away team row wrapper
code = code.replace(
    '<div className={`flex ${showHomePlayer ? \'border-b-[3px]\' : \'\'} border-slate-700 shrink-0`}>',
    '<div className={`flex shrink-0 bg-slate-900/40`}>'
)

# 4. Away team info block (left part of away team row)
code = code.replace(
    '<div className={`flex flex-col flex-1 border-slate-700 min-w-0 border-r-[3px]`}>',
    '<div className={`flex flex-col flex-1 min-w-0`}>'
)

# 5. Away team score block
code = code.replace(
    'className={`border-slate-700 px-2 flex items-center justify-center text-3xl font-black font-display text-yellow-400 shrink-0 relative z-10 cursor-pointer hover:bg-white/10 transition-colors border-l-[3px] h-full`}',
    'className={`bg-black/20 px-2 flex items-center justify-center text-3xl font-black font-display text-yellow-400 shrink-0 relative z-10 cursor-pointer hover:bg-white/10 transition-colors h-full`}'
)

# 6. Home team row wrapper
# Wait, let's see how Home team row is defined. It's likely right after Away team row.
# Ah, the structure is:
# <div className="flex border-b-[3px] ..."> (Away)
# <div className="flex ..."> (Home)
# Wait, let's check the code for Home team row wrapper.
