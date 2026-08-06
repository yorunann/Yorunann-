const fs = require('fs');
let content = fs.readFileSync('components/ScoreboardControls.tsx', 'utf-8');

const replacements = [
  ["language === 'en' ? 'Reset this team?' : '確定要重置此隊伍的陣容與設定嗎？'", "language === 'en' ? 'Reset this team?' : language === 'zh' ? '確定要重置此隊伍的陣容與設定嗎？' : 'このチームのラインナップと設定をリセットしますか？'"],
  ["language === 'en' ? 'Reset Team' : '重置隊伍'", "language === 'en' ? 'Reset Team' : language === 'zh' ? '重置隊伍' : 'チームリセット'"],
  ["language === 'en' ? 'Update Info' : '更新資訊'", "language === 'en' ? 'Update Info' : language === 'zh' ? '更新資訊' : '情報更新'"],
  ["language === 'en' ? 'RHE & Innings' : 'RHE 與局數分數'", "language === 'en' ? 'RHE & Innings' : language === 'zh' ? 'RHE 與局數分數' : 'RHEとイニングスコア'"],
  ["language === 'en' ? 'Game Controls' : '控制台'", "language === 'en' ? 'Game Controls' : language === 'zh' ? '控制台' : 'コントロール'"],
  ["language === 'en' ? 'Teams & Info' : '比賽資訊與名單'", "language === 'en' ? 'Teams & Info' : language === 'zh' ? '比賽資訊與名單' : '試合情報と名簿'"],
  ["language === 'en' ? 'Umpire Controls' : 'Umpire Controls 裁判控制'", "language === 'en' ? 'Umpire Controls' : language === 'zh' ? 'Umpire Controls 裁判控制' : '審判コントロール'"],
  ["language === 'en' ? 'Decrease Ball' : '減少壞球'", "language === 'en' ? 'Decrease Ball' : language === 'zh' ? '減少壞球' : 'ボール-1'"],
  ["language === 'en' ? 'Decrease Strike' : '減少好球'", "language === 'en' ? 'Decrease Strike' : language === 'zh' ? '減少好球' : 'ストライク-1'"],
  ["language === 'en' ? 'Decrease Out' : '減少出局'", "language === 'en' ? 'Decrease Out' : language === 'zh' ? '減少出局' : 'アウト-1'"],
  ["language === 'en' ? 'Reset Count' : '重置好壞球'", "language === 'en' ? 'Reset Count' : language === 'zh' ? '重置好壞球' : 'カウントリセット'"],
  ["language === 'en' ? 'BB / Walk' : '保送 (BB)'", "language === 'en' ? 'BB / Walk' : language === 'zh' ? '保送 (BB)' : '四球 (BB)'"],
  ["language === 'en' ? '1B / Single' : '一壘安'", "language === 'en' ? '1B / Single' : language === 'zh' ? '一壘安' : '単打 (1B)'"],
  ["language === 'en' ? '2B / Double' : '二壘安'", "language === 'en' ? '2B / Double' : language === 'zh' ? '二壘安' : '二塁打 (2B)'"],
  ["language === 'en' ? '3B / Triple' : '三壘安'", "language === 'en' ? '3B / Triple' : language === 'zh' ? '三壘安' : '三塁打 (3B)'"],
  ["language === 'en' ? 'Wild Pitch / Passed Ball' : '暴投 / 捕逸'", "language === 'en' ? 'Wild Pitch / Passed Ball' : language === 'zh' ? '暴投 / 捕逸' : '暴投 / 捕逸'"],
  ["language === 'en' ? 'WP / PB' : '暴投/捕逸'", "language === 'en' ? 'WP / PB' : language === 'zh' ? '暴投/捕逸' : '暴投/捕逸'"],
  ["language === 'en' ? 'Undo (Ctrl+Z)' : '復原 (Ctrl+Z)'", "language === 'en' ? 'Undo (Ctrl+Z)' : language === 'zh' ? '復原 (Ctrl+Z)' : '元に戻す (Ctrl+Z)'"],
  ["language === 'en' ? 'Undo' : '復原'", "language === 'en' ? 'Undo' : language === 'zh' ? '復原' : '元に戻す'"],
  ["language === 'en' ? 'Settings & Timer' : 'Settings & Timer 設定與計時器'", "language === 'en' ? 'Settings & Timer' : language === 'zh' ? 'Settings & Timer 設定與計時器' : '設定とタイマー'"],
  ["language === 'en' ? 'PITCH TIMER (Long Press Display to Reset)' : 'PITCH TIMER 投球計時器 (長按數字重置)'", "language === 'en' ? 'PITCH TIMER (Long Press Display to Reset)' : language === 'zh' ? 'PITCH TIMER 投球計時器 (長按數字重置)' : 'ピッチクロック (長押しでリセット)'"],
  ["language === 'en' ? 'Default' : '預設'", "language === 'en' ? 'Default' : language === 'zh' ? '預設' : '基本'"],
  ["language === 'en' ? 'Lineup' : '打線'", "language === 'en' ? 'Lineup' : language === 'zh' ? '打線' : '打順'"],
  ["language === 'en' ? 'RHE' : '局間'", "language === 'en' ? 'RHE' : language === 'zh' ? '局間' : 'RHE'"],
  ["language === 'en' ? 'Broadcast' : '轉播'", "language === 'en' ? 'Broadcast' : language === 'zh' ? '轉播' : '配信'"],
  ["language === 'en' ? 'Hide Stats' : '隱藏數據'", "language === 'en' ? 'Hide Stats' : language === 'zh' ? '隱藏數據' : '成績非表示'"],
  ["language === 'en' ? 'Hide Pitch Count' : '隱藏投球數'", "language === 'en' ? 'Hide Pitch Count' : language === 'zh' ? '隱藏投球數' : '球数非表示'"],
  ["language === 'en' ? 'Hide Pitch Info' : '隱藏球速'", "language === 'en' ? 'Hide Pitch Info' : language === 'zh' ? '隱藏球速' : '球速非表示'"],
  ["language === 'en' ? 'Hide Batter' : '隱藏打者'", "language === 'en' ? 'Hide Batter' : language === 'zh' ? '隱藏打者' : '打者非表示'"],
  ["language === 'en' ? 'Hide Pitcher' : '隱藏投手'", "language === 'en' ? 'Hide Pitcher' : language === 'zh' ? '隱藏投手' : '投手非表示'"],
  ["language === 'en' ? 'Next Batter' : '下一位打者'", "language === 'en' ? 'Next Batter' : language === 'zh' ? '下一位打者' : '次の打者へ'"],
  ["language === 'en' ? 'Reset Game' : '重置比賽'", "language === 'en' ? 'Reset Game' : language === 'zh' ? '重置比賽' : '試合リセット'"],
  ["language === 'en' ? 'Game Info' : 'Game Info 比賽資訊'", "language === 'en' ? 'Game Info' : language === 'zh' ? 'Game Info 比賽資訊' : '試合情報'"],
  ["language === 'en' ? \"League Name\" : \"League Name 聯盟名稱\"", "language === 'en' ? 'League Name' : language === 'zh' ? 'League Name 聯盟名稱' : 'リーグ名'"],
  ["language === 'en' ? \"Date\" : \"Date 日期\"", "language === 'en' ? 'Date' : language === 'zh' ? 'Date 日期' : '日付'"],
  ["language === 'en' ? \"Game ID\" : \"Game ID 比賽編號\"", "language === 'en' ? 'Game ID' : language === 'zh' ? 'Game ID 比賽編號' : '試合ID'"],
  ["language === 'en' ? \"Broadcaster\" : \"Broadcaster 轉播單位\"", "language === 'en' ? 'Broadcaster' : language === 'zh' ? 'Broadcaster 轉播單位' : '配信者'"],
  ["language === 'en' ? 'Swap Teams' : '主客隊交換'", "language === 'en' ? 'Swap Teams' : language === 'zh' ? '主客隊交換' : '攻守交替'"],
  ["language === 'en' ? 'Reset Teams' : '重置隊伍設定'", "language === 'en' ? 'Reset Teams' : language === 'zh' ? '重置隊伍設定' : 'チーム設定リセット'"],
  ["language === 'en' ? 'Finish Adjustment 結束調整' : 'Adjustment Mode 調整模式'", "language === 'en' ? 'Finish Adjustment 結束調整' : language === 'zh' ? 'Adjustment Mode 調整模式' : '調整モード終了'"],
  ["language as 'en' | 'zh'", "language as 'en' | 'zh' | 'ja'"]
];

for (const [from, to] of replacements) {
  content = content.replace(from, to);
}

// Adjust layout for Japanese
content = content.replace(
  `                 <div className="flex space-x-1">`,
  `                 <div className={language === 'ja' ? "grid grid-cols-2 gap-1" : "flex space-x-1"}>`
);

content = content.replace(
  `                 <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mt-2">`,
  `                 <div className={language === 'ja' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2" : "grid grid-cols-2 lg:grid-cols-3 gap-2 mt-2"}>`
);

content = content.replace(
  `              <div className="grid grid-cols-3 gap-2 mt-3">`,
  `              <div className={language === 'ja' ? "grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3" : "grid grid-cols-3 gap-2 mt-3"}>`
);

// We should also replace the buttons size if needed, but grid-cols-1 sm:grid-cols-3 is responsive.

fs.writeFileSync('components/ScoreboardControls.tsx', content);
