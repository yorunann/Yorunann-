import re
text = open('components/ScoreboardControls.tsx').read()

start = text.find("{activeTab === 'controls' && (")
end = text.find("{activeTab === 'info' && (")

chunk = text[start:end]
open_count = len(re.findall(r'<div', chunk))
close_count = len(re.findall(r'</div', chunk))
print(f"Open: {open_count}, Close: {close_count}")

# Find Settings & Timer
settings_idx = chunk.find("{/* Settings & Timer */}")
chunk_before = chunk[:settings_idx]
open_count_before = len(re.findall(r'<div', chunk_before))
close_count_before = len(re.findall(r'</div', chunk_before))
print(f"Before Settings Open: {open_count_before}, Close: {close_count_before}")

chunk_after = chunk[settings_idx:]
open_count_after = len(re.findall(r'<div', chunk_after))
close_count_after = len(re.findall(r'</div', chunk_after))
print(f"After Settings Open: {open_count_after}, Close: {close_count_after}")
