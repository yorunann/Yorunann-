import re
with open('components/ScoreboardControls.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = '''            {/* Middle Column (Count Controls) & Right Column (Event Controls) combined into 2 columns on small screens */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">'''

# Let's inspect what's after this
idx = text.find(target)
if idx != -1:
    print(text[idx:idx+1000])
