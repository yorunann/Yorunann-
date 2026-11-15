import re
with open('components/ScoreboardDisplay.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("style={{ animation: 'outroContainer 0.5s cubic-bezier(0.4, 0, 0.2, 1) 4.5s forwards' }}",
                    "style={{ animation: state.animation.isLocked ? 'none' : 'outroContainer 0.5s cubic-bezier(0.4, 0, 0.2, 1) 4.5s forwards' }}")

with open('components/ScoreboardDisplay.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
