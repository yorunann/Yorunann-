const fs = require('fs');
let content = fs.readFileSync('components/ScoreboardDisplay.tsx', 'utf8');

content = content.replace(
    `            <span className="text-[9px] sm:text-[10px] font-mono text-slate-500 shrink-0 ml-2">{p.stat}</span>\n        </div>`,
    `            {((isBench) || (state.showPlayerStat ?? true)) && <span className="text-[9px] sm:text-[10px] font-mono text-slate-500 shrink-0 ml-2">{p.stat}</span>}\n        </div>`
);

fs.writeFileSync('components/ScoreboardDisplay.tsx', content);
