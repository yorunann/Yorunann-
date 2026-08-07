import re
with open("components/ScoreboardDisplay.tsx", "r") as f:
    text = f.read()

text = re.sub(
    r'className=\{(?:`|\')font-display text-2xl shrink-0 \$\{state\.isAdjustmentMode \? \'cursor-pointer\' : \'\'\} \$\{state\.timer <= 8 && state\.isTimerRunning && showBroadcastTimer \? \'text-red-500 animate-pulse\' : \'text-yellow-400\'\} \$\{\!showBroadcastTimer \? \'opacity-30\' : \'\'\}(?:`|\')\}',
    'className={`font-display shrink-0 ${state.isAdjustmentMode ? \'cursor-pointer\' : \'\'} ${state.timer <= 8 && state.isTimerRunning && showBroadcastTimer ? \'text-red-500 animate-pulse\' : \'text-yellow-400\'} ${!showBroadcastTimer ? \'opacity-30\' : \'\'}`}\n                          style={{ fontSize: `${state.meta.broadcastTimerSize ?? 24}px` }}',
    text
)

text = re.sub(
    r'<div className="text-2xl font-black font-display">\{state\.inning\}<\/div>',
    '<div className="font-black font-display" style={{ fontSize: `${state.meta.broadcastInningSize ?? 24}px` }}>{state.inning}</div>',
    text
)

with open("components/ScoreboardDisplay.tsx", "w") as f:
    f.write(text)
print("Done")
