const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components/ScoreboardControls.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// fix double declare
content = content.replace(
  "const [importModalOpen, setImportModalOpen] = useState(false);\n  const [importModalOpen, setImportModalOpen] = useState(false);",
  "const [importModalOpen, setImportModalOpen] = useState(false);"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed double importModalOpen');
