import re
text = open('components/ScoreboardControls.tsx').read()
start_marker = "{activeTab === 'controls' && ("
end_marker = "{/* Settings & Timer */}"
print(text[text.find(start_marker):text.find(end_marker)])
