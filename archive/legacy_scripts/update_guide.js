const fs = require('fs');
let code = fs.readFileSync('components/UserGuideModal.tsx', 'utf-8');
code = code.replace(
  /{language === 'en' \? 'Shows unique HR animations depending on the bases, styled with team colors.' : language === 'zh' \? '根據壘上人數，會顯示 Home Run、2-Run Homer、3-Run Homer 或 Grand Slam \(滿貫砲\) 的專屬動畫，並帶有隊伍代表色。' : '走者の数に応じて専用のHRアニメーションをチームカラーで表示します。'}/g,
  "{language === 'en' ? 'Shows unique HR animations depending on the bases, styled with team colors.' : language === 'zh' ? '根據壘上人數，會顯示 Home Run、2-Run Homer、3-Run Homer 或 Grand Slam (滿貫砲) 的專屬動畫，並帶有隊伍代表色。' : '走者の数に応じて、ソロホームラン、2ランホームラン、3ランホームラン、満塁ホームランの専用アニメーションをチームカラーで表示します。'}"
);
code = code.replace(
  /\* 您可以在頂部工具列的「Shortcuts」中自訂所有按鍵。若連接手把，可使用 JoyToKey 等軟體將手把按鍵映射為鍵盤按鍵。/g,
  "{language === 'en' ? '* You can customize keys in Shortcuts menu. Use tools like JoyToKey for gamepads.' : language === 'zh' ? '* 您可以在頂部工具列的「Shortcuts」中自訂所有按鍵。若連接手把，可使用 JoyToKey 等軟體將手把按鍵映射為鍵盤按鍵。' : '* ショートカットメニューでキーをカスタマイズできます。ゲームパッドを使用する場合は JoyToKey などのツールを使用してください。'}"
);
code = code.replace(
  />OBS \/ 大螢幕</g,
  ">{language === 'zh' ? 'OBS / 大螢幕' : language === 'en' ? 'OBS / Second Screen' : 'OBS / セカンドスクリーン'}<"
);
fs.writeFileSync('components/UserGuideModal.tsx', code);
