import re
text = open('components/ScoreboardControls.tsx').read()
start = text.find("{activeTab === 'controls' && (")
end = text.find("{activeTab === 'info' && (")
print(text[start:end])
