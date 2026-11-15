import re

with open('components/ScoreboardDisplay.tsx', 'r') as f:
    content = f.read()

# 1. Update Away Team Row Background & Gradient
away_target = '''                  <div 
                    className="flex relative overflow-hidden shrink-0 min-h-0 bg-gradient-to-b from-slate-700/30 to-slate-900/60"
                    style={{ height: `${state.meta.broadcastTeamRowHeight ?? 72}px` }}
                  >
                    <div className="absolute inset-0 opacity-20" style={{ backgroundColor: state.awayTeam.color }}></div>'''

away_replacement = '''                  <div 
                    className="flex relative overflow-hidden shrink-0 min-h-0"
                    style={{ height: `${state.meta.broadcastTeamRowHeight ?? 72}px`, backgroundColor: state.awayTeam.color }}
                  >
                    {/* Gradient Overlay for lighting effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-black/40 pointer-events-none"></div>'''

if away_target in content:
    content = content.replace(away_target, away_replacement)
else:
    print("Warning: Away target not found")

# 2. Update Home Team Row Background & Gradient
home_target = '''                  <div 
                    className="flex relative overflow-hidden shrink-0 bg-gradient-to-b from-slate-700/20 to-slate-900/50"
                    style={{ height: `${state.meta.broadcastTeamRowHeight ?? 72}px` }}
                  >
                    {/* Team Row Resizer */}'''

home_replacement = '''                  <div 
                    className="flex relative overflow-hidden shrink-0"
                    style={{ height: `${state.meta.broadcastTeamRowHeight ?? 72}px`, backgroundColor: state.homeTeam.color }}
                  >
                    {/* Gradient Overlay for lighting effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-black/40 pointer-events-none"></div>
                    {/* Team Row Resizer */}'''

if home_target in content:
    content = content.replace(home_target, home_replacement)
else:
    print("Warning: Home target not found")

home_opacity_target = '''<div className="absolute inset-0 opacity-20" style={{ backgroundColor: state.homeTeam.color }}></div>'''
if home_opacity_target in content:
    content = content.replace(home_opacity_target, "")
else:
    print("Warning: Home opacity target not found")

# 3. Update Score Background to act as darker separator
score_target = '''className={`bg-black/30 border-l-[2px] border-black/40 px-2 flex items-center justify-center text-3xl font-black font-display text-yellow-400 shrink-0 relative z-10 cursor-pointer hover:bg-white/20 transition-colors h-full`}'''
score_replacement = '''className={`bg-black/40 border-l border-black/50 px-2 flex items-center justify-center text-3xl font-black font-display text-yellow-400 shrink-0 relative z-10 cursor-pointer hover:bg-white/20 transition-colors h-full`}'''

if score_target in content:
    content = content.replace(score_target, score_replacement)
else:
    print("Warning: Score target not found")

# 4. Add left border to Inning and Right Column
inning_target = '''className="p-2 flex flex-col items-center justify-center gap-2 shrink-0 relative bg-slate-700/50"'''
inning_replacement = '''className="p-2 flex flex-col items-center justify-center gap-2 shrink-0 relative bg-slate-700/50 border-l border-white/10 shadow-[-1px_0_0_rgba(0,0,0,0.5)]"'''

if inning_target in content:
    content = content.replace(inning_target, inning_replacement)
else:
    print("Warning: Inning target not found")

right_col_target = '''className="px-2 flex flex-col items-center shrink-0 relative h-full bg-blue-950/50 backdrop-blur-md"'''
right_col_replacement = '''className="px-2 flex flex-col items-center shrink-0 relative h-full bg-blue-950/50 backdrop-blur-md border-l border-white/10 shadow-[-1px_0_0_rgba(0,0,0,0.5)]"'''

if right_col_target in content:
    content = content.replace(right_col_target, right_col_replacement)
else:
    print("Warning: Right col target not found")

with open('components/ScoreboardDisplay.tsx', 'w') as f:
    f.write(content)

