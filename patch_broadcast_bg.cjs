const fs = require('fs');
let code = fs.readFileSync('components/ScoreboardDisplay.tsx', 'utf-8');

code = code.replace(
  /className=\{\`absolute bg-slate-900\/90 backdrop-blur-md border-\[4px\] border-slate-700 text-white font-display shadow-2xl pointer-events-auto overflow-hidden flex flex-col origin-top-left \$\{state\.isAdjustmentMode \? 'cursor-move ring-4 ring-blue-500 ring-offset-4 ring-offset-transparent' : ''\}\`\}/,
  \`className={\\\`absolute bg-gradient-to-br from-slate-900/75 via-slate-800/80 to-slate-900/75 backdrop-blur-xl border-2 border-white/10 text-white font-display shadow-[0_8px_32px_rgba(0,0,0,0.5)] pointer-events-auto overflow-hidden flex flex-col origin-top-left \\\${state.isAdjustmentMode ? 'cursor-move ring-4 ring-blue-500 ring-offset-4 ring-offset-transparent' : ''}\\\`}\`
);

fs.writeFileSync('components/ScoreboardDisplay.tsx', code);
