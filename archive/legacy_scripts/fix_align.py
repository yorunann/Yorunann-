import re
with open("components/ScoreboardDisplay.tsx", "r") as f:
    text = f.read()

text = re.sub(
    r'<span className="mr-2 shrink-0 text-slate-400 font-bold w-6 text-center inline-block">\{state\.awayTeam\.currentBatterIndex \+ 1\}\.<\/span>',
    '<span className="mr-2 shrink-0 text-slate-400 font-bold w-8 text-right inline-block">{state.awayTeam.currentBatterIndex + 1}.</span>',
    text
)

text = re.sub(
    r'<span className="mr-2 shrink-0 text-slate-400 font-bold w-6 text-center inline-block">P<\/span>',
    '<span className="mr-2 shrink-0 text-slate-400 font-bold w-8 text-right inline-block">P</span>',
    text
)

text = re.sub(
    r'<span className="mr-2 shrink-0 text-slate-400 font-bold w-6 text-center inline-block">\{state\.homeTeam\.currentBatterIndex \+ 1\}\.<\/span>',
    '<span className="mr-2 shrink-0 text-slate-400 font-bold w-8 text-right inline-block">{state.homeTeam.currentBatterIndex + 1}.</span>',
    text
)

with open("components/ScoreboardDisplay.tsx", "w") as f:
    f.write(text)
print("Done")
