const fs = require('fs');
let content = fs.readFileSync('components/ScoreboardControls.tsx', 'utf-8');

content = content.replace(
  `onSetPitcher: () => void;
  key?: any;
}) => {`,
  `onSetPitcher: () => void;
  language: 'en' | 'zh' | 'ja';
  key?: any;
}) => {`
);

content = content.replace(
  `onSetPitcher
}: {`,
  `onSetPitcher,
  language
}: {`
);

content = content.replace(
  `        title={isLineup ? "移至板凳" : "移至打線"}`,
  `        title={isLineup ? (language === 'zh' ? "移至板凳" : language === 'en' ? "To Bench" : "ベンチへ") : (language === 'zh' ? "移至打線" : language === 'en' ? "To Lineup" : "打順へ")}`
);

content = content.replace(
  `        title="設為投手"
      >
        <User size={12} />`,
  `        title={language === 'en' ? 'Set as Pitcher' : language === 'zh' ? '設為投手' : '投手に設定'}
      >
        <CircleDot size={12} />`
);

content = content.replace(
  `title="Remove"`,
  `title={language === 'zh' ? '移除' : language === 'ja' ? '削除' : 'Remove'}`
);

// Now update the calls to SortablePlayerRow
content = content.replaceAll(
  `isCurrentBatter={idx === globalTeam.currentBatterIndex && ((state.isTop && teamKey === 'away') || (!state.isTop && teamKey === 'home'))}`,
  `isCurrentBatter={idx === globalTeam.currentBatterIndex && ((state.isTop && teamKey === 'away') || (!state.isTop && teamKey === 'home'))}
                  language={language || 'zh'}`
);

content = content.replaceAll(
  `isCurrentBatter={false}`,
  `isCurrentBatter={false}
                  language={language || 'zh'}`
);


fs.writeFileSync('components/ScoreboardControls.tsx', content);
