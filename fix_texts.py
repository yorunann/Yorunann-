import re

with open('components/ScoreboardDisplay.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Away Player AutoScalingText
away_text_old = '<AutoScalingText text={isAwayBatter ? `${awayPlayer.name} #${(\'number\' in awayPlayer) ? awayPlayer.number : \'\'}` : awayPlayer.name} align="left" />'
away_text_new = '<AutoScalingText text={`${awayPlayer.name} ${(\'number\' in awayPlayer && awayPlayer.number) ? \'#\' + awayPlayer.number : \'\'}`} className="leading-none" align="left" />'
text = text.replace(away_text_old, away_text_new)

# Home Player AutoScalingText
home_text_old = '<AutoScalingText text={!isAwayBatter ? `${homePlayer.name} #${(\'number\' in homePlayer) ? homePlayer.number : \'\'}` : homePlayer.name} align="left" />'
home_text_new = '<AutoScalingText text={`${homePlayer.name} ${(\'number\' in homePlayer && homePlayer.number) ? \'#\' + homePlayer.number : \'\'}`} className="leading-none" align="left" />'
text = text.replace(home_text_old, home_text_new)

# Team Name Away
team_away_old = '<AutoScalingText text={state.awayTeam.name} className="text-2xl font-bold tracking-wider uppercase" align="left" />'
team_away_new = '<AutoScalingText text={state.awayTeam.name} className="text-2xl font-bold tracking-wider uppercase leading-none" align="left" />'
text = text.replace(team_away_old, team_away_new)

# Team Name Home
team_home_old = '<AutoScalingText text={state.homeTeam.name} className="text-2xl font-bold tracking-wider uppercase" align="left" />'
team_home_new = '<AutoScalingText text={state.homeTeam.name} className="text-2xl font-bold tracking-wider uppercase leading-none" align="left" />'
text = text.replace(team_home_old, team_home_new)

with open('components/ScoreboardDisplay.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

