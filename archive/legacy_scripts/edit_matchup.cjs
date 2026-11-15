const fs = require('fs');

let content = fs.readFileSync('components/ScoreboardControls.tsx', 'utf8');

// 1. Add matchupDraft state and handleUpdateMatchup
content = content.replace(
  "  const updateActivePlayer = (role: 'batter' | 'pitcher', field: keyof Player, value: string) => {\n    if (role === 'batter' && activeBatter) {\n      dispatch({ type: 'UPDATE_LINEUP_PLAYER', team: activeBatterTeam, index: activeBatterTeamObj.currentBatterIndex, field, value });\n    } else if (role === 'pitcher' && activePitcher) {\n      dispatch({ type: 'UPDATE_TEAM', team: activePitcherTeam, field: 'pitcher', value: { ...activePitcher, [field]: value } });\n    }\n  };\n",
  `  const [matchupDraft, setMatchupDraft] = useState({ batter: activeBatter, pitcher: activePitcher });

  React.useEffect(() => {
    setMatchupDraft({ batter: activeBatter, pitcher: activePitcher });
  }, [activeBatter, activePitcher]);

  const handleUpdateMatchup = () => {
    if (matchupDraft.batter && activeBatter) {
      if (matchupDraft.batter.number !== activeBatter.number) dispatch({ type: 'UPDATE_LINEUP_PLAYER', team: activeBatterTeam, index: activeBatterTeamObj.currentBatterIndex, field: 'number', value: matchupDraft.batter.number });
      if (matchupDraft.batter.name !== activeBatter.name) dispatch({ type: 'UPDATE_LINEUP_PLAYER', team: activeBatterTeam, index: activeBatterTeamObj.currentBatterIndex, field: 'name', value: matchupDraft.batter.name });
    }
    if (matchupDraft.pitcher && activePitcher) {
      if (matchupDraft.pitcher.number !== activePitcher.number || matchupDraft.pitcher.name !== activePitcher.name) {
        dispatch({ type: 'UPDATE_TEAM', team: activePitcherTeam, field: 'pitcher', value: { ...activePitcher, number: matchupDraft.pitcher.number, name: matchupDraft.pitcher.name } });
      }
    }
  };

  const updateMatchupDraft = (role: 'batter' | 'pitcher', field: keyof Player, value: string) => {
    setMatchupDraft(prev => ({
      ...prev,
      [role]: prev[role] ? { ...prev[role], [field]: value } : null
    }));
  };

  const handleSelectBench = (role: 'batter' | 'pitcher', e: React.ChangeEvent<HTMLSelectElement>) => {
    const playerId = e.target.value;
    if (!playerId) return;
    const teamObj = role === 'batter' ? activeBatterTeamObj : activePitcherTeamObj;
    const player = teamObj.bench.find(p => p.id === playerId);
    if (player) {
      setMatchupDraft(prev => ({
        ...prev,
        [role]: prev[role] ? { ...prev[role], number: player.number, name: player.name } : null
      }));
    }
    e.target.value = ''; // Reset select
  };
`
);

// 2. Remove Quick Matchup Editor from its current place
const matchupBlockRegex = /\s*{\/\* Quick Matchup Editor \*\/}[\s\S]*?(?=            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">)/;
const matchupBlockMatch = content.match(matchupBlockRegex);
if (!matchupBlockMatch) {
  console.log("Could not find matchup block!");
  process.exit(1);
}
let matchupBlock = matchupBlockMatch[0];
content = content.replace(matchupBlockRegex, '');

// Modify matchupBlock to use new state, remove stat, add select for bench, add button
matchupBlock = matchupBlock.replace(/activeBatter\?/g, 'matchupDraft.batter?');
matchupBlock = matchupBlock.replace(/activePitcher\?/g, 'matchupDraft.pitcher?');
matchupBlock = matchupBlock.replace(/updateActivePlayer\(/g, 'updateMatchupDraft(');

// Use text-black for inputs
matchupBlock = matchupBlock.replace(/bg-white/g, 'bg-white text-black');

// Change batter stat input to bench select
matchupBlock = matchupBlock.replace(
  /<input\s+className="w-16 border rounded px-1 text-sm bg-white text-black shrink-0"\s+value={matchupDraft.batter\?\.stat \|\| ''}\s+onChange={\(e\) => updateMatchupDraft\('batter', 'stat', e\.target\.value\)}\s+placeholder="Avg"\s+\/>/g,
  `<select className="w-16 border rounded text-xs bg-white text-black shrink-0 outline-none" onChange={(e) => handleSelectBench('batter', e)} defaultValue="">
                    <option value="" disabled>{language === 'zh' ? '找板凳' : 'Bench'}</option>
                    {activeBatterTeamObj.bench.map(p => (
                      <option key={p.id} value={p.id}>{p.number} {p.name}</option>
                    ))}
                  </select>`
);

// Change pitcher stat input to bench select
matchupBlock = matchupBlock.replace(
  /<input\s+className="w-16 border rounded px-1 text-sm bg-white text-black shrink-0"\s+value={matchupDraft.pitcher\?\.stat \|\| ''}\s+onChange={\(e\) => updateMatchupDraft\('pitcher', 'stat', e\.target\.value\)}\s+placeholder="P: 0"\s+\/>/g,
  `<select className="w-16 border rounded text-xs bg-white text-black shrink-0 outline-none" onChange={(e) => handleSelectBench('pitcher', e)} defaultValue="">
                    <option value="" disabled>{language === 'zh' ? '找板凳' : 'Bench'}</option>
                    {activePitcherTeamObj.bench.map(p => (
                      <option key={p.id} value={p.id}>{p.number} {p.name}</option>
                    ))}
                  </select>`
);

// Add Update button to matchupBlock
matchupBlock = matchupBlock.replace(
  /<\/div>\n\s*<\/div>\n\s*$/,
  `  </div>
              <button onClick={handleUpdateMatchup} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded text-sm shadow transition-transform active:scale-95">
                {language === 'zh' ? '更新資訊' : language === 'en' ? 'Update Info' : '情報更新'}
              </button>
            </div>\n`
);

// 3. Insert matchupBlock below HR & Undo (which is below the grid)
const insertTarget = '      {/* Settings & Timer */}';
if (!content.includes(insertTarget)) {
  console.log("Could not find insertTarget!");
  process.exit(1);
}
content = content.replace(insertTarget, matchupBlock + '\n' + insertTarget);

// 4. Move Game Info
const gameInfoRegex = /\s*{\/\* Game Info Section \*\/}[\s\S]*?(?=<\/div>\n\s*<\/div>\n\s*{\/\* Bottom: Team & Lineup Config \*\/})/;
const gameInfoMatch = content.match(gameInfoRegex);
if (!gameInfoMatch) {
  console.log("Could not find game info!");
  process.exit(1);
}
let gameInfoBlock = gameInfoMatch[0];
gameInfoBlock += `\n        </div>`;
content = content.replace(gameInfoRegex, '');
content = content.replace(
  /<\/div>\n\s*{\/\* Bottom: Team & Lineup Config \*\/}/,
  `\n        {/* Bottom: Team & Lineup Config */}`
);

// Insert Game Info at the end of info tab
const endInfoTab = /<\/div>\n\s*<\/>\n\s*\)}/;
content = content.replace(endInfoTab, `</div>\n${gameInfoBlock}\n        </>\n        )}`);

fs.writeFileSync('components/ScoreboardControls.tsx', content);
console.log("Done");
