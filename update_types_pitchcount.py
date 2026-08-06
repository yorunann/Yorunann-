import re
with open('types.ts', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("broadcastShowTimer?: boolean;", "broadcastShowTimer?: boolean;\n  broadcastShowPitchCount?: boolean;")

with open('types.ts', 'w', encoding='utf-8') as f:
    f.write(text)
