import re
with open('components/ScoreboardControls.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('col-span-1 md:col-span-2 flex mt-2')
print(text[idx+1800:idx+2800])
