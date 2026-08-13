const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'reducer.ts');
let content = fs.readFileSync(filePath, 'utf8');

const oldCode = `    case 'ADD_PLAYER_TO_LINEUP': {
      const tKey = action.team === 'home' ? 'homeTeam' : 'awayTeam';
      const newPlayer: Player = { id: generateId(), name: 'New Player', number: '00', stat: '.000' };
      return {`;

const newCode = `    case 'ADD_PLAYER_TO_LINEUP': {
      const tKey = action.team === 'home' ? 'homeTeam' : 'awayTeam';
      const newPlayer: Player = { id: generateId(), name: 'NAME', number: '00', stat: '.000', position: 'DH' };
      return {`;

if (content.includes(oldCode)) {
    content = content.replace(oldCode, newCode);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully patched ADD_PLAYER_TO_LINEUP in reducer.ts');
} else {
    console.log('Failed to find old code in reducer.ts');
}
