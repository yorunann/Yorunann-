import re
text = open('components/ScoreboardDisplay.tsx').read()
match = re.search(r"if \(state\.variant === 'broadcast'\) \{", text)
if match:
    idx = match.start()
    print(text[idx:idx+1500])
else:
    print("Not found with state.variant")
