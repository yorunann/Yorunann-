import re

with open('components/ScoreboardDisplay.tsx', 'r') as f:
    code = f.read()

# 1. Team rows to gray/slate gradients
code = code.replace(
    'bg-gradient-to-b from-cyan-900/30 to-cyan-950/60',
    'bg-gradient-to-b from-slate-700/30 to-slate-900/60'
)
code = code.replace(
    'bg-gradient-to-b from-cyan-900/20 to-cyan-950/50',
    'bg-gradient-to-b from-slate-700/20 to-slate-900/50'
)

# 2. Player rows to slate (gray)
code = code.replace(
    'className="bg-cyan-950/50 px-2 flex items-center gap-2 text-xl font-bold uppercase overflow-hidden shrink-0 min-h-0 relative"',
    'className="bg-slate-800/50 px-2 flex items-center gap-2 text-xl font-bold uppercase overflow-hidden shrink-0 min-h-0 relative"'
)
code = code.replace(
    'className="bg-cyan-950/40 px-2 flex items-center gap-2 text-xl font-bold uppercase overflow-hidden shrink-0 min-h-0 relative"',
    'className="bg-slate-800/40 px-2 flex items-center gap-2 text-xl font-bold uppercase overflow-hidden shrink-0 min-h-0 relative"'
)

# 3. Inning background brighter (e.g. slate-700/40 or slate-600/40)
code = code.replace(
    'className="p-2 flex flex-col items-center justify-center gap-2 shrink-0 relative bg-cyan-950/40"',
    'className="p-2 flex flex-col items-center justify-center gap-2 shrink-0 relative bg-slate-700/50"'
)

# 4. Balls/Strikes/Outs to deep blue
code = code.replace(
    'className="px-2 flex flex-col items-center shrink-0 relative h-full bg-cyan-950/40 backdrop-blur-md"',
    'className="px-2 flex flex-col items-center shrink-0 relative h-full bg-blue-950/50 backdrop-blur-md"'
)

with open('components/ScoreboardDisplay.tsx', 'w') as f:
    f.write(code)

