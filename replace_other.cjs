const fs = require('fs');

let gp = fs.readFileSync('components/GamepadVisualSetup.tsx', 'utf-8');
gp = gp.replace("const isEn = language === 'en';", "const isEn = language === 'en';\n  const isZh = language === 'zh';");
gp = gp.replaceAll("isEn ?", "isEn ?"); // noop
// Actually, let's just replace all `isEn ? '...' : '...'` with `isEn ? '...' : isZh ? '...' : '...'`
gp = gp.replace("isEn ? 'Away Score +1' : '客隊分數 +1'", "isEn ? 'Away Score +1' : isZh ? '客隊分數 +1' : 'ビジター得点 +1'");
gp = gp.replace("isEn ? 'Prev Batter' : '上一棒'", "isEn ? 'Prev Batter' : isZh ? '上一棒' : '前の打者'");
gp = gp.replace("isEn ? 'Long: Hide Batter' : '長按: 隱藏打者'", "isEn ? 'Long: Hide Batter' : isZh ? '長按: 隱藏打者' : '長押し: 打者非表示'");
gp = gp.replace("isEn ? '2nd Base' : '二壘'", "isEn ? '2nd Base' : isZh ? '二壘' : '二塁'");
gp = gp.replace("isEn ? 'Long: Double' : '長按: 二安'", "isEn ? 'Long: Double' : isZh ? '長按: 二安' : '長押し: 二塁打'");
gp = gp.replace("isEn ? '3rd Base' : '三壘'", "isEn ? '3rd Base' : isZh ? '三壘' : '三塁'");
gp = gp.replace("isEn ? 'Long: Triple' : '長按: 三安'", "isEn ? 'Long: Triple' : isZh ? '長按: 三安' : '長押し: 三塁打'");
gp = gp.replace("isEn ? '1st Base' : '一壘'", "isEn ? '1st Base' : isZh ? '一壘' : '一塁'");
gp = gp.replace("isEn ? 'Long: Single' : '長按: 一安'", "isEn ? 'Long: Single' : isZh ? '長按: 一安' : '長押し: 単打'");
gp = gp.replace("isEn ? 'Clear Bases' : '清空壘包'", "isEn ? 'Clear Bases' : isZh ? '清空壘包' : '走者クリア'");
gp = gp.replace("isEn ? 'Home Score +1' : '主隊分數 +1'", "isEn ? 'Home Score +1' : isZh ? '主隊分數 +1' : 'ホーム得点 +1'");
gp = gp.replace("isEn ? 'Next Batter' : '下一棒'", "isEn ? 'Next Batter' : isZh ? '下一棒' : '次の打者'");
gp = gp.replace("isEn ? 'Long: Hide Pitcher' : '長按: 隱藏投手'", "isEn ? 'Long: Hide Pitcher' : isZh ? '長按: 隱藏投手' : '長押し: 投手非表示'");
gp = gp.replace("isEn ? 'Ball' : '壞球'", "isEn ? 'Ball' : isZh ? '壞球' : 'ボール'");
gp = gp.replace("isEn ? 'Reset Count' : '重置球數'", "isEn ? 'Reset Count' : isZh ? '重置球數' : 'カウントリセット'");
gp = gp.replace("isEn ? 'Strike' : '好球'", "isEn ? 'Strike' : isZh ? '好球' : 'ストライク'");
gp = gp.replace("isEn ? 'Out' : '出局'", "isEn ? 'Out' : isZh ? '出局' : 'アウト'");
gp = gp.replace("isEn ? 'Long: Out+Next' : '長按: 出局+下一棒'", "isEn ? 'Long: Out+Next' : isZh ? '長按: 出局+下一棒' : '長押し: アウト+次打者'");
gp = gp.replace("isEn ? 'Timer' : '計時器'", "isEn ? 'Timer' : isZh ? '計時器' : 'タイマー'");
gp = gp.replace("isEn ? 'Home Run' : '全壘打'", "isEn ? 'Home Run' : isZh ? '全壘打' : '本塁打'");
gp = gp.replace("isEn ? 'Display Mode' : '顯示模式'", "isEn ? 'Display Mode' : isZh ? '顯示模式' : '表示モード'");
fs.writeFileSync('components/GamepadVisualSetup.tsx', gp);

let sc = fs.readFileSync('components/ShortcutSettingsModal.tsx', 'utf-8');
sc = sc.replaceAll("language === 'en' ? 'Shortcut Settings' : '快捷鍵設定'", "language === 'en' ? 'Shortcut Settings' : language === 'zh' ? '快捷鍵設定' : 'ショートカット設定'");
sc = sc.replaceAll("language === 'en' ? 'Keyboard' : '鍵盤'", "language === 'en' ? 'Keyboard' : language === 'zh' ? '鍵盤' : 'キーボード'");
sc = sc.replaceAll("language === 'en' ? 'Gamepad (PS4)' : '遊戲手把 (PS4)'", "language === 'en' ? 'Gamepad (PS4)' : language === 'zh' ? '遊戲手把 (PS4)' : 'ゲームパッド (PS4)'");
sc = sc.replaceAll("language === 'en' ? 'Press key...' : '請按下按鍵...'", "language === 'en' ? 'Press key...' : language === 'zh' ? '請按下按鍵...' : 'キーを押してください...'");
sc = sc.replaceAll("language === 'en' ? 'Visual' : '視覺化'", "language === 'en' ? 'Visual' : language === 'zh' ? '視覺化' : 'ビジュアル'");
sc = sc.replaceAll("language === 'en' ? 'List' : '列表'", "language === 'en' ? 'List' : language === 'zh' ? '列表' : 'リスト'");
sc = sc.replaceAll("language === 'en' \n                  ? 'Click any action below to reassign its shortcut.'\n                  : '點擊下方任何動作以重新設定其快捷鍵。'", "language === 'en' ? 'Click any action below to reassign its shortcut.' : language === 'zh' ? '點擊下方任何動作以重新設定其快捷鍵。' : '下のアクションをクリックしてショートカットを再設定します。'");
sc = sc.replaceAll("language === 'en' ? 'Reset to Default' : '恢復預設'", "language === 'en' ? 'Reset to Default' : language === 'zh' ? '恢復預設' : 'デフォルトに戻す'");
sc = sc.replaceAll("language === 'en' ? 'Cancel' : '取消'", "language === 'en' ? 'Cancel' : language === 'zh' ? '取消' : 'キャンセル'");
sc = sc.replaceAll("language === 'en' ? 'Save Changes' : '儲存變更'", "language === 'en' ? 'Save Changes' : language === 'zh' ? '儲存變更' : '変更を保存'");
fs.writeFileSync('components/ShortcutSettingsModal.tsx', sc);

let ic = fs.readFileSync('components/ImageCropperModal.tsx', 'utf-8');
ic = ic.replaceAll("language === 'en' ? 'Crop Logo' : '裁切隊徽'", "language === 'en' ? 'Crop Logo' : language === 'zh' ? '裁切隊徽' : 'ロゴを切り抜き'");
ic = ic.replaceAll("language === 'en' ? 'Cancel' : '取消'", "language === 'en' ? 'Cancel' : language === 'zh' ? '取消' : 'キャンセル'");
ic = ic.replaceAll("language === 'en' ? 'Confirm' : '確認'", "language === 'en' ? 'Confirm' : language === 'zh' ? '確認' : '確認'");
fs.writeFileSync('components/ImageCropperModal.tsx', ic);
