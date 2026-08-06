import re

with open('components/ScoreboardDisplay.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Away Player Row
away_old = 'className="border-b-[3px] border-slate-700 p-2 flex items-center text-xl font-bold uppercase overflow-hidden shrink-0 relative"'
away_new = 'className="border-b-[3px] border-slate-700 px-2 flex items-center text-xl font-bold uppercase overflow-hidden shrink-0 min-h-0 relative"'
text = text.replace(away_old, away_new)

# 2. Home Player Row
home_old = 'className="p-2 flex items-center gap-3 text-xl font-bold uppercase overflow-hidden shrink-0 relative"'
home_new = 'className="px-2 flex items-center gap-3 text-xl font-bold uppercase overflow-hidden shrink-0 min-h-0 relative"'
text = text.replace(home_old, home_new)

# 3. Team Row Away
team_away_old = '''                  <div 
                    className="flex relative overflow-hidden shrink-0"
                    style={{ height: `${state.meta.broadcastTeamRowHeight ?? 72}px` }}
                  >
                    <div className="absolute inset-0 opacity-20" style={{ backgroundColor: state.awayTeam.color }}></div>
                    <div className="flex-1 p-2 flex items-center gap-3 min-w-0 relative z-10">'''

team_away_new = '''                  <div 
                    className="flex relative overflow-hidden shrink-0 min-h-0"
                    style={{ height: `${state.meta.broadcastTeamRowHeight ?? 72}px` }}
                  >
                    <div className="absolute inset-0 opacity-20" style={{ backgroundColor: state.awayTeam.color }}></div>
                    <div className="flex-1 px-2 flex items-center gap-3 min-w-0 relative z-10 h-full">'''
text = text.replace(team_away_old, team_away_new)

# 4. Team Row Home
team_home_old = '''                  <div 
                    className="flex relative overflow-hidden shrink-0"
                    style={{ height: `${state.meta.broadcastTeamRowHeight ?? 72}px` }}
                  >
                    <div className="absolute inset-0 opacity-20" style={{ backgroundColor: state.homeTeam.color }}></div>
                    <div className="flex-1 p-2 flex items-center gap-3 min-w-0 relative z-10">'''

team_home_new = '''                  <div 
                    className="flex relative overflow-hidden shrink-0 min-h-0"
                    style={{ height: `${state.meta.broadcastTeamRowHeight ?? 72}px` }}
                  >
                    <div className="absolute inset-0 opacity-20" style={{ backgroundColor: state.homeTeam.color }}></div>
                    <div className="flex-1 px-2 flex items-center gap-3 min-w-0 relative z-10 h-full">'''
text = text.replace(team_home_old, team_home_new)

# 5. Team Row Away Score
score_away_old = 'className={`w-[4.5rem] border-slate-700 p-2 flex items-center justify-center text-3xl font-black font-display text-yellow-400 shrink-0 relative z-10 cursor-pointer hover:bg-white/10 transition-colors border-l-[3px]`}'
score_away_new = 'className={`w-[4.5rem] border-slate-700 px-2 flex items-center justify-center text-3xl font-black font-display text-yellow-400 shrink-0 relative z-10 cursor-pointer hover:bg-white/10 transition-colors border-l-[3px] h-full`}'
text = text.replace(score_away_old, score_away_new)

# 6. Team Row Home Score
score_home_old = 'className={`w-[4.5rem] border-slate-700 p-2 flex items-center justify-center text-3xl font-black font-display text-yellow-400 shrink-0 relative z-10 cursor-pointer hover:bg-white/10 transition-colors border-l-[3px]`}'
score_home_new = 'className={`w-[4.5rem] border-slate-700 px-2 flex items-center justify-center text-3xl font-black font-display text-yellow-400 shrink-0 relative z-10 cursor-pointer hover:bg-white/10 transition-colors border-l-[3px] h-full`}'
text = text.replace(score_home_old, score_home_new)


# 7. Right Column Container
right_col_old = '''            {/* Right Column (Count & Diamond) */}
            <div 
              className="py-2 px-2 flex flex-col justify-center items-center shrink-0 relative h-full"
              style={{ width: `${state.meta.broadcastRightColumnWidth ?? 150}px` }}
            >'''

right_col_new = '''            {/* Right Column (Count & Diamond) */}
            <div 
              className="px-2 flex flex-col justify-center items-center shrink-0 relative h-full"
              style={{ width: `${state.meta.broadcastRightColumnWidth ?? 150}px` }}
            >'''
text = text.replace(right_col_old, right_col_new)

with open('components/ScoreboardDisplay.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

