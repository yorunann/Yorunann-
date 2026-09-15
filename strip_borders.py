import re

with open('components/ScoreboardDisplay.tsx', 'r') as f:
    content = f.read()

# 1. Left column container border-r-[3px]
content = content.replace(
    '<div className={`flex flex-col justify-center flex-1 border-r-[3px] border-slate-700 min-w-0`}>',
    '<div className={`flex flex-col justify-center flex-1 min-w-0`}>'
)

# 2. Away Player Row border-b-[3px] -> Add bg
content = content.replace(
    'className="border-b-[3px] border-slate-700 px-2 flex items-center gap-2 text-xl font-bold uppercase overflow-hidden shrink-0 min-h-0 relative"',
    'className="bg-slate-800/60 px-2 flex items-center gap-2 text-xl font-bold uppercase overflow-hidden shrink-0 min-h-0 relative"'
)

# 3. Teams & Inning Row border-b-[3px]
content = content.replace(
    '<div className={`flex ${showHomePlayer ? \'border-b-[3px]\' : \'\'} border-slate-700 shrink-0`}>',
    '<div className={`flex shrink-0`}>'
)

# 4. Teams wrapper border-r-[3px]
content = content.replace(
    '<div className={`flex flex-col flex-1 border-slate-700 min-w-0 border-r-[3px]`}>',
    '<div className={`flex flex-col flex-1 min-w-0`}>'
)

# 5. Away team row (add bg)
content = content.replace(
    '<div \n                    className="flex relative overflow-hidden shrink-0 min-h-0"\n                    style={{ height: `${state.meta.broadcastTeamRowHeight ?? 72}px` }}\n                  >',
    '<div \n                    className="flex relative overflow-hidden shrink-0 min-h-0 bg-slate-900/40"\n                    style={{ height: `${state.meta.broadcastTeamRowHeight ?? 72}px` }}\n                  >'
)
# (Fixing indentation and formatting in regex for safe replace)

def safe_replace(target, replacement):
    global content
    if target in content:
        content = content.replace(target, replacement)
    else:
        print(f"Failed to find: {target[:50]}...")

safe_replace(
    'className="flex relative overflow-hidden shrink-0 min-h-0"',
    'className="flex relative overflow-hidden shrink-0 min-h-0 bg-slate-900/40"'
)

# 6. Away score border-l-[3px]
safe_replace(
    'className={`border-slate-700 px-2 flex items-center justify-center text-3xl font-black font-display text-yellow-400 shrink-0 relative z-10 cursor-pointer hover:bg-white/10 transition-colors border-l-[3px] h-full`}',
    'className={`bg-black/20 px-2 flex items-center justify-center text-3xl font-black font-display text-yellow-400 shrink-0 relative z-10 cursor-pointer hover:bg-white/20 transition-colors h-full`}'
)

# 7. Vertical Center Divider
safe_replace(
    '<!-- Vertical Center Divider -->', 
    '<!-- Vertical Center Divider (removed) -->' # Doesn't matter
)
safe_replace(
    '<div className="h-[3px] bg-slate-700 w-full shrink-0" />',
    '<!-- <div className="h-[3px] bg-slate-700 w-full shrink-0" /> -->'
)

# 8. Home team row (add bg)
safe_replace(
    'className="flex relative overflow-hidden shrink-0"\n                    style={{ height: `${state.meta.broadcastTeamRowHeight ?? 72}px` }}',
    'className="flex relative overflow-hidden shrink-0 bg-slate-800/40"\n                    style={{ height: `${state.meta.broadcastTeamRowHeight ?? 72}px` }}'
)
# Alternatively, if exact match fails:
content = re.sub(
    r'className="flex relative overflow-hidden shrink-0"(\s*)style=\{\{ height: `\$\{state.meta.broadcastTeamRowHeight \?\? 72\}px` \}\}',
    r'className="flex relative overflow-hidden shrink-0 bg-slate-800/40"\1style={{ height: `${state.meta.broadcastTeamRowHeight ?? 72}px` }}',
    content
)

# 9. Home score border-l-[3px]
# Note: since we already replaced the away one, let's see if this one also needs replacement. The class name is exactly the same, so `safe_replace` above would only replace the first occurrence if it wasn't global. `replace` is global. So both are replaced!

# 10. Inning section (add bg)
content = re.sub(
    r'className="p-2 flex flex-col items-center justify-center gap-2 shrink-0 relative"(\s*)style=\{\{ width: `\$\{state.meta.broadcastInningWidth \?\? 56\}px` \}\}',
    r'className="p-2 flex flex-col items-center justify-center gap-2 shrink-0 relative bg-black/30"\1style={{ width: `${state.meta.broadcastInningWidth ?? 56}px` }}',
    content
)

# 11. Right Column (add darker bg)
content = re.sub(
    r'className="px-2 flex flex-col items-center shrink-0 relative h-full"(\s*)style=\{\{ width: `\$\{state.meta.broadcastRightColumnWidth \?\? 150\}px` \}\}',
    r'className="px-2 flex flex-col items-center shrink-0 relative h-full bg-black/60"\1style={{ width: `${state.meta.broadcastRightColumnWidth ?? 150}px` }}',
    content
)

# 12. Also need to ensure team logo borders are either removed or subdued.
# border-[3px] border-slate-700 -> border-[2px] border-white/20
content = content.replace(
    'className="rounded-full border-[3px] border-slate-700 overflow-hidden flex items-center justify-center bg-slate-800 shrink-0 transition-all"',
    'className="rounded-full border border-white/20 overflow-hidden flex items-center justify-center bg-slate-800 shrink-0 transition-all"'
)


with open('components/ScoreboardDisplay.tsx', 'w') as f:
    f.write(content)

