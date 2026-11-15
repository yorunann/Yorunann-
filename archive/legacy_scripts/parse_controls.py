import re
text = open('components/ScoreboardControls.tsx').read()
start_marker = "{activeTab === 'controls' && ("
end_marker = "{activeTab === 'info' && ("
chunk = text[text.find(start_marker):text.find(end_marker)]
print(chunk)
