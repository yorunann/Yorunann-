const fs = require('fs');
let text = fs.readFileSync('components/UserGuideModal.tsx', 'utf-8');

text = text.replace(
    'export const UserGuideModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {',
    'export const UserGuideModal = ({ isOpen, onClose, language }: { isOpen: boolean; onClose: () => void; language: "en" | "zh" | "ja" }) => {'
);

const replacements = [
    ["計分板使用指南", "{language === 'en' ? 'Scoreboard User Guide' : language === 'zh' ? '計分板使用指南' : 'スコアボード ユーザーガイド'}"],
    ["歡迎使用 Pro Baseball Scoreboard！", "{language === 'en' ? 'Welcome to Pro Baseball Scoreboard!' : language === 'zh' ? '歡迎使用 Pro Baseball Scoreboard！' : 'Pro Baseball Scoreboardへようこそ！'}"],
    ["這是一款專為棒球轉播與現場大螢幕設計的專業計分板系統。", "{language === 'en' ? 'This is a professional scoreboard system designed for baseball broadcasts and live screens.' : language === 'zh' ? '這是一款專為棒球轉播與現場大螢幕設計的專業計分板系統。' : '野球の中継やスクリーン向けに設計されたプロ仕様のスコアボードシステムです。'}"],
    ["控制台分為左右兩側（主客隊），您可以快速調整陣容。", "{language === 'en' ? 'The control panel is divided into Home and Away. You can quickly adjust rosters.' : language === 'zh' ? '控制台分為左右兩側（主客隊），您可以快速調整陣容。' : 'コントロールパネルは左右(ホーム/ビジター)に分かれており、素早く調整できます。'}"],
    ["點擊顏色選取器更改 隊伍色 (TEAM) 與 壘包色 (BASE)。", "{language === 'en' ? 'Click color pickers to change TEAM color and BASE color.' : language === 'zh' ? '點擊顏色選取器更改 隊伍色 (TEAM) 與 壘包色 (BASE)。' : 'カラーピッカーをクリックしてチーム色とベース色を変更します。'}"],
    ["點擊相機圖示上傳並裁切您的球隊 Logo。", "{language === 'en' ? 'Click the camera icon to upload and crop your team logo.' : language === 'zh' ? '點擊相機圖示上傳並裁切您的球隊 Logo。' : 'カメラアイコンをクリックしてチームロゴをアップロード/トリミングします。'}"],
    ["可以隨意修改球員的背號、姓名、守位與打擊率。", "{language === 'en' ? 'You can modify player numbers, names, positions, and stats.' : language === 'zh' ? '可以隨意修改球員的背號、姓名、守位與打擊率。' : '選手の背番号、名前、ポジション、成績を変更できます。'}"],
    ["使用上/下箭頭按鈕將球員在「先發打線」與「板凳」之間移動。", "{language === 'en' ? 'Use Up/Down arrows to move players between Lineup and Bench.' : language === 'zh' ? '使用上/下箭頭按鈕將球員在「先發打線」與「板凳」之間移動。' : '上下矢印ボタンでスタメンとベンチ間で選手を移動します。'}"],
    ["點擊球圖示可以一鍵將該球員設為「當前投手」。", "{language === 'en' ? 'Click the ball icon to set a player as Current Pitcher.' : language === 'zh' ? '點擊球圖示可以一鍵將該球員設為「當前投手」。' : 'ボールアイコンをクリックして現在の投手に設定します。'}"],
    ["在控制台下方，您可以選擇三種不同的顯示模式：", "{language === 'en' ? 'At the bottom of the control panel, you can choose 3 display modes:' : language === 'zh' ? '在控制台下方，您可以選擇三種不同的顯示模式：' : 'コントロールパネルの下部で3つの表示モードを選択できます：'}"],
    ["顯示兩隊完整的先發打線與守備位置，讓觀眾在賽前了解雙方陣容。", "{language === 'en' ? 'Displays the starting lineup and fielding positions for both teams.' : language === 'zh' ? '顯示兩隊完整的先發打線與守備位置，讓觀眾在賽前了解雙方陣容。' : '両チームのスタメンと守備位置を表示し、観客に陣容を伝えます。'}"],
    ["顯示傳統的九局計分板（Box Score）以及 R (得分)、H (安打)、E (失誤) 統計，讓觀眾快速掌握比賽走向。", "{language === 'en' ? 'Displays traditional line score and RHE stats.' : language === 'zh' ? '顯示傳統的九局計分板（Box Score）以及 R (得分)、H (安打)、E (失誤) 統計，讓觀眾快速掌握比賽走向。' : '伝統的な9イニングのスコアボードとRHE成績を表示します。'}"],
    ["精簡的左下角/右下角字卡設計，顯示當前打者、投手、好壞球與壘包狀態。進入「調整模式 (Adjustment Mode)」後，可以自由拖曳位置、縮放大小，甚至調整各個區塊的邊界寬度與高度，完美契合您的轉播畫面。", "{language === 'en' ? 'Compact graphics showing current batter, pitcher, counts, and bases. Enter Adjustment Mode to drag, scale, and adjust borders to fit your broadcast.' : language === 'zh' ? '精簡的左下角/右下角字卡設計，顯示當前打者、投手、好壞球與壘包狀態。進入「調整模式 (Adjustment Mode)」後，可以自由拖曳位置、縮放大小，甚至調整各個區塊的邊界寬度與高度，完美契合您的轉播畫面。' : '現在の打者・投手・カウント・塁状況を表示。調整モードでドラッグやリサイズが可能。'}"],
    ["為了增加轉播的趣味性，我們內建了多種專業的動畫特效：", "{language === 'en' ? 'We included professional animations to enhance the broadcast:' : language === 'zh' ? '為了增加轉播的趣味性，我們內建了多種專業的動畫特效：' : '中継を盛り上げるためにプロ仕様のアニメーションを内蔵：'}"],
    ["根據壘上人數，會顯示 Home Run、2-Run Homer、3-Run Homer 或 Grand Slam (滿貫砲) 的專屬動畫，並帶有隊伍代表色。", "{language === 'en' ? 'Shows unique HR animations depending on the bases, styled with team colors.' : language === 'zh' ? '根據壘上人數，會顯示 Home Run、2-Run Homer、3-Run Homer 或 Grand Slam (滿貫砲) 的專屬動畫，並帶有隊伍代表色。' : '走者の数に応じて専用のHRアニメーションをチームカラーで表示します。'}"],
    ["當好球數達到 3 時，會觸發「K」字動畫。", "{language === 'en' ? 'Triggers a \\'K\\' animation when strike reaches 3.' : language === 'zh' ? '當好球數達到 3 時，會觸發「K」字動畫。' : 'ストライクが3に達するとKアニメーションを表示します。'}"],
    ["壘包狀態改變與分數跳動時，都有平滑的過渡效果。", "{language === 'en' ? 'Smooth transitions for base changes and score updates.' : language === 'zh' ? '壘包狀態改變與分數跳動時，都有平滑的過渡效果。' : '塁状況とスコアの更新にスムーズなトランジション。'}"],
    ["支援鍵盤與遊戲手把 (如 PS4 控制器)，讓計分員可以盲操作，視線不離開球場！", "{language === 'en' ? 'Supports keyboard and gamepads (e.g. PS4 Controller) for blind operation!' : language === 'zh' ? '支援鍵盤與遊戲手把 (如 PS4 控制器)，讓計分員可以盲操作，視線不離開球場！' : 'キーボードやゲームパッド(PS4等)に対応し、ブラインド操作が可能！'}"],
    ["如果您有雙螢幕（例如連接到現場的大螢幕或轉播軟體 OBS），可以使用 Project 功能。", "{language === 'en' ? 'Use Project feature for dual-screen setups (e.g. OBS or live screens).' : language === 'zh' ? '如果您有雙螢幕（例如連接到現場的大螢幕或轉播軟體 OBS），可以使用 Project 功能。' : 'OBSや球場スクリーンなどのデュアルスクリーン環境でProject機能を使用できます。'}"],
    ["點擊頂部工具列的 <strong>「Open Projector」</strong> 按鈕。", "{language === 'en' ? 'Click the <strong>Open Projector</strong> button in the top bar.' : language === 'zh' ? '點擊頂部工具列的 <strong>「Open Projector」</strong> 按鈕。' : '上部ツールバーの<strong>Open Projector</strong>ボタンをクリック。'}"],
    ["系統會彈出一個新的瀏覽器視窗，裡面只有乾淨的計分板畫面（沒有控制台）。", "{language === 'en' ? 'A clean scoreboard window will pop up (no controls).' : language === 'zh' ? '系統會彈出一個新的瀏覽器視窗，裡面只有乾淨的計分板畫面（沒有控制台）。' : 'コントロールのないクリーンなスコアボード画面が開きます。'}"],
    ["將這個新視窗<strong>拖曳到您的第二螢幕</strong>，或是讓 OBS 擷取該視窗。", "{language === 'en' ? '<strong>Drag it to your second screen</strong> or capture it in OBS.' : language === 'zh' ? '將這個新視窗<strong>拖曳到您的第二螢幕</strong>，或是讓 OBS 擷取該視窗。' : '<strong>セカンドスクリーンにドラッグ</strong>するか、OBSでキャプチャします。'}"],
    ["您在主視窗（控制台）的所有操作，都會<strong>即時同步</strong>到投影視窗中！", "{language === 'en' ? 'All control actions will be <strong>synced in real-time</strong> to the projector window!' : language === 'zh' ? '您在主視窗（控制台）的所有操作，都會<strong>即時同步</strong>到投影視窗中！' : 'コントロール画面での操作は<strong>リアルタイムに同期</strong>されます！'}"],
    ["您可以自訂隊伍的代表色與 Logo 網址。這些顏色會自動應用在計分板的背景、全壘打動畫、以及三振 (K) 的特效中，讓轉播更具專屬感。", "{language === 'en' ? 'You can customize team colors and logos. They are applied to backgrounds and animations.' : language === 'zh' ? '您可以自訂隊伍的代表色與 Logo 網址。這些顏色會自動應用在計分板的背景、全壘打動畫、以及三振 (K) 的特效中，讓轉播更具專屬感。' : 'チームカラーとロゴをカスタマイズできます。これらは背景やアニメーションに適用されます。'}"],
    ["使用時機：比賽開始前。", "{language === 'en' ? 'When to use: Before the game starts.' : language === 'zh' ? '使用時機：比賽開始前。' : '使用タイミング：試合開始前。'}"],
    ["使用時機：半局結束、攻守交替時。", "{language === 'en' ? 'When to use: End of half-inning or side retired.' : language === 'zh' ? '使用時機：半局結束、攻守交替時。' : '使用タイミング：イニング終了・攻守交代時。'}"],
    ["使用時機：比賽進行中。", "{language === 'en' ? 'When to use: During the game.' : language === 'zh' ? '使用時機：比賽進行中。' : '使用タイミング：試合進行中。'}"],
    ["1. 歡迎 (Welcome)", "{language === 'en' ? '1. Welcome' : language === 'zh' ? '1. 歡迎 (Welcome)' : '1. ようこそ'}"],
    ["2. 隊伍與名單 (Teams & Roster)", "{language === 'en' ? '2. Teams & Roster' : language === 'zh' ? '2. 隊伍與名單 (Teams & Roster)' : '2. チームと名簿'}"],
    ["3. 顯示模式 (Display Modes)", "{language === 'en' ? '3. Display Modes' : language === 'zh' ? '3. 顯示模式 (Display Modes)' : '3. 表示モード'}"],
    ["4. 動畫效果 (Animations)", "{language === 'en' ? '4. Animations' : language === 'zh' ? '4. 動畫效果 (Animations)' : '4. アニメーション'}"],
    ["5. 快捷鍵 (Shortcuts)", "{language === 'en' ? '5. Shortcuts' : language === 'zh' ? '5. 快捷鍵 (Shortcuts)' : '5. ショートカット'}"],
    ["6. 投影與延伸畫面 (Project)", "{language === 'en' ? '6. Projector' : language === 'zh' ? '6. 投影與延伸畫面 (Project)' : '6. プロジェクター'}"],
    ["📋 Lineup (打線模式)", "{language === 'en' ? '📋 Lineup Mode' : language === 'zh' ? '📋 Lineup (打線模式)' : '📋 打順モード'}"],
    ["📊 Inning / RHE (局間模式)", "{language === 'en' ? '📊 Inning / RHE Mode' : language === 'zh' ? '📊 Inning / RHE (局間模式)' : '📊 RHEモード'}"],
    ["📺 Broadcast (轉播模式)", "{language === 'en' ? '📺 Broadcast Mode' : language === 'zh' ? '📺 Broadcast (轉播模式)' : '📺 配信モード'}"],
    ["特色功能：", "{language === 'en' ? 'Features:' : language === 'zh' ? '特色功能：' : '特徴：'}"],
    ["直覺的操作介面", "{language === 'en' ? 'Intuitive Interface' : language === 'zh' ? '直覺的操作介面' : '直感的なインターフェース'}"],
    ["豐富的動畫效果與快捷鍵支援", "{language === 'en' ? 'Rich animations and shortcut support' : language === 'zh' ? '豐富的動畫效果與快捷鍵支援' : '豊富なアニメーションとショートカット'}"],
    ["自訂球隊 Logo 與顏色", "{language === 'en' ? 'Custom Team Logos & Colors' : language === 'zh' ? '自訂球隊 Logo 與顏色' : 'カスタムチームロゴとカラー'}"],
    ["多種顯示模式切換", "{language === 'en' ? 'Multiple Display Modes' : language === 'zh' ? '多種顯示模式切換' : '複数の表示モード'}"],
    ["投影與分離視窗 (OBS 支援)", "{language === 'en' ? 'Project & Detach Window (OBS Support)' : language === 'zh' ? '投影與分離視窗 (OBS 支援)' : 'プロジェクター(OBS対応)'}"],
    ["球隊設定：", "{language === 'en' ? 'Team Settings:' : language === 'zh' ? '球隊設定：' : 'チーム設定：'}"],
    ["名單管理：", "{language === 'en' ? 'Roster Management:' : language === 'zh' ? '名單管理：' : '名簿管理：'}"],
    ["全壘打 (Home Run)：", "{language === 'en' ? 'Home Run: ' : language === 'zh' ? '全壘打 (Home Run)：' : 'ホームラン：'}"],
    ["三振 (Strikeout)：", "{language === 'en' ? 'Strikeout: ' : language === 'zh' ? '三振 (Strikeout)：' : '三振：'}"],
    ["上壘與得分：", "{language === 'en' ? 'On-base & Scoring: ' : language === 'zh' ? '上壘與得分：' : '出塁と得点：'}"],
    ["關閉", "{language === 'en' ? 'Close' : language === 'zh' ? '關閉' : '閉じる'}"],
    ["上一頁", "{language === 'en' ? 'Prev' : language === 'zh' ? '上一頁' : '前へ'}"],
    ["下一頁", "{language === 'en' ? 'Next' : language === 'zh' ? '下一頁' : '次へ'}"],
    ["開始使用！", "{language === 'en' ? 'Get Started!' : language === 'zh' ? '開始使用！' : 'はじめる！'}"],
    ["壞球 (Ball)", "{language === 'en' ? 'Ball' : language === 'zh' ? '壞球 (Ball)' : 'ボール'}"],
    ["好球 (Strike)", "{language === 'en' ? 'Strike' : language === 'zh' ? '好球 (Strike)' : 'ストライク'}"],
    ["出局 (Out)", "{language === 'en' ? 'Out' : language === 'zh' ? '出局 (Out)' : 'アウト'}"],
    ["復原 (Undo)", "{language === 'en' ? 'Undo' : language === 'zh' ? '復原 (Undo)' : '元に戻す'}"],
    ["一壘 (長按=一壘安打)", "{language === 'en' ? '1st Base (Hold=1B)' : language === 'zh' ? '一壘 (長按=一壘安打)' : '一塁 (長押し=単打)'}"],
    ["二壘 (長按=二壘安打)", "{language === 'en' ? '2nd Base (Hold=2B)' : language === 'zh' ? '二壘 (長按=二壘安打)' : '二塁 (長押し=二塁打)'}"],
    ["三壘 (長按=三壘安打)", "{language === 'en' ? '3rd Base (Hold=3B)' : language === 'zh' ? '三壘 (長按=三壘安打)' : '三塁 (長押し=三塁打)'}"],
    ["全壘打", "{language === 'en' ? 'Home Run' : language === 'zh' ? '全壘打' : 'ホームラン'}"]
];

for (const [zh, code] of replacements) {
    text = text.split(zh).join(code);
}

fs.writeFileSync('components/UserGuideModal.tsx', text);
