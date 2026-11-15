import re
with open('components/ScoreboardDisplay.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace all occurrences of style={{ animation: state.animation.isLocked ? 'none' : 'fadeOut 0.5s ease-in-out 4.5s forwards' }}
# and style={{ animation: state.animation.isLocked ? 'none' : 'outroContainer 0.5s cubic-bezier(0.4, 0, 0.2, 1) 4.5s forwards' }}

old_fade = "style={{ animation: state.animation.isLocked ? 'none' : 'fadeOut 0.5s ease-in-out 4.5s forwards' }}"
new_fade = "style={{ animation: state.animation.isLocked ? 'none' : state.animation.isExiting ? 'fadeOut 0.5s ease-in-out forwards' : 'fadeOut 0.5s ease-in-out 4.5s forwards' }}"
text = text.replace(old_fade, new_fade)

old_outro = "style={{ animation: state.animation.isLocked ? 'none' : 'outroContainer 0.5s cubic-bezier(0.4, 0, 0.2, 1) 4.5s forwards' }}"
new_outro = "style={{ animation: state.animation.isLocked ? 'none' : state.animation.isExiting ? 'outroContainer 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards' : 'outroContainer 0.5s cubic-bezier(0.4, 0, 0.2, 1) 4.5s forwards' }}"
text = text.replace(old_outro, new_outro)

with open('components/ScoreboardDisplay.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
