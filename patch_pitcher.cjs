const fs = require('fs');
let content = fs.readFileSync('components/ScoreboardDisplay.tsx', 'utf8');

const pitcherBlock = `
                    {/* Pitcher */}
                    <div className="mt-2 pt-2 border-t border-slate-800">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 px-1">Pitcher</div>
                        <div className={\`flex justify-between items-center px-1.5 sm:px-2 py-1 rounded transition-colors \${isTeamPitching ? "bg-blue-600/30 ring-1 ring-blue-500" : "bg-slate-900"}\`}>
                            <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                                <span className="text-[10px] sm:text-xs text-slate-400 font-mono w-3 sm:w-4 shrink-0">P.</span>
                                <span className={\`text-[10px] sm:text-xs font-bold truncate \${isTeamPitching ? "text-white" : "text-slate-300"}\`}>
                                    {team.pitcher.name}
                                    {team.pitcher.number && <span className="ml-1 text-[9px] sm:text-[10px] text-slate-500">#{team.pitcher.number}</span>}
                                </span>
                            </div>
                            {(state.showCount ?? true) && <span className="text-[9px] sm:text-[10px] font-mono text-slate-500 shrink-0 ml-2">P: {team.pitcher.stat || 0}</span>}
                        </div>
                    </div>
`;

content = content.replace(
    `                    </SortableContext>\n\n                    {/* Bench List */}`,
    `                    </SortableContext>\n${pitcherBlock}\n                    {/* Bench List */}`
);

fs.writeFileSync('components/ScoreboardDisplay.tsx', content);
