import re
text = open('components/ScoreboardControls.tsx').read()
start_marker = "          <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">"
end_marker = "      {/* Settings & Timer */}"
chunk = text[text.find(start_marker):text.find(end_marker)]
print(chunk)
