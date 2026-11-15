import re

with open('backup_guide.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the signature
content = content.replace(
    'export const UserGuideModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {',
    'export const UserGuideModal = ({ isOpen, onClose, language }: { isOpen: boolean; onClose: () => void; language: "en" | "zh" | "ja" }) => {'
)

# Helper for ternary translation
def t(en, zh, ja):
    return f"{{language === 'en' ? '{en}' : language === 'zh' ? '{zh}' : '{ja}'}}"

# Now we replace specific blocks.
# I will use a simple find and replace for the static text.
replacements = {
    "計分板使用指南": t("Scoreboard User Guide", "計分板使用指南", "スコアボード ユーザーガイド"),
    "關閉": t("Close", "關閉", "閉じる"),
    "歡迎使用 Pro Baseball Scoreboard！": t("Welcome to Pro Baseball Scoreboard!", "歡迎使用 Pro Baseball Scoreboard！", "Pro Baseball Scoreboardへようこそ！"),
    "這是一款專為棒球轉播與現場大螢幕設計的專業計分板系統。": t("This is a professional scoreboard system designed for baseball broadcasts and live screens.", "這是一款專為棒球轉播與現場大螢幕設計的專業計分板系統。", "これは野球の中継や球場のスクリーン用に設計されたプロ仕様のスコアボードシステムです。"),
    "特色功能：": t("Features:", "特色功能：", "主な機能："),
    "直覺的操作介面": t("Intuitive interface", "直覺的操作介面", "直感的なインターフェース"),
    "豐富的動畫效果": t("Rich animations", "豐富的動畫效果", "豊かなアニメーション効果"),
    "支援鍵盤快捷鍵與遊戲手把": t("Keyboard and Gamepad support", "支援鍵盤快捷鍵與遊戲手把", "キーボードとゲームパッド対応"),
    "自訂球隊 Logo 與顏色": t("Custom team logos and colors", "自訂球隊 Logo 與顏色", "カスタムチームロゴとカラー"),
    "多種顯示模式切換": t("Multiple display modes", "多種顯示模式切換", "複数の表示モード"),
    "投影與分離視窗 (OBS 支援)": t("Projector window (OBS support)", "投影與分離視窗 (OBS 支援)", "プロジェクターウィンドウ (OBS対応)"),
    "控制台分為左右兩側（主客隊），您可以快速調整陣容。": t("The control panel is split into Away and Home. You can quickly adjust the lineup.", "控制台分為左右兩側（主客隊），您可以快速調整陣容。", "コントロールパネルは左右（ビジターとホーム）に分かれており、ラインナップを素早く調整できます。"),
    "球隊設定：": t("Team Settings:", "球隊設定：", "チーム設定："),
    "點擊顏色選取器更改 隊伍色 (TEAM) 與 壘包色 (BASE)。": t("Click color pickers to change Team Color and Base Color.", "點擊顏色選取器更改 隊伍色 (TEAM) 與 壘包色 (BASE)。", "カラーピッカーをクリックしてチーム色とベース色を変更します。"),
    "點擊相機圖示上傳並裁切您的球隊 Logo。": t("Click the camera icon to upload and crop your team logo.", "點擊相機圖示上傳並裁切您的球隊 Logo。", "カメラアイコンをクリックしてチームロゴをアップロードし、トリミングします。"),
    "名單管理：": t("Roster Management:", "名單管理：", "名簿管理："),
    "可以隨意修改球員的背號、姓名、守位與打擊率。": t("You can modify the player\\'s number, name, position, and stat.", "可以隨意修改球員的背號、姓名、守位與打擊率。", "選手の背番号、名前、ポジション、成績を自由に変更できます。"),
    "使用上/下箭頭按鈕將球員在「先發打線」與「板凳」之間移動。": t("Use Up/Down arrows to move players between Lineup and Bench.", "使用上/下箭頭按鈕將球員在「先發打線」與「板凳」之間移動。", "上/下矢印ボタンで選手をスタメンとベンチ間で移動させます。"),
    "點擊球圖示可以一鍵將該球員設為「當前投手」。": t("Click the ball icon to set the player as Current Pitcher.", "點擊球圖示可以一鍵將該球員設為「當前投手」。", "ボールアイコンをクリックすると、その選手を「現在の投手」に設定できます。"),
    "在控制台下方，您可以選擇三種不同的顯示模式：": t("At the bottom of the control panel, you can choose 3 display modes:", "在控制台下方，您可以選擇三種不同的顯示模式：", "コントロールパネルの下部で、3つの表示モードを選択できます："),
    "使用時機：": t("When to use: ", "使用時機：", "使用タイミング："),
    "賽開始前。": t("Before the game starts.", "賽開始前。", "試合開始前。"),
    "顯示兩隊完整的先發打線與守備位置，讓觀眾在賽前了解雙方陣容。": t("Displays full starting lineups and fielding positions.", "顯示兩隊完整的先發打線與守備位置，讓觀眾在賽前了解雙方陣容。", "両チームのスタメンと守備位置を完全に表示し、観客に陣容を知らせます。"),
    "半局結束、攻守交替時。": t("End of a half-inning or side retired.", "半局結束、攻守交替時。", "イニング終了、攻守交代時。"),
    "顯示傳統的九局計分板（Box Score）以及 R (得分)、H (安打)、E (失誤) 統計，讓觀眾快速掌握比賽走向。": t("Displays the traditional 9-inning line score and RHE stats.", "顯示傳統的九局計分板（Box Score）以及 R (得分)、H (安打)、E (失誤) 統計，讓觀眾快速掌握比賽走向。", "伝統的な9イニングスコアボードとRHEの成績を表示し、試合の展開を素早く把握できます。"),
    "比賽進行中。": t("During the game.", "比賽進行中。", "試合進行中。"),
    "精簡的左下角/右下角字卡設計，顯示當前打者、投手、好壞球與壘包狀態。進入「調整模式 (Adjustment Mode)」後，可以自由拖曳位置、縮放大小，甚至": t("Compact bug graphics showing current batter, pitcher, count and bases. In Adjustment Mode, you can drag, scale, and ", "精簡的左下角/右下角字卡設計，顯示當前打者、投手、好壞球與壘包狀態。進入「調整模式 (Adjustment Mode)」後，可以自由拖曳位置、縮放大小，甚至", "現在の打者、投手、カウント、塁の状況を表示するコンパクトなグラフィック。「調整モード」では、ドラッグや縮小拡大、さらに"),
    "調整各個區塊的邊界寬度與高度": t("adjust width and height of each block", "調整各個區塊的邊界寬度與高度", "各ブロックの幅と高さを調整"),
    "，完美契合您的轉播畫面。": t(" to perfectly fit your broadcast.", "，完美契合您的轉播畫面。", "して中継画面に完璧に合わせることができます。"),
    "為了增加轉播的趣味性，我們內建了多種專業的動畫特效：": t("To enhance the broadcast, we built in professional animations:", "為了增加轉播的趣味性，我們內建了多種專業的動畫特效：", "中継を面白くするために、プロ仕様のアニメーションを内蔵しています："),
    "全壘打 (Home Run)：": t("Home Run: ", "全壘打 (Home Run)：", "ホームラン："),
    "根據壘上人數，會顯示 Home Run、2-Run Homer、3-Run Homer 或 Grand Slam (滿貫砲) 的專屬動畫，並帶有隊伍代表色。": t("Shows HR, 2-Run Homer, 3-Run Homer, or Grand Slam animations with team colors based on runners.", "根據壘上人數，會顯示 Home Run、2-Run Homer、3-Run Homer 或 Grand Slam (滿貫砲) 的專屬動畫，並帶有隊伍代表色。", "塁上の走者数に応じて、Home Run, 2-Run Homer, 3-Run Homer, または Grand Slamの専用アニメーションをチームカラーで表示します。"),
    "三振 (Strikeout)：": t("Strikeout: ", "三振 (Strikeout)：", "三振："),
    "當好球數達到 3 時，會觸發「K」字動畫。": t("Triggers a K animation when strikes reach 3.", "當好球數達到 3 時，會觸發「K」字動畫。", "ストライクが3つになると「K」アニメーションが発動します。"),
    "上壘與得分：": t("Base hits and Runs: ", "上壘與得分：", "出塁と得点："),
    "壘包狀態改變與分數跳動時，都有平滑的過渡效果。": t("Smooth transitions for base changes and score updates.", "壘包狀態改變與分數跳動時，都有平滑的過渡效果。", "塁状況の変化や得点の更新時にスムーズなトランジション効果があります。"),
    "支援鍵盤與遊戲手把 (如 PS4 控制器)，讓計分員可以盲操作，視線不離開球場！": t("Supports keyboard and gamepads (like PS4 controller) for blind operation!", "支援鍵盤與遊戲手把 (如 PS4 控制器)，讓計分員可以盲操作，視線不離開球場！", "キーボードやゲームパッド（PS4コントローラーなど）に対応し、ブラインド操作が可能です！"),
    "壞球 (Ball)": t("Ball", "壞球 (Ball)", "ボール"),
    "好球 (Strike)": t("Strike", "好球 (Strike)", "ストライク"),
    "出局 (Out)": t("Out", "出局 (Out)", "アウト"),
    "復原 (Undo)": t("Undo", "復原 (Undo)", "元に戻す"),
    "一壘 (長按=一壘安打)": t("1st Base (Hold=1B)", "一壘 (長按=一壘安打)", "一塁 (長押し=単打)"),
    "二壘 (長按=二壘安打)": t("2nd Base (Hold=2B)", "二壘 (長按=二壘安打)", "二塁 (長押し=二塁打)"),
    "三壘 (長按=三壘安打)": t("3rd Base (Hold=3B)", "三壘 (長按=三壘安打)", "三塁 (長押し=三塁打)"),
    "全壘打": t("Home Run", "全壘打", "ホームラン"),
    "* 您可以在頂部工具列的「Shortcuts」中自訂所有按鍵。若連接手把，可使用 JoyToKey 等軟體將手把按鍵映射為鍵盤按鍵。": t("* You can customize keys in 'Shortcuts' menu. For gamepads, use tools like JoyToKey.", "* 您可以在頂部工具列的「Shortcuts」中自訂所有按鍵。若連接手把，可使用 JoyToKey 等軟體將手把按鍵映射為鍵盤按鍵。", "※上部の「Shortcuts」からすべてのキーをカスタマイズできます。ゲームパッドを使用する場合はJoyToKeyなどのツールを使用してください。"),
    "如果您有雙螢幕（例如連接到現場的大螢幕或轉播軟體 OBS），可以使用 Project 功能。": t("If you have dual screens (e.g. for OBS or live screens), use the Project feature.", "如果您有雙螢幕（例如連接到現場的大螢幕或轉播軟體 OBS），可以使用 Project 功能。", "デュアルスクリーン環境（OBSや球場スクリーンなど）がある場合は、Project機能を使用できます。"),
    "點擊頂部工具列的 ": t("Click ", "點擊頂部工具列的 ", "上部ツールバーの "),
    "「Open Projector」": t("'Open Projector'", "「Open Projector」", "「Open Projector」"),
    " 按鈕。": t(" button.", " 按鈕。", " ボタンをクリックします。"),
    "系統會彈出一個新的瀏覽器視窗，裡面只有乾淨的計分板畫面（沒有控制台）。": t("A new window will open with a clean scoreboard (no controls).", "系統會彈出一個新的瀏覽器視窗，裡面只有乾淨的計分板畫面（沒有控制台）。", "コントロールのないクリーンなスコアボードの新しいウィンドウが開きます。"),
    "將這個新視窗": t("Move this window to your ", "將這個新視窗", "この新しいウィンドウを"),
    "拖曳到您的第二螢幕": t("second screen", "拖曳到您的第二螢幕", "セカンドスクリーンにドラッグ"),
    "，或是讓 OBS 擷取該視窗。": t(" or capture it in OBS.", "，或是讓 OBS 擷取該視窗。", "するか、OBSでキャプチャします。"),
    "您在主視窗（控制台）的所有操作，都會": t("All actions in the control panel will be ", "您在主視窗（控制台）的所有操作，都會", "コントロールパネルでのすべての操作は、"),
    "即時同步": t("synced in real-time", "即時同步", "リアルタイムに同期"),
    "到投影視窗中！": t(" to the projector window!", "到投影視窗中！", "してプロジェクターウィンドウに反映されます！"),
    "OBS / 大螢幕": t("OBS / Live Screen", "OBS / 大螢幕", "OBS / スクリーン"),
    "上一頁": t("Prev", "上一頁", "前へ"),
    "下一頁": t("Next", "下一頁", "次へ"),
    "開始使用！": t("Get Started!", "開始使用！", "はじめる！"),
    "1. 歡迎 (Welcome)": t("1. Welcome", "1. 歡迎 (Welcome)", "1. ようこそ"),
    "2. 隊伍與名單 (Teams & Roster)": t("2. Teams & Roster", "2. 隊伍與名單 (Teams & Roster)", "2. チームと名簿"),
    "3. 顯示模式 (Display Modes)": t("3. Display Modes", "3. 顯示模式 (Display Modes)", "3. 表示モード"),
    "📋 Lineup (打線模式)": t("📋 Lineup Mode", "📋 Lineup (打線模式)", "📋 打順モード"),
    "📊 Inning / RHE (局間模式)": t("📊 Inning / RHE Mode", "📊 Inning / RHE (局間模式)", "📊 RHEモード"),
    "📺 Broadcast (轉播模式)": t("📺 Broadcast Mode", "📺 Broadcast (轉播模式)", "📺 配信モード"),
    "4. 動畫效果 (Animations)": t("4. Animations", "4. 動畫效果 (Animations)", "4. アニメーション"),
    "5. 快捷鍵 (Shortcuts)": t("5. Shortcuts", "5. 快捷鍵 (Shortcuts)", "5. ショートカット"),
    "6. 投影與延伸畫面 (Project)": t("6. Projector", "6. 投影與延伸畫面 (Project)", "6. プロジェクター"),
}

for k, v in replacements.items():
    content = content.replace(k, v)

with open('components/UserGuideModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
