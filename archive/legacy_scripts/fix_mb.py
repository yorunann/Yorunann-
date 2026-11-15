import re
with open('components/ScoreboardControls.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = 'className="w-full flex-1 min-h-[36px] bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded shadow transition-transform active:scale-95 text-xs text-center mb-1"'
repl = 'className="w-full flex-1 min-h-[36px] bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded shadow transition-transform active:scale-95 text-xs text-center"'
text = text.replace(target, repl)

with open('components/ScoreboardControls.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
