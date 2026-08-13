const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'reducer.ts');
let content = fs.readFileSync(filePath, 'utf8');

const oldCode = `    case 'NEXT_INNING':
      return { 
        ...state, 
        isTop: !state.isTop, 
        inning: state.isTop ? state.inning : state.inning + 1,
        balls: 0, strikes: 0, outs: 0, bases: [false, false, false],
        isTimerRunning: false,
        timer: 20
      };`;

const newCode = `    case 'NEXT_INNING': {
      const currentTeamKey = state.isTop ? 'awayTeam' : 'homeTeam';
      const currentTeamObj = state[currentTeamKey];
      const currentInningIdx = state.inning - 1;
      
      const newInningScores = [...currentTeamObj.inningScores];
      if (newInningScores[currentInningIdx] === null || newInningScores[currentInningIdx] === undefined) {
         newInningScores[currentInningIdx] = 0;
      }
      
      return { 
        ...state, 
        [currentTeamKey]: {
          ...currentTeamObj,
          inningScores: newInningScores
        },
        isTop: !state.isTop, 
        inning: state.isTop ? state.inning : state.inning + 1,
        balls: 0, strikes: 0, outs: 0, bases: [false, false, false],
        isTimerRunning: false,
        timer: state.initialTimer || 20
      };
    }`;

if (content.includes(oldCode)) {
    content = content.replace(oldCode, newCode);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully patched NEXT_INNING in reducer.ts');
} else {
    console.log('Failed to find old code in reducer.ts');
}
