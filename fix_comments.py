import re
with open('components/ScoreboardDisplay.tsx', 'r') as f:
    code = f.read()

code = code.replace('<!-- Vertical Center Divider (removed) -->', '')
code = code.replace('<!-- <div className="h-[3px] bg-slate-700 w-full shrink-0" /> -->', '')
code = code.replace('<!-- Vertical Center Divider -->', '')

with open('components/ScoreboardDisplay.tsx', 'w') as f:
    f.write(code)
