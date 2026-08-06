import re

with open('components/ScoreboardControls.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(r"\'PREVIOUS_BATTER\'", "'PREVIOUS_BATTER'")
text = text.replace(r"\'en\'", "'en'")
text = text.replace(r"\'Previous Batter\'", "'Previous Batter'")
text = text.replace(r"\'zh\'", "'zh'")
text = text.replace(r"\'上一位打者\'", "'上一位打者'")
text = text.replace(r"\'前の打者へ\'", "'前の打者へ'")

with open('components/ScoreboardControls.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

