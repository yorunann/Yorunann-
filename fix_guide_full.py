import re

with open('components/UserGuideModal.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

replacements = [
    (
        "使用指南 (User Guide)",
        "{language === 'en' ? 'User Guide' : language === 'zh' ? '使用指南' : 'ユーザーガイド'}"
    ),
    (
        '<h3 className="text-2xl font-bold text-blue-600">1. 介紹與初衷</h3>',
        '<h3 className="text-2xl font-bold text-blue-600">{language === \'en\' ? \'1. Introduction\' : language === \'zh\' ? \'1. 介紹與初衷\' : \'1. 紹介と目的\'}</h3>'
    ),
    (
        "歡迎使用本棒球計分板系統！",
        "{language === 'en' ? 'Welcome to the Baseball Scoreboard System!' : language === 'zh' ? '歡迎使用本棒球計分板系統！' : '野球スコアボードシステムへようこそ！'}"
    ),
    (
        "<strong>開發初衷：</strong>我們希望讓基層棒球、業餘聯賽，或是各類棒球比賽，都能夠輕鬆擁有專業轉播等級的計分板。不需要昂貴的硬體設備，只要有一台電腦或平板，就能呈現出高質感的比賽畫面。",
        "{language === 'en' ? <span><strong>Goal:</strong> We want to provide a professional broadcast-level scoreboard for grassroots, amateur leagues, and any baseball games. No expensive hardware needed, just a PC or tablet.</span> : language === 'zh' ? <span><strong>開發初衷：</strong>我們希望讓基層棒球、業餘聯賽，或是各類棒球比賽，都能夠輕鬆擁有專業轉播等級的計分板。不需要昂貴的硬體設備，只要有一台電腦或平板，就能呈現出高質感的比賽畫面。</span> : <span><strong>開発の目的：</strong> 草野球、アマチュアリーグ、またはあらゆる野球の試合で、プロの放送レベルのスコアボードを簡単に利用できるようにしたいと考えています。高価なハードウェアは必要ありません。PCやタブレットだけで、高品質な試合画面を提供できます。</span>}"
    ),
    (
        '<h4 className="font-bold text-blue-800 mb-2">基本功能概覽</h4>',
        '<h4 className="font-bold text-blue-800 mb-2">{language === \'en\' ? \'Key Features\' : language === \'zh\' ? \'基本功能概覽\' : \'主な機能の概要\'}</h4>'
    ),
    (
        "<li>完整的好壞球、出局數、局數紀錄</li>",
        "<li>{language === 'en' ? 'Complete ball, strike, out, and inning tracking' : language === 'zh' ? '完整的好壞球、出局數、局數紀錄' : 'ボール、ストライク、アウト、イニングの完全な記録'}</li>"
    ),
    (
        "<li>支援主客隊名單、打線與守備位置管理</li>",
        "<li>{language === 'en' ? 'Support for Home/Away rosters, lineups, and fielding positions' : language === 'zh' ? '支援主客隊名單、打線與守備位置管理' : 'ホーム/アウェイのロースター、打順、守備位置の管理をサポート'}</li>"
    ),
    (
        "<li>多種顯示模式（名單、局間、轉播）</li>",
        "<li>{language === 'en' ? 'Multiple display modes (Lineup, Inning, Broadcast)' : language === 'zh' ? '多種顯示模式（名單、局間、轉播）' : '複数の表示モード（スタメン、イニング、配信モード）'}</li>"
    ),
    (
        '<h3 className="text-2xl font-bold text-blue-600">2. 名單與隊伍功能</h3>',
        '<h3 className="text-2xl font-bold text-blue-600">{language === \'en\' ? \'2. Rosters & Teams\' : language === \'zh\' ? \'2. 名單與隊伍功能\' : \'2. ロースターとチーム機能\'}</h3>'
    ),
    (
        '<p className="text-slate-700">在控制台的下方，您可以完整管理兩隊的資訊：</p>',
        '<p className="text-slate-700">{language === \'en\' ? \'Manage all team information in the lower part of the control panel:\' : language === \'zh\' ? \'在控制台的下方，您可以完整管理兩隊的資訊：\' : \'コントロールパネルの下部で両チームの情報を完全に管理できます：\'}</p>'
    ),
    (
        '<h4 className="font-bold text-slate-800 mb-2">🎨 隊伍顏色與 Logo</h4>',
        '<h4 className="font-bold text-slate-800 mb-2">{language === \'en\' ? \'🎨 Team Colors & Logos\' : language === \'zh\' ? \'🎨 隊伍顏色與 Logo\' : \'🎨 チームカラーとロゴ\'}</h4>'
    ),
    (
        '<h4 className="font-bold text-slate-800 mb-2">⚾ 打線與板凳</h4>',
        '<h4 className="font-bold text-slate-800 mb-2">{language === \'en\' ? \'⚾ Lineup & Bench\' : language === \'zh\' ? \'⚾ 打線與板凳\' : \'⚾ 打線とベンチ\'}</h4>'
    ),
    (
        '<p className="text-sm text-slate-600">支援先發打線與板凳球員。使用上下箭頭按鈕可以輕鬆調整棒次，或是將板凳球員換上場。</p>',
        '<p className="text-sm text-slate-600">{language === \'en\' ? \'Supports starting lineups and bench players. Use up/down arrows to easily adjust batting orders or substitute bench players.\' : language === \'zh\' ? \'支援先發打線與板凳球員。使用上下箭頭按鈕可以輕鬆調整棒次，或是將板凳球員換上場。\' : \'スタメンとベンチ入り選手をサポートします。上下の矢印ボタンを使って打順を簡単に調整したり、ベンチ選手を交代で出場させることができます。\'}</p>'
    ),
    (
        '<h4 className="font-bold text-slate-800 mb-2">🖱️ 拖曳排序 (Drag & Drop)</h4>',
        '<h4 className="font-bold text-slate-800 mb-2">{language === \'en\' ? \'🖱️ Drag & Drop Sorting\' : language === \'zh\' ? \'🖱️ 拖曳排序 (Drag & Drop)\' : \'🖱️ ドラッグ＆ドロップで並べ替え\'}</h4>'
    ),
    (
        '<p className="text-sm text-slate-600">除了按鈕，您也可以直接用滑鼠拖曳球員來改變打線順序，排棒次更快速！</p>',
        '<p className="text-sm text-slate-600">{language === \'en\' ? \'Besides buttons, you can drag and drop players to reorder the lineup quickly!\' : language === \'zh\' ? \'除了按鈕，您也可以直接用滑鼠拖曳球員來改變打線順序，排棒次更快速！\' : \'ボタンだけでなく、マウスで選手を直接ドラッグして打順を変更できるため、より素早く並べ替えが可能です！\'}</p>'
    ),
    (
        '<h4 className="font-bold text-slate-800 mb-2">🔄 主客隊交換</h4>',
        '<h4 className="font-bold text-slate-800 mb-2">{language === \'en\' ? \'🔄 Swap Home/Away\' : language === \'zh\' ? \'🔄 主客隊交換\' : \'🔄 ホーム/アウェイ入れ替え\'}</h4>'
    ),
    (
        '<p className="text-sm text-slate-600">點擊「Swap Teams」按鈕，可以一鍵交換主客隊。這不僅會改變計分板上的顯示位置，控制台的編輯區塊也會跟著左右交換，操作更直覺。</p>',
        '<p className="text-sm text-slate-600">{language === \'en\' ? \'Click the Swap Teams button to easily swap home and away teams. This updates the scoreboard display and switches the edit panels in the control center for intuitive operation.\' : language === \'zh\' ? \'點擊「Swap Teams」按鈕，可以一鍵交換主客隊。這不僅會改變計分板上的顯示位置，控制台的編輯區塊也會跟著左右交換，操作更直覺。\' : \'「Swap Teams」ボタンをクリックすると、ホームとアウェイをワンクリックで入れ替えられます。スコアボードの表示位置が変わるだけでなく、コントロールパネルの編集エリアも左右反転するため、直感的な操作が可能です。\'}</p>'
    ),
    (
        '<p className="text-slate-700">系統提供三種不同的顯示模式，適應比賽的不同階段：</p>',
        '<p className="text-slate-700">{language === \'en\' ? \'The system provides three display modes for different game phases:\' : language === \'zh\' ? \'系統提供三種不同的顯示模式，適應比賽的不同階段：\' : \'システムは、試合のさまざまな状況に合わせて3つの異なる表示モードを提供します：\'}</p>'
    ),
    (
        '<h4 className="font-bold text-slate-800 text-lg">🎛️ Default (控制台模式)</h4>',
        '<h4 className="font-bold text-slate-800 text-lg">{language === \'en\' ? \'🎛️ Default (Control Panel)\' : language === \'zh\' ? \'🎛️ Default (控制台模式)\' : \'🎛️ デフォルト (コントロールパネル)\'}</h4>'
    ),
    (
        '<p className="text-slate-600 mt-1"><strong>使用時機：</strong>計分員操作時的主要畫面。</p>',
        '<p className="text-slate-600 mt-1">{language === \'en\' ? <span><strong>When to use:</strong> Main screen for the scorekeeper.</span> : language === \'zh\' ? <span><strong>使用時機：</strong>計分員操作時的主要畫面。</span> : <span><strong>使用タイミング：</strong>スコアキーパーのメイン操作画面。</span>}</p>'
    ),
    (
        '<p className="text-sm text-slate-500">左側顯示計分板預覽，右側為完整的控制面板。這是系統的預設模式，讓您可以一邊操作一邊確認畫面。</p>',
        '<p className="text-sm text-slate-500">{language === \'en\' ? \'Shows scoreboard preview on the left and full controls on the right. This is the default mode, allowing you to operate while previewing.\' : language === \'zh\' ? \'左側顯示計分板預覽，右側為完整的控制面板。這是系統的預設模式，讓您可以一邊操作一邊確認畫面。\' : \'左側にスコアボードのプレビュー、右側に完全なコントロールパネルを表示します。これがデフォルトモードであり、画面を確認しながら操作できます。\'}</p>'
    ),
    (
        '<h4 className="font-bold text-slate-800 text-lg">📋 Lineup (先發名單模式)</h4>',
        '<h4 className="font-bold text-slate-800 text-lg">{language === \'en\' ? \'📋 Lineup Mode\' : language === \'zh\' ? \'📋 Lineup (先發名單模式)\' : \'📋 スタメンモード (Lineup)\'}</h4>'
    ),
    (
        '<p className="text-slate-600 mt-1"><strong>使用時機：</strong>比賽開始前。</p>',
        '<p className="text-slate-600 mt-1">{language === \'en\' ? <span><strong>When to use:</strong> Before the game starts.</span> : language === \'zh\' ? <span><strong>使用時機：</strong>比賽開始前。</span> : <span><strong>使用タイミング：</strong>試合開始前。</span>}</p>'
    ),
    (
        '<p className="text-slate-600 mt-1"><strong>使用時機：</strong>半局結束、攻守交替時。</p>',
        '<p className="text-slate-600 mt-1">{language === \'en\' ? <span><strong>When to use:</strong> Between half-innings.</span> : language === \'zh\' ? <span><strong>使用時機：</strong>半局結束、攻守交替時。</span> : <span><strong>使用タイミング：</strong>イニングの合間、攻守交替時。</span>}</p>'
    ),
    (
        '<li><strong>Strike Out (K): </strong>{language === \'en\' ? \'Dramatic strikeout animation for the third strike.\' : language === \'zh\' ? \'當按下第三個好球時，會出現充滿張力的三振動畫！\' : \'3ストライク目で迫力ある三振アニメーションを表示！\'}</li>',
        '<li><strong>Strike Out (K): </strong>{language === \'en\' ? \'Dramatic strikeout animation for the third strike.\' : language === \'zh\' ? \'當按下第三個好球時，會出現充滿張力的三振動畫！\' : \'3ストライク目で迫力のある奪三振（K）アニメーションを表示！\'}</li>'
    )
]

for old, new in replacements:
    text = text.replace(old, new)

with open('components/UserGuideModal.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

