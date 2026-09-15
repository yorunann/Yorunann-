import re

with open('components/ScoreboardDisplay.tsx', 'r') as f:
    code = f.read()

# Replace Home Player Row style
target = 'className="px-2 flex items-center gap-2 text-xl font-bold uppercase overflow-hidden shrink-0 min-h-0 relative"'
replacement = 'className="bg-cyan-950/40 px-2 flex items-center gap-2 text-xl font-bold uppercase overflow-hidden shrink-0 min-h-0 relative"'

if target in code:
    code = code.replace(target, replacement)
    print("Replaced home player row style")

with open('components/ScoreboardDisplay.tsx', 'w') as f:
    f.write(code)
