import re

with open('components/ScoreboardDisplay.tsx', 'r') as f:
    code = f.read()

# Make the score background a bit more distinct as requested (slightly darker than team color)
# The user wants "現在分數背景顏色（也就是比隊伍色深一點的顏色）當分隔線"
# We can use a combination of black overlay and the team color as the background, or simply
# use a darker slate/cyan color that acts as a separator.
# Since team colors vary, the safest approach to make it "darker than the team color" 
# is to use a semi-transparent black overlay on top of the team color, or a neutral dark color.
# Let's change the score background to bg-black/40 (darker than previous bg-black/10) to act as a stronger separator.

code = code.replace(
    'className={`bg-black/10 border-l-[2px] border-black/30 px-2 flex items-center justify-center text-3xl font-black font-display text-yellow-400 shrink-0 relative z-10 cursor-pointer hover:bg-white/20 transition-colors h-full`}',
    'className={`bg-black/30 border-l-[2px] border-black/40 px-2 flex items-center justify-center text-3xl font-black font-display text-yellow-400 shrink-0 relative z-10 cursor-pointer hover:bg-white/20 transition-colors h-full`}'
)

with open('components/ScoreboardDisplay.tsx', 'w') as f:
    f.write(code)
