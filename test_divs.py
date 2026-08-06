import re
text = open('components/ScoreboardControls.tsx').read()
start = text.find("{activeTab === 'controls' && (")
end = text.find("{activeTab === 'info' && (")
chunk = text[start:end]
open_count = len(re.findall(r'<div', chunk))
close_count = len(re.findall(r'</div', chunk))
print(f"Open: {open_count}, Close: {close_count}")
