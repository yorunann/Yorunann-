import re
with open('components/ScoreboardControls.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace the multiple closing divs before the Broadcast mode
pattern = re.compile(r'(\s*</button>\s*</div>)\s*</div>\s*</div>\s*(<div className="mt-4 pt-4 border-t w-full">)')
text = pattern.sub(r'\1\n             \2', text)

with open('components/ScoreboardControls.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

