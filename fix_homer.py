import re

with open('components/ScoreboardDisplay.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("'ツーラン'", "'2ランホームラン'")
text = text.replace("'スリーラン'", "'3ランホームラン'")

with open('components/ScoreboardDisplay.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

with open('components/ScoreboardControls.tsx', 'r', encoding='utf-8') as f:
    text = f.read()
    
# Fix the ts error in ScoreboardControls.tsx
text = text.replace('language={language || \'zh\'}', 'language={language}')
with open('components/ScoreboardControls.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Done")
