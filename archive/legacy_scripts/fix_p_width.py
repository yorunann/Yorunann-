import re

with open('components/ScoreboardDisplay.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('<span className="mr-2 shrink-0 text-slate-400 font-bold">', '<span className="mr-2 shrink-0 text-slate-400 font-bold w-6 text-center inline-block">')

with open('components/ScoreboardDisplay.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
