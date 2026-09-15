import re

with open('components/ScoreboardDisplay.tsx', 'r') as f:
    code = f.read()

def replace(target, replacement):
    global code
    if target in code:
        code = code.replace(target, replacement)
        print(f"Replaced:\n{target[:40]}...\n-> {replacement[:40]}...")
    else:
        print(f"Warning: Could not find target:\n{target[:60]}...")

# 1. Container bg
replace(
    'className={`absolute bg-gradient-to-br from-slate-900/50 via-slate-800/60 to-slate-900/50 backdrop-blur-xl border border-white/20 text-white font-display shadow-2xl shadow-black/50 pointer-events-auto overflow-hidden flex flex-col origin-top-left ${state.isAdjustmentMode ? \'cursor-move ring-4 ring-blue-500 ring-offset-4 ring-offset-transparent\' : \'\'}`}',
    'className={`absolute bg-gradient-to-br from-cyan-950/30 via-slate-900/50 to-teal-950/30 backdrop-blur-xl border border-white/20 text-white font-display shadow-2xl shadow-black/50 pointer-events-auto overflow-hidden flex flex-col origin-top-left ${state.isAdjustmentMode ? \'cursor-move ring-4 ring-blue-500 ring-offset-4 ring-offset-transparent\' : \'\'}`}'
)

# 2. Away Team Row (bg-slate-900/40 -> bg-gradient-to-b from-white/10 to-transparent)
# Let's check exactly what the away team row is right now. We changed it in a previous patch to:
# className="flex relative overflow-hidden shrink-0 min-h-0 bg-slate-900/40"
replace(
    'className="flex relative overflow-hidden shrink-0 min-h-0 bg-slate-900/40"',
    'className="flex relative overflow-hidden shrink-0 min-h-0 bg-gradient-to-b from-cyan-900/30 to-cyan-950/60"'
)

# 3. Home Team Row
# Currently: className="flex relative overflow-hidden shrink-0 bg-slate-800/40"
replace(
    'className="flex relative overflow-hidden shrink-0 bg-slate-800/40"',
    'className="flex relative overflow-hidden shrink-0 bg-gradient-to-b from-cyan-900/20 to-cyan-950/50"'
)

# 4. Away Score
# Currently: className={`bg-black/20 px-2 flex items-center justify-center text-3xl font-black font-display text-yellow-400 shrink-0 relative z-10 cursor-pointer hover:bg-white/20 transition-colors h-full`}
# Change to: transparent bg, but add a left border
replace(
    'className={`bg-black/20 px-2 flex items-center justify-center text-3xl font-black font-display text-yellow-400 shrink-0 relative z-10 cursor-pointer hover:bg-white/20 transition-colors h-full`}',
    'className={`bg-black/10 border-l-[2px] border-black/30 px-2 flex items-center justify-center text-3xl font-black font-display text-yellow-400 shrink-0 relative z-10 cursor-pointer hover:bg-white/20 transition-colors h-full`}'
)

# 5. Home Score
replace(
    'className={`bg-black/20 px-2 flex items-center justify-center text-3xl font-black font-display text-yellow-400 shrink-0 relative z-10 cursor-pointer hover:bg-white/20 transition-colors h-full`}',
    'className={`bg-black/10 border-l-[2px] border-black/30 px-2 flex items-center justify-center text-3xl font-black font-display text-yellow-400 shrink-0 relative z-10 cursor-pointer hover:bg-white/20 transition-colors h-full`}'
)

# 6. Inning
# Currently: className="p-2 flex flex-col items-center justify-center gap-2 shrink-0 relative bg-black/30"
replace(
    'className="p-2 flex flex-col items-center justify-center gap-2 shrink-0 relative bg-black/30"',
    'className="p-2 flex flex-col items-center justify-center gap-2 shrink-0 relative bg-cyan-950/40"'
)

# 7. Right Column (Balls/Strikes/Outs/Bases)
# Currently: className="px-2 flex flex-col items-center shrink-0 relative h-full bg-black/60"
replace(
    'className="px-2 flex flex-col items-center shrink-0 relative h-full bg-black/60"',
    'className="px-2 flex flex-col items-center shrink-0 relative h-full bg-cyan-950/60"'
)

# 8. Away Player Row
# Currently: className="bg-slate-800/60 px-2 flex items-center gap-2 text-xl font-bold uppercase overflow-hidden shrink-0 min-h-0 relative"
replace(
    'className="bg-slate-800/60 px-2 flex items-center gap-2 text-xl font-bold uppercase overflow-hidden shrink-0 min-h-0 relative"',
    'className="bg-cyan-950/50 px-2 flex items-center gap-2 text-xl font-bold uppercase overflow-hidden shrink-0 min-h-0 relative"'
)

# 9. Home Player Row
# Currently: className="px-2 flex items-center gap-2 text-xl font-bold uppercase overflow-hidden shrink-0 min-h-0 relative bg-slate-800/40"
replace(
    'className="px-2 flex items-center gap-2 text-xl font-bold uppercase overflow-hidden shrink-0 min-h-0 relative bg-slate-800/40"',
    'className="px-2 flex items-center gap-2 text-xl font-bold uppercase overflow-hidden shrink-0 min-h-0 relative bg-cyan-950/40"'
)

with open('components/ScoreboardDisplay.tsx', 'w') as f:
    f.write(code)

