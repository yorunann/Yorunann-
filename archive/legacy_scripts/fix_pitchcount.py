import re
with open('components/ScoreboardDisplay.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("const showBroadcastPitchCount = state.meta.broadcastShowPitchCount ?? true;", "const showBroadcastPitchCount = state.meta.broadcastShowPitchCount ?? false;")

with open('components/ScoreboardDisplay.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

