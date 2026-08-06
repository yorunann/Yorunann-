import re

with open('components/UserGuideModal.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(
    "{language === 'en' ? 'Shows unique HR animations depending on the bases, styled with team colors.' : language === 'zh' ? '根據壘上人數，會顯示 Home Run、2-Run Homer、3-Run Homer 或 Grand Slam (滿貫砲) 的專屬動畫，並帶有隊伍代表色。' : '走者の数に応じて専用のHRアニメーションをチームカラーで表示します。'}",
    "{language === 'en' ? 'Shows unique HR animations depending on the bases, styled with team colors.' : language === 'zh' ? '根據壘上人數，會顯示 Home Run、2-Run Homer、3-Run Homer 或 Grand Slam (滿貫砲) 的專屬動畫，並帶有隊伍代表色。' : '走者の数に応じて、ソロホームラン、2ランホームラン、3ランホームラン、満塁ホームランの専用アニメーションをチームカラーで表示します。'}"
)

text = text.replace(
    "* 您可以在頂部工具列的「Shortcuts」中自訂所有按鍵。若連接手把，可使用 JoyToKey 等軟體將手把按鍵映射為鍵盤按鍵。",
    "{language === 'en' ? '* You can customize keys in Shortcuts menu. Use tools like JoyToKey for gamepads.' : language === 'zh' ? '* 您可以在頂部工具列的「Shortcuts」中自訂所有按鍵。若連接手把，可使用 JoyToKey 等軟體將手把按鍵映射為鍵盤按鍵。' : '* ショートカットメニューでキーをカスタマイズできます。ゲームパッドを使用する場合は JoyToKey などのツールを使用してください。'}"
)

text = text.replace(
    ">OBS / 大螢幕<",
    ">{language === 'zh' ? 'OBS / 大螢幕' : language === 'en' ? 'OBS / Second Screen' : 'OBS / セカンドスクリーン'}<"
)

text = text.replace(
    "'精簡的左下角/右下角字卡設計，顯示當前打者、投手、好壞球與壘包狀態。進入「調整模式 (Adjustment Mode)」後，可以自由拖曳位置、縮放大小，甚至調整各個區塊的邊界寬度與高度，完美契合您的轉播畫面。' : '現在の打者・投手・カウント・塁状況を表示。調整モードでドラッグやリサイズが可能。'",
    "'精簡的左下角/右下角字卡設計，顯示當前打者、投手、好壞球與壘包狀態。進入「調整模式 (Adjustment Mode)」後，可以自由拖曳位置、縮放大小，甚至調整各個區塊的邊界寬度與高度，完美契合您的轉播畫面。' : '現在の打者、投手、カウント、塁の状況を表示するコンパクトなグラフィック。「調整モード」に入ると、自由にドラッグ、リサイズ、さらには各セクションの境界線の幅や高さを調整でき、配信画面に完璧にフィットします。'"
)

text = text.replace(
    "{language === 'en' ? 'Rich animations and shortcut support' : language === 'zh' ? '豐富的動畫效果與快捷鍵支援' : '豊富なアニメーションとショートカット'}",
    "{language === 'en' ? 'Rich animations and shortcut support' : language === 'zh' ? '豐富的動畫效果與快捷鍵支援' : '豊富なアニメーション効果とショートカット対応'}"
)

text = text.replace(
    "{language === 'en' ? 'You can customize team colors and logos. They are applied to backgrounds and animations.' : language === 'zh' ? '您可以自訂隊伍的代表色與 Logo 網址。這些顏色會自動應用在計分板的背景、全壘打動畫、以及三振 (K) 的特效中，讓轉播更具專屬感。' : 'チームカラーとロゴをカスタマイズできます。これらは背景やアニメーションに適用されます。'}",
    "{language === 'en' ? 'You can customize team colors and logos. They are applied to backgrounds and animations.' : language === 'zh' ? '您可以自訂隊伍的代表色與 Logo 網址。這些顏色會自動應用在計分板的背景、全壘打動畫、以及三振 (K) 的特效中，讓轉播更具專屬感。' : 'チームカラーとロゴのURLをカスタマイズできます。これらの色はスコアボードの背景、ホームランアニメーション、奪三振（K）エフェクトに自動的に適用され、配信をより本格的に演出します。'}"
)

text = text.replace(
    "{language === 'en' ? 'Displays the starting lineup and fielding positions for both teams.' : language === 'zh' ? '顯示兩隊完整的先發打線與守備位置，讓觀眾在賽前了解雙方陣容。' : '両チームのスタメンと守備位置を表示し、観客に陣容を伝えます。'}",
    "{language === 'en' ? 'Displays the starting lineup and fielding positions for both teams.' : language === 'zh' ? '顯示兩隊完整的先發打線與守備位置，讓觀眾在賽前了解雙方陣容。' : '両チームのスタメンと守備位置をすべて表示し、試合前に両チームの陣容を視聴者に伝えます。'}"
)

text = text.replace(
    "{language === 'en' ? 'Displays traditional line score and RHE stats.' : language === 'zh' ? '顯示傳統的九局計分板（Box Score）以及 R (得分)、H (安打)、E (失誤) 統計，讓觀眾快速掌握比賽走向。' : '伝統的な9イニングのスコアボードとRHE成績を表示します。'}",
    "{language === 'en' ? 'Displays traditional line score and RHE stats.' : language === 'zh' ? '顯示傳統的九局計分板（Box Score）以及 R (得分)、H (安打)、E (失誤) 統計，讓觀眾快速掌握比賽走向。' : '伝統的な9イニングのスコアボードと R(得点)、H(安打)、E(失策) の成績を表示し、試合の展開を素早く把握できます。'}"
)

with open('components/UserGuideModal.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Done")
