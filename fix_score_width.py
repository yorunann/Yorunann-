import re

with open('components/ScoreboardDisplay.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Away Score Box
away_score_old = '''                    <div 
                      className={`w-[4.5rem] border-slate-700 px-2 flex items-center justify-center text-3xl font-black font-display text-yellow-400 shrink-0 relative z-10 cursor-pointer hover:bg-white/10 transition-colors border-l-[3px] h-full`}
                      onMouseDown={() => handleScoreMouseDown('away')}'''

away_score_new = '''                    <div 
                      className={`border-slate-700 px-2 flex items-center justify-center text-3xl font-black font-display text-yellow-400 shrink-0 relative z-10 cursor-pointer hover:bg-white/10 transition-colors border-l-[3px] h-full`}
                      style={{ width: `${state.meta.broadcastScoreWidth ?? 72}px` }}
                      onMouseDown={() => handleScoreMouseDown('away')}'''

if away_score_old in text:
    text = text.replace(away_score_old, away_score_new)
else:
    print("Could not find away score box")

# Home Score Box
home_score_old = '''                    <div 
                      className={`w-[4.5rem] border-slate-700 px-2 flex items-center justify-center text-3xl font-black font-display text-yellow-400 shrink-0 relative z-10 cursor-pointer hover:bg-white/10 transition-colors border-l-[3px] h-full`}
                      onMouseDown={() => handleScoreMouseDown('home')}'''

home_score_new = '''                    <div 
                      className={`border-slate-700 px-2 flex items-center justify-center text-3xl font-black font-display text-yellow-400 shrink-0 relative z-10 cursor-pointer hover:bg-white/10 transition-colors border-l-[3px] h-full`}
                      style={{ width: `${state.meta.broadcastScoreWidth ?? 72}px` }}
                      onMouseDown={() => handleScoreMouseDown('home')}'''

if home_score_old in text:
    text = text.replace(home_score_old, home_score_new)
else:
    print("Could not find home score box")

with open('components/ScoreboardDisplay.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
