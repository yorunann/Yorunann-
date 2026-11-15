with open('components/ScoreboardDisplay.tsx', 'r') as f:
    code = f.read()

# Lighten the count area a bit
code = code.replace(
    'className="px-2 flex flex-col items-center shrink-0 relative h-full bg-cyan-950/60"',
    'className="px-2 flex flex-col items-center shrink-0 relative h-full bg-cyan-950/40 backdrop-blur-md"'
)

with open('components/ScoreboardDisplay.tsx', 'w') as f:
    f.write(code)
