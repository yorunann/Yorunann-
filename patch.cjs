const fs = require('fs');

// 1. Update App.tsx version
let appContent = fs.readFileSync('App.tsx', 'utf8');
appContent = appContent.replace('26.8.13.1 ver.', '26.8.13.2 ver.');
fs.writeFileSync('App.tsx', appContent);

// 2. ScoreboardDisplay.tsx RHE Due up batter order
let displayContent = fs.readFileSync('components/ScoreboardDisplay.tsx', 'utf8');
displayContent = displayContent.replace(
    `const batter = getBatter(battingTeam, offset);`,
    `const batterIndex = (battingTeam.currentBatterIndex + offset) % battingTeam.lineup.length;\n              const batter = battingTeam.lineup[batterIndex];`
);
displayContent = displayContent.replace(
    `#{batter.number}`,
    `{batterIndex + 1}.`
);
fs.writeFileSync('components/ScoreboardDisplay.tsx', displayContent);

// 3. ScoreboardControls.tsx
let controlsContent = fs.readFileSync('components/ScoreboardControls.tsx', 'utf8');

// First, extract InningsAndRHEEditor from the action tab
const rheSearch = `            {/* Global RHE and Innings Editor */}\n            <InningsAndRHEEditor state={state} dispatch={dispatch} language={language} />`;
controlsContent = controlsContent.replace(rheSearch, '');

// Now, insert it between Team Config and Game Info in info tab
const infoSearch = `              </div>\n            </div>\n\n            {/* Game Info Section */}`;
const infoReplace = `              </div>\n            </div>\n\n            {/* Global RHE and Innings Editor */}\n            <InningsAndRHEEditor state={state} dispatch={dispatch} language={language} />\n\n            {/* Game Info Section */}`;
controlsContent = controlsContent.replace(infoSearch, infoReplace);

// Also add an "Update Info" button in Game Info
const gameInfoSearch = `                  <button \n                    onClick={() => {\n                      const newInfos = [...(state.meta.gameInfos || []), 'New Info'];\n                      updateMeta('gameInfos', newInfos);\n                    }}\n                    className="flex items-center justify-center gap-1 text-sm bg-blue-50 text-blue-600 px-2 py-1.5 rounded border border-blue-200 hover:bg-blue-100 border-dashed"\n                  >\n                    <Plus size={14} /> Add Info\n                  </button>\n                </div>\n              </div>\n            </div>`;

// Wait, the string above might have different indentation or text. Let's just do a regex replace or just use the exact text.
const gameInfoAddButton = `                  <button \n                    onClick={() => {\n                      const newInfos = [...(state.meta.gameInfos || []), 'New Info'];\n                      updateMeta('gameInfos', newInfos);\n                    }}\n                    className="flex items-center justify-center gap-1 text-sm bg-blue-50 text-blue-600 px-2 py-1.5 rounded border border-blue-200 hover:bg-blue-100 border-dashed"\n                  >\n                    <Plus size={14} /> Add Info\n                  </button>`;

const gameInfoUpdateBtn = `\n                  <button \n                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 rounded text-sm shadow transition-transform active:scale-95 mt-2"\n                  >\n                    {language === 'zh' ? '更新資訊' : language === 'en' ? 'Update Info' : '情報更新'}\n                  </button>`;

controlsContent = controlsContent.replace(gameInfoAddButton, gameInfoAddButton + gameInfoUpdateBtn);

fs.writeFileSync('components/ScoreboardControls.tsx', controlsContent);
