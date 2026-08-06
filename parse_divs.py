import re
text = open('components/ScoreboardControls.tsx').read()
start = text.find("{activeTab === 'controls' && (")
if start != -1:
    end = text.find("{activeTab === 'info' && (")
    print(text[end-200:end+50])
