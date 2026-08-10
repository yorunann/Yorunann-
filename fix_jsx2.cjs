const fs = require('fs');
let content = fs.readFileSync('components/ScoreboardControls.tsx', 'utf8');

// I need to add two closing `</div>` tags right before `  );` 
content = content.replace(/      <\/div>\n  \);\n};/, '        </div>\n      </div>\n    </div>\n  );\n};');

fs.writeFileSync('components/ScoreboardControls.tsx', content);
