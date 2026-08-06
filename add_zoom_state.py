import re
with open('App.tsx', 'r') as f:
    text = f.read()

target = "const [localDisplayMode, setLocalDisplayMode] = useState<GameState['displayMode'] | null>(null);"
replacement = target + "\n  const [displayZoom, setDisplayZoom] = useState(1);"

if target in text:
    text = text.replace(target, replacement)
    with open('App.tsx', 'w') as f:
        f.write(text)
    print("Success")
else:
    print("Failed to find target")
