const fs = require('fs');
const content = fs.readFileSync('components/ScoreboardControls.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.includes('dispatch(')) {
    console.log(`Line ${i + 1}: ${line}`);
  }
});
