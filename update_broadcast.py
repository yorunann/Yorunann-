import re
with open("components/ScoreboardDisplay.tsx", "r") as f:
    text = f.read()

# Away team name
text = re.sub(
    r'<AutoScalingText text=\{state\.awayTeam\.name\} className="text-2xl font-bold tracking-wider uppercase leading-none" align="left" />',
    '<AutoScalingText text={state.awayTeam.name} className="font-bold tracking-wider uppercase leading-none" style={{ fontSize: `${state.meta.broadcastTeamNameSize ?? 24}px` }} align="left" />',
    text
)

# Home team name
text = re.sub(
    r'<AutoScalingText text=\{state\.homeTeam\.name\} className="text-2xl font-bold tracking-wider uppercase leading-none" align="left" />',
    '<AutoScalingText text={state.homeTeam.name} className="font-bold tracking-wider uppercase leading-none" style={{ fontSize: `${state.meta.broadcastTeamNameSize ?? 24}px` }} align="left" />',
    text
)

# Away score
text = re.sub(
    r'<AnimatedScore score=\{state\.awayTeam\.score\} color="#facc15" sizeClass="text-3xl" disableScale=\{true\} />',
    '<AnimatedScore score={state.awayTeam.score} color="#facc15" sizeClass="" style={{ fontSize: `${state.meta.broadcastScoreSize ?? 30}px` }} disableScale={true} />',
    text
)

# Home score
text = re.sub(
    r'<AnimatedScore score=\{state\.homeTeam\.score\} color="#facc15" sizeClass="text-3xl" disableScale=\{true\} />',
    '<AnimatedScore score={state.homeTeam.score} color="#facc15" sizeClass="" style={{ fontSize: `${state.meta.broadcastScoreSize ?? 30}px` }} disableScale={true} />',
    text
)

# Away Player name
text = re.sub(
    r'<AutoScalingText text=\{\`\$\{awayPlayer\.name\} \$\{\(\'number\' in awayPlayer && awayPlayer\.number\) \? \'#\' \+ awayPlayer\.number : \'\'\}\`\} className="leading-none" align="left" />',
    '<AutoScalingText text={`${awayPlayer.name} ${(\'number\' in awayPlayer && awayPlayer.number) ? \'#\' + awayPlayer.number : \'\'}`} className="leading-none" style={{ fontSize: `${state.meta.broadcastPlayerNameSize ?? 20}px` }} align="left" />',
    text
)

# Home Player name
text = re.sub(
    r'<AutoScalingText text=\{\`\$\{homePlayer\.name\} \$\{\(\'number\' in homePlayer && homePlayer\.number\) \? \'#\' \+ homePlayer\.number : \'\'\}\`\} className="leading-none" align="left" />',
    '<AutoScalingText text={`${homePlayer.name} ${(\'number\' in homePlayer && homePlayer.number) ? \'#\' + homePlayer.number : \'\'}`} className="leading-none" style={{ fontSize: `${state.meta.broadcastPlayerNameSize ?? 20}px` }} align="left" />',
    text
)

# Timer (Wait, timer is a normal div)
text = re.sub(
    r'\{state\.timer\}\s*<\/div>\s*\)\}',
    '{state.timer}\n                        </div>\n                      )}',
    text # Just checking if we can replace
)

with open("components/ScoreboardDisplay.tsx", "w") as f:
    f.write(text)
print("Done")
