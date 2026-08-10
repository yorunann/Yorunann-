const fs = require('fs');
let content = fs.readFileSync('components/ScoreboardControls.tsx', 'utf8');

// Fix the start of the info tab
content = content.replace(
  /        {activeTab === 'info' && \(\n          <><\/div>/,
  `        {activeTab === 'info' && (\n          <>\n`
);

fs.writeFileSync('components/ScoreboardControls.tsx', content);
