import re

with open('components/ScoreboardControls.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('language={language}', 'language={language as "en" | "zh" | "ja"}')

with open('components/ScoreboardControls.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Done")
