import re
with open('components/ScoreboardControls.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace py-2 with py-2.5 for BATTER_OUT, SINGLE, DOUBLE, TRIPLE
text = text.replace('w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded shadow transition-transform active:scale-95 text-xs text-center mb-1',
                    'w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded shadow transition-transform active:scale-95 text-xs text-center mb-1')

text = text.replace('w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded shadow transition-transform active:scale-95 text-xs text-center',
                    'w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded shadow transition-transform active:scale-95 text-xs text-center')

with open('components/ScoreboardControls.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
