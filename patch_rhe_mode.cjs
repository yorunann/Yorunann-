const fs = require('fs');
let content = fs.readFileSync('components/ScoreboardDisplay.tsx', 'utf8');

// 1. Remove TOP/BOT string
content = content.replace(
    `        {/* Header: Inning */}\n        <div className="flex justify-center items-center mb-8">\n          <div className="text-4xl lg:text-5xl font-bold text-yellow-400">\n            {state.isTop ? 'TOP' : 'BOT'} {state.inning}\n          </div>\n        </div>`,
    ``
);

// 2. Adjust margins for tighter spacing
content = content.replace(
    `className="grid items-center mb-6 px-6 py-4 bg-slate-800/50 rounded-xl border-2 border-slate-700 shadow-inner"`,
    `className="grid items-center mb-4 px-6 py-4 bg-slate-800/50 rounded-xl border-2 border-slate-700 shadow-inner"`
);
content = content.replace(
    `{/* Scoreboard Table */}\n        <div className="w-full overflow-x-auto mb-12">`,
    `{/* Scoreboard Table */}\n        <div className="w-full overflow-x-auto mb-8">`
);

// 3. Highlight current inning score
content = content.replace(
    `          return (\n            <td key={i} className="py-6 text-slate-300">`,
    `          const isCurrentInning = i === state.inning && ((team.name === state.awayTeam.name && state.isTop) || (team.name === state.homeTeam.name && !state.isTop));\n          return (\n            <td key={i} className={\`py-6 \${isCurrentInning ? 'text-yellow-400 animate-pulse drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' : 'text-slate-300'}\`}>`
);

fs.writeFileSync('components/ScoreboardDisplay.tsx', content);
