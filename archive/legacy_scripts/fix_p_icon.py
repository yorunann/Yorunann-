import re

with open('components/ScoreboardDisplay.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Away
old_away = '''                  {isAwayBatter ? (
                    <span className="mr-2 shrink-0">{state.awayTeam.currentBatterIndex + 1}.</span>
                  ) : (
                    <div className="w-7 h-7 border-[3px] border-slate-700 flex items-center justify-center text-lg shrink-0 text-slate-400 mr-2">P</div>
                  )}'''

new_away = '''                  {isAwayBatter ? (
                    <span className="mr-2 shrink-0 text-slate-400 font-bold">{state.awayTeam.currentBatterIndex + 1}.</span>
                  ) : (
                    <span className="mr-2 shrink-0 text-slate-400 font-bold">P</span>
                  )}'''

text = text.replace(old_away, new_away)

# Home
old_home = '''                  {!isAwayBatter ? (
                    <span className="mr-2 shrink-0">{state.homeTeam.currentBatterIndex + 1}.</span>
                  ) : (
                    <div className="w-7 h-7 border-[3px] border-slate-700 flex items-center justify-center text-lg shrink-0 text-slate-400">P</div>
                  )}'''

new_home = '''                  {!isAwayBatter ? (
                    <span className="mr-2 shrink-0 text-slate-400 font-bold">{state.homeTeam.currentBatterIndex + 1}.</span>
                  ) : (
                    <span className="mr-2 shrink-0 text-slate-400 font-bold">P</span>
                  )}'''

text = text.replace(old_home, new_home)

with open('components/ScoreboardDisplay.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
