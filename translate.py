import re

with open('backup_guide.txt', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(
    'export const UserGuideModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {',
    'export const UserGuideModal = ({ isOpen, onClose, language }: { isOpen: boolean; onClose: () => void; language: "en" | "zh" | "ja" }) => {'
)

def t(en, zh, ja):
    return f"{{language === 'en' ? '{en}' : language === 'zh' ? '{zh}' : '{ja}'}}"

replacements = [
    ("計分板使用指南", t("Scoreboard User Guide", "計分板使用指南", "スコアボード ユーザーガイド")),
    ("歡迎使用 Pro Baseball Scoreboard！", t("Welcome to Pro Baseball Scoreboard!", "歡迎使用 Pro Baseball Scoreboard！", "Pro Baseball Scoreboardへようこそ！")),
    ("這是一款專為棒球轉播與現場大螢幕設計的專業計分板系統。", t("This is a professional scoreboard system designed for baseball broadcasts and live screens.", "這是一款專為棒球轉播與現場大螢幕設計的專業計分板系統。", "野球の中継やスクリーン向けに設計されたプロ仕様のスコアボードシステムです。")),
    ("控制台分為左右兩側（主客隊），您可以快速調整陣容。", t("The control panel is divided into Home and Away. You can quickly adjust rosters.", "控制台分為左右兩側（主客隊），您可以快速調整陣容。", "コントロールパネルは左右(ホーム/ビジター)に分かれており、素早く調整できます。")),
    ("點擊顏色選取器更改 隊伍色 (TEAM) 與 壘包色 (BASE)。", t("Click color pickers to change TEAM color and BASE color.", "點擊顏色選取器更改 隊伍色 (TEAM) 與 壘包色 (BASE)。", "カラーピッカーをクリックしてチーム色とベース色を変更します。")),
    ("點擊相機圖示上傳並裁切您的球隊 Logo。", t("Click the camera icon to upload and crop your team logo.", "點擊相機圖示上傳並裁切您的球隊 Logo。", "カメラアイコンをクリックしてチームロゴをアップロード/トリミングします。")),
    ("可以隨意修改球員的背號、姓名、守位與打擊率。", t("You can modify player numbers, names, positions, and stats.", "可以隨意修改球員的背號、姓名、守位與打擊率。", "選手の背番号、名前、ポジション、成績を変更できます。")),
    ("使用上/下箭頭按鈕將球員在「先發打線」與「板凳」之間移動。", t("Use Up/Down arrows to move players between Lineup and Bench.", "使用上/下箭頭按鈕將球員在「先發打線」與「板凳」之間移動。", "上下矢印ボタンでスタメンとベンチ間で選手を移動します。")),
    ("點擊球圖示可以一鍵將該球員設為「當前投手」。", t("Click the ball icon to set a player as Current Pitcher.", "點擊球圖示可以一鍵將該球員設為「當前投手」。", "ボールアイコンをクリックして現在の投手に設定します。")),
    ("在控制台下方，您可以選擇三種不同的顯示模式：", t("At the bottom of the control panel, you can choose 3 display modes:", "在控制台下方，您可以選擇三種不同的顯示模式：", "コントロールパネルの下部で3つの表示モードを選択できます：")),
    ("顯示兩隊完整的先發打線與守備位置，讓觀眾在賽前了解雙方陣容。", t("Displays the starting lineup and fielding positions for both teams.", "顯示兩隊完整的先發打線與守備位置，讓觀眾在賽前了解雙方陣容。", "両チームのスタメンと守備位置を表示し、観客に陣容を伝えます。")),
    ("顯示傳統的九局計分板（Box Score）以及 R (得分)、H (安打)、E (失誤) 統計，讓觀眾快速掌握比賽走向。", t("Displays traditional line score and RHE stats.", "顯示傳統的九局計分板（Box Score）以及 R (得分)、H (安打)、E (失誤) 統計，讓觀眾快速掌握比賽走向。", "伝統的な9イニングのスコアボードとRHE成績を表示します。")),
    ("精簡的左下角/右下角字卡設計，顯示當前打者、投手、好壞球與壘包狀態。進入「調整模式 (Adjustment Mode)」後，可以自由拖曳位置、縮放大小，甚至調整各個區塊的邊界寬度與高度，完美契合您的轉播畫面。", t("Compact graphics showing current batter, pitcher, counts, and bases. Enter Adjustment Mode to drag, scale, and adjust borders to fit your broadcast.", "精簡的左下角/右下角字卡設計，顯示當前打者、投手、好壞球與壘包狀態。進入「調整模式 (Adjustment Mode)」後，可以自由拖曳位置、縮放大小，甚至調整各個區塊的邊界寬度與高度，完美契合您的轉播畫面。", "現在の打者・投手・カウント・塁状況を表示。調整モードでドラッグやリサイズが可能。")),
    ("為了增加轉播的趣味性，我們內建了多種專業的動畫特效：", t("We included professional animations to enhance the broadcast:", "為了增加轉播的趣味性，我們內建了多種專業的動畫特效：", "中継を盛り上げるためにプロ仕様のアニメーションを内蔵：")),
    ("根據壘上人數，會顯示 Home Run、2-Run Homer、3-Run Homer 或 Grand Slam (滿貫砲) 的專屬動畫，並帶有隊伍代表色。", t("Shows unique HR animations depending on the bases, styled with team colors.", "根據壘上人數，會顯示 Home Run、2-Run Homer、3-Run Homer 或 Grand Slam (滿貫砲) 的專屬動畫，並帶有隊伍代表色。", "走者の数に応じて専用のHRアニメーションをチームカラーで表示します。")),
    ("當好球數達到 3 時，會觸發「K」字動畫。", t("Triggers a 'K' animation when strike reaches 3.", "當好球數達到 3 時，會觸發「K」字動畫。", "ストライクが3に達するとKアニメーションを表示します。")),
    ("壘包狀態改變與分數跳動時，都有平滑的過渡效果。", t("Smooth transitions for base changes and score updates.", "壘包狀態改變與分數跳動時，都有平滑的過渡效果。", "塁状況とスコアの更新にスムーズなトランジション。")),
    ("支援鍵盤與遊戲手把 (如 PS4 控制器)，讓計分員可以盲操作，視線不離開球場！", t("Supports keyboard and gamepads (e.g. PS4 Controller) for blind operation!", "支援鍵盤與遊戲手把 (如 PS4 控制器)，讓計分員可以盲操作，視線不離開球場！", "キーボードやゲームパッド(PS4等)に対応し、ブラインド操作が可能！")),
    ("如果您有雙螢幕（例如連接到現場的大螢幕或轉播軟體 OBS），可以使用 Project 功能。", t("Use Project feature for dual-screen setups (e.g. OBS or live screens).", "如果您有雙螢幕（例如連接到現場的大螢幕或轉播軟體 OBS），可以使用 Project 功能。", "OBSや球場スクリーンなどのデュアルスクリーン環境でProject機能を使用できます。")),
    ("點擊頂部工具列的 <strong>「Open Projector」</strong> 按鈕。", t("Click the <strong>Open Projector</strong> button in the top bar.", "點擊頂部工具列的 <strong>「Open Projector」</strong> 按鈕。", "上部ツールバーの<strong>Open Projector</strong>ボタンをクリック。")),
    ("系統會彈出一個新的瀏覽器視窗，裡面只有乾淨的計分板畫面（沒有控制台）。", t("A clean scoreboard window will pop up (no controls).", "系統會彈出一個新的瀏覽器視窗，裡面只有乾淨的計分板畫面（沒有控制台）。", "コントロールのないクリーンなスコアボード画面が開きます。")),
    ("將這個新視窗<strong>拖曳到您的第二螢幕</strong>，或是讓 OBS 擷取該視窗。", t("<strong>Drag it to your second screen</strong> or capture it in OBS.", "將這個新視窗<strong>拖曳到您的第二螢幕</strong>，或是讓 OBS 擷取該視窗。", "<strong>セカンドスクリーンにドラッグ</strong>するか、OBSでキャプチャします。")),
    ("您在主視窗（控制台）的所有操作，都會<strong>即時同步</strong>到投影視窗中！", t("All control actions will be <strong>synced in real-time</strong> to the projector window!", "您在主視窗（控制台）的所有操作，都會<strong>即時同步</strong>到投影視窗中！", "コントロール画面での操作は<strong>リアルタイムに同期</strong>されます！")),
    ("您可以自訂隊伍的代表色與 Logo 網址。這些顏色會自動應用在計分板的背景、全壘打動畫、以及三振 (K) 的特效中，讓轉播更具專屬感。", t("You can customize team colors and logos. They are applied to backgrounds and animations.", "您可以自訂隊伍的代表色與 Logo 網址。這些顏色會自動應用在計分板的背景、全壘打動畫、以及三振 (K) 的特效中，讓轉播更具專屬感。", "チームカラーとロゴをカスタマイズできます。これらは背景やアニメーションに適用されます。")),
    ("使用時機：比賽開始前。", t("When to use: Before the game starts.", "使用時機：比賽開始前。", "使用タイミング：試合開始前。")),
    ("使用時機：半局結束、攻守交替時。", t("When to use: End of half-inning or side retired.", "使用時機：半局結束、攻守交替時。", "使用タイミング：イニング終了・攻守交代時。")),
    ("使用時機：比賽進行中。", t("When to use: During the game.", "使用時機：比賽進行中。", "使用タイミング：試合進行中。")),
    ("1. 歡迎 (Welcome)", t("1. Welcome", "1. 歡迎 (Welcome)", "1. ようこそ")),
    ("2. 隊伍與名單 (Teams & Roster)", t("2. Teams & Roster", "2. 隊伍與名單 (Teams & Roster)", "2. チームと名簿")),
    ("3. 顯示模式 (Display Modes)", t("3. Display Modes", "3. 顯示模式 (Display Modes)", "3. 表示モード")),
    ("4. 動畫效果 (Animations)", t("4. Animations", "4. 動畫效果 (Animations)", "4. アニメーション")),
    ("5. 快捷鍵 (Shortcuts)", t("5. Shortcuts", "5. 快捷鍵 (Shortcuts)", "5. ショートカット")),
    ("6. 投影與延伸畫面 (Project)", t("6. Projector", "6. 投影與延伸畫面 (Project)", "6. プロジェクター")),
    ("📋 Lineup (打線模式)", t("📋 Lineup Mode", "📋 Lineup (打線模式)", "📋 打順モード")),
    ("📊 Inning / RHE (局間模式)", t("📊 Inning / RHE Mode", "📊 Inning / RHE (局間模式)", "📊 RHEモード")),
    ("📺 Broadcast (轉播模式)", t("📺 Broadcast Mode", "📺 Broadcast (轉播模式)", "📺 配信モード")),
    ("特色功能：", t("Features:", "特色功能：", "特徴：")),
    ("直覺的操作介面", t("Intuitive Interface", "直覺的操作介面", "直感的なインターフェース")),
    ("豐富的動畫效果與快捷鍵支援", t("Rich animations and shortcut support", "豐富的動畫效果與快捷鍵支援", "豊富なアニメーションとショートカット")),
    ("自訂球隊 Logo 與顏色", t("Custom Team Logos & Colors", "自訂球隊 Logo 與顏色", "カスタムチームロゴとカラー")),
    ("多種顯示模式切換", t("Multiple Display Modes", "多種顯示模式切換", "複数の表示モード")),
    ("投影與分離視窗 (OBS 支援)", t("Project & Detach Window (OBS Support)", "投影與分離視窗 (OBS 支援)", "プロジェクター(OBS対応)")),
    ("球隊設定：", t("Team Settings:", "球隊設定：", "チーム設定：")),
    ("名單管理：", t("Roster Management:", "名單管理：", "名簿管理：")),
    ("全壘打 (Home Run)：", t("Home Run: ", "全壘打 (Home Run)：", "ホームラン：")),
    ("三振 (Strikeout)：", t("Strikeout: ", "三振 (Strikeout)：", "三振：")),
    ("上壘與得分：", t("On-base & Scoring: ", "上壘與得分：", "出塁と得点：")),
    ("關閉", t("Close", "關閉", "閉じる")),
    ("上一頁", t("Prev", "上一頁", "前へ")),
    ("下一頁", t("Next", "下一頁", "次へ")),
    ("開始使用！", t("Get Started!", "開始使用！", "はじめる！")),
    ("壞球 (Ball)", t("Ball", "壞球 (Ball)", "ボール")),
    ("好球 (Strike)", t("Strike", "好球 (Strike)", "ストライク")),
    ("出局 (Out)", t("Out", "出局 (Out)", "アウト")),
    ("復原 (Undo)", t("Undo", "復原 (Undo)", "元に戻す")),
    ("一壘 (長按=一壘安打)", t("1st Base (Hold=1B)", "一壘 (長按=一壘安打)", "一塁 (長押し=単打)")),
    ("二壘 (長按=二壘安打)", t("2nd Base (Hold=2B)", "二壘 (長按=二壘安打)", "二塁 (長押し=二塁打)")),
    ("三壘 (長按=三壘安打)", t("3rd Base (Hold=3B)", "三壘 (長按=三壘安打)", "三塁 (長押し=三塁打)")),
    ("全壘打", t("Home Run", "全壘打", "ホームラン")),
]

# Sort by length
replacements.sort(key=lambda x: len(x[0]), reverse=True)

# Important: ensure there are no collisions
for zh, js_code in replacements:
    text = text.replace(zh, js_code)

with open('components/UserGuideModal.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
