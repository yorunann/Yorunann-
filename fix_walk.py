import re
with open('components/ScoreboardControls.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = 'className="flex gap-2 w-full mt-1 flex-1 min-h-[36px]"'
repl = 'className="flex gap-2 w-full flex-1 min-h-[36px]"'
text = text.replace(target, repl)

with open('components/ScoreboardControls.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
