import re
text = open('components/ScoreboardControls.tsx').read()
start_marker = "{/* Manual Batter Control */}"
end_marker = "<div className=\"mt-4 pt-4 border-t w-full\">"
print(text[text.find(start_marker):text.find(end_marker)])
