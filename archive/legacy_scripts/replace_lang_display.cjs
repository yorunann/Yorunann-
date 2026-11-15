const fs = require('fs');
let content = fs.readFileSync('components/ScoreboardDisplay.tsx', 'utf-8');

const replacements = [
  ["(language === 'zh' ? '陽春砲' : 'HOMERUN!')", "(language === 'zh' ? '陽春砲' : language === 'ja' ? 'ソロホームラン' : 'HOMERUN!')"],
  ["(language === 'zh' ? '兩分砲' : '2-RUN HOMER!')", "(language === 'zh' ? '兩分砲' : language === 'ja' ? 'ツーラン' : '2-RUN HOMER!')"],
  ["(language === 'zh' ? '三分砲' : '3-RUN HOMER!')", "(language === 'zh' ? '三分砲' : language === 'ja' ? 'スリーラン' : '3-RUN HOMER!')"],
  ["(language === 'zh' ? '滿貫砲' : 'GRAND SLAM!')", "(language === 'zh' ? '滿貫砲' : language === 'ja' ? '満塁ホームラン' : 'GRAND SLAM!')"],
  ["{language === 'zh' && (", "{(language === 'zh' || language === 'ja') && ("]
];

for (const [from, to] of replacements) {
  content = content.replaceAll(from, to);
}

fs.writeFileSync('components/ScoreboardDisplay.tsx', content);
