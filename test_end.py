import re
text = open('components/ScoreboardControls.tsx').read()
idx = text.find("activeTab === 'lineup' &&")
print(text[idx-500:idx+50])
