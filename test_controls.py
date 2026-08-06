import re
text = open('components/ScoreboardControls.tsx').read()
start = text.find('          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">')
end = text.find('      {/* Settings & Timer */}')
print(text[start:end])
