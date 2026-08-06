import re
text = open('components/ScoreboardControls.tsx').read()

start_idx = text.find('return (')
end_idx = text.find('{/* Settings & Timer */}')

chunk = text[start_idx:end_idx]

div_open = len(re.findall(r'<div', chunk))
div_close = len(re.findall(r'</div', chunk))

print(f"Open: {div_open}, Close: {div_close}")
