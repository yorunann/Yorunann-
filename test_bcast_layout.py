text = open('components/ScoreboardDisplay.tsx').read()
start = text.find('// broadcast UI')
if start == -1:
    start = text.find('className="absolute bottom-5 left-5 pointer-events-auto"')
if start != -1:
    print(text[start-100:start+2000])
