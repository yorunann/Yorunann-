const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components/ScoreboardControls.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = "import { LineupImportModal } from './LineupImportModal';\n" + content;

content = content.replace(
  "const [cropModalOpen, setCropModalOpen] = useState(false);",
  "const [cropModalOpen, setCropModalOpen] = useState(false);\n  const [importModalOpen, setImportModalOpen] = useState(false);"
);

content = content.replace(
  "{/* Lineup Header */}",
  `<div className="flex justify-between items-center px-4 pt-4">
              <h3 className="font-bold text-slate-800">{language === 'en' ? 'Lineup' : language === 'zh' ? '打線' : 'ラインナップ'}</h3>
              <button 
                onClick={() => setImportModalOpen(true)}
                className="text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-2 py-1 rounded border border-indigo-200 transition-colors"
              >
                {language === 'en' ? 'Paste Import' : language === 'zh' ? '貼上匯入' : '貼り付けてインポート'}
              </button>
            </div>
            {/* Lineup Header */}`
);

content = content.replace(
  "{cropModalOpen && (",
  `<LineupImportModal 
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        language={language}
        onImport={(players) => {
           const newDraft = { ...draft, lineup: [...draft.lineup, ...players] };
           setDraft(newDraft);
           dispatch({ type: 'APPLY_TEAM_CONFIG', team: teamKey, config: newDraft });
        }}
      />
      {cropModalOpen && (`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched ScoreboardControls.tsx again');
