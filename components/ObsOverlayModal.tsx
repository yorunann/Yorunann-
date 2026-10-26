import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Tv, Radio, Layers, Sparkles, CheckCircle2, Sliders, Info } from 'lucide-react';
import { GameState } from '../types';

interface ObsOverlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'zh' | 'ja';
  roomCode: string;
  currentDisplayMode: GameState['displayMode'];
}

type OverlayLayout = 'broadcast' | 'follow' | 'default' | 'lineup' | 'rhe';

export const ObsOverlayModal: React.FC<ObsOverlayModalProps> = ({
  isOpen,
  onClose,
  language,
  roomCode,
  currentDisplayMode,
}) => {
  const [selectedLayout, setSelectedLayout] = useState<OverlayLayout>('broadcast');
  const [useRemoteRoom, setUseRemoteRoom] = useState<boolean>(true);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  
  // Construct OBS URL
  const params = new URLSearchParams();
  params.set('mode', 'obs');
  if (selectedLayout !== 'follow') {
    params.set('layout', selectedLayout);
  }
  if (useRemoteRoom && roomCode) {
    params.set('room', roomCode);
  }
  
  const obsUrl = `${origin}/?${params.toString()}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(obsUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = obsUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const handleOpenPreview = () => {
    window.open(obsUrl, '_blank');
  };

  const t = {
    title: language === 'zh' ? 'OBS 實況透明圖層' : language === 'ja' ? 'OBS 透過オーバーレイ' : 'OBS Transparent Overlay',
    subtitle: language === 'zh' 
      ? '專為 OBS Studio / Streamlabs 設計的透明 Browser Source，無縫疊加於比賽轉播畫面！' 
      : language === 'ja' 
      ? 'OBS Studio / Streamlabs 専用の透過ブラウザソース。配信映像に重ねて即座にスコアを表示！'
      : 'Transparent Browser Source designed for OBS Studio / Streamlabs to overlay real-time scoreboards onto live video streams!',
    layoutLabel: language === 'zh' ? '1. 選擇圖層樣式' : language === 'ja' ? '1. オーバーレイスタイル選択' : '1. Select Overlay Style',
    syncLabel: language === 'zh' ? '2. 同步模式' : language === 'ja' ? '2. 同期モード' : '2. Sync Mode',
    urlLabel: language === 'zh' ? '3. 專屬透明圖層網址 (OBS 瀏覽器來源專用)' : language === 'ja' ? '3. 専用透過URL (OBSブラウザソース用)' : '3. OBS Browser Source URL',
    copyBtn: language === 'zh' ? '複製網址' : language === 'ja' ? 'URLをコピー' : 'Copy URL',
    copiedBtn: language === 'zh' ? '已複製！' : language === 'ja' ? 'コピー完了！' : 'Copied!',
    previewBtn: language === 'zh' ? '開新分頁預覽' : language === 'ja' ? 'プレビュー表示' : 'Preview Overlay',
    instructionsTitle: language === 'zh' ? 'OBS Studio 快速設定 4 步驟' : language === 'ja' ? 'OBS Studio 設定手順' : 'OBS Studio Setup in 4 Quick Steps',
    step1: language === 'zh' ? '在 OBS 的「來源 (Sources)」面板中，點擊「+」並新增「瀏覽器 (Browser)」' : language === 'ja' ? 'OBSの「ソース」パネルで「+」を押し、「ブラウザ」を追加します' : 'In OBS "Sources" dock, click "+" and select "Browser"',
    step2: language === 'zh' ? '將上方複製的透明圖層網址貼入「網址 (URL)」欄位' : language === 'ja' ? '上記でコピーした透過URLを「URL」項目に貼り付けます' : 'Paste the copied transparent URL into the "URL" field',
    step3: language === 'zh' ? '將寬度設為 1920、高度設為 1080（預設全景透明，字卡自動靠邊浮現）' : language === 'ja' ? '幅を 1920、高さを 1080 に設定（背景は完全透過、左下に自動配置）' : 'Set Width to 1920 and Height to 1080 (fully transparent, auto-docked to corner)',
    step4: language === 'zh' ? '點擊確定，計分板即時透明浮現在實況畫面上！無須手動綠幕去背。' : language === 'ja' ? '「OK」をクリック！グリーンバックなどの色抜き設定は不要で透過表示されます。' : 'Click OK! The scoreboard floats cleanly with 100% true alpha transparency.',
    tipNote: language === 'zh'
      ? '💡 提示：全壘打動畫 (HR)、三振特效 (K)、投手用球數與跑者狀況均會即時同步播放。若需調整比分條大小或邊距，可在本機控制台「拖曳模式」調整，或在 OBS 來源按右鍵「互動 (Interact)」即時拉伸！'
      : language === 'ja'
      ? '💡 ヒント：ホームラン演出、三振(K)アニメーション、投手の投球数もすべてリアルタイムで同期されます。'
      : '💡 Tip: Home Run & Strikeout (K) animations, pitcher count, and runners sync dynamically with zero chroma key needed!',
  };

  const layouts = [
    {
      id: 'broadcast' as OverlayLayout,
      name: language === 'zh' ? '轉播比分條 (推薦)' : language === 'ja' ? '実況スコアバー (推奨)' : 'Broadcast Scorebug (Recommended)',
      desc: language === 'zh' ? '現代電視轉播角落小字卡，含隊名、比分、BSO、壘包與球數' : language === 'ja' ? '画面隅に配置される実況用スコアバナー' : 'Corner lower-third bug with teams, scores, counts, bases, pitcher NP',
      badge: language === 'zh' ? '實況首選' : language === 'ja' ? '定番' : 'Popular',
    },
    {
      id: 'follow' as OverlayLayout,
      name: language === 'zh' ? '隨主控台連動' : language === 'ja' ? 'メイン画面に連動' : 'Follow Controller Mode',
      desc: language === 'zh' ? '自動連動當前主畫面（轉播條、先發打線、經典比分板、局間RHE）' : language === 'ja' ? '操作側の表示モード切り替えにリアルタイム連動' : 'Switches dynamically whenever you change display mode on the dashboard',
      badge: language === 'zh' ? '自動' : language === 'ja' ? '自動' : 'Auto',
    },
    {
      id: 'default' as OverlayLayout,
      name: language === 'zh' ? '經典計分板' : language === 'ja' ? 'クラシックスコアボード' : 'Classic Scoreboard',
      desc: language === 'zh' ? '雙隊完整打線與中央計分板，透明外框疊加' : language === 'ja' ? 'ラインナップと中央大型スコアボードの透明配置' : 'Full dual lineup and center scoreboard with transparent back',
      badge: language === 'zh' ? '完整' : language === 'ja' ? '全体' : 'Full',
    },
    {
      id: 'lineup' as OverlayLayout,
      name: language === 'zh' ? '先發打線字卡' : language === 'ja' ? 'スターティングメンバー' : 'Starting Lineup Cards',
      desc: language === 'zh' ? '兩隊先發球員打序大字卡，適合賽前轉播介紹' : language === 'ja' ? '試合開始前の両チームスタメン紹介' : 'Starting lineup cards, ideal for pre-game coverage',
      badge: language === 'zh' ? '賽前' : language === 'ja' ? '試合前' : 'Pre-Game',
    },
    {
      id: 'rhe' as OverlayLayout,
      name: language === 'zh' ? '局間 RHE 比分' : language === 'ja' ? 'RHE イニング詳細' : 'Box Score (RHE)',
      desc: language === 'zh' ? '各局詳細得分板與安打失誤統計，適合半局換場' : language === 'ja' ? '各イニングの得点・安打・失策ボックススコア' : 'Inning-by-inning box score with Runs, Hits, and Errors',
      badge: language === 'zh' ? '局間' : language === 'ja' ? '回間' : 'Mid-Inning',
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
              <Tv size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">{t.title}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  OBS Source
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{t.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Step 1: Layout Selection */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={14} className="text-indigo-400" />
              <span>{t.layoutLabel}</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {layouts.map((item) => {
                const isSelected = selectedLayout === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedLayout(item.id)}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer relative flex items-center justify-between gap-2 ${
                      isSelected 
                        ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg' 
                        : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <span className={`font-bold text-sm ${isSelected ? 'text-indigo-300' : 'text-white'}`}>
                      {item.name}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                      isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {item.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Sync Mode Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Radio size={14} className="text-indigo-400" />
              <span>{t.syncLabel}</span>
            </label>
            <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl space-y-2.5">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={useRemoteRoom}
                  onChange={(e) => setUseRemoteRoom(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-600 focus:ring-indigo-500 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-200">
                    {language === 'zh' ? `附帶跨裝置雲端同步房間代碼 (#${roomCode})` : language === 'ja' ? `遠隔ルームコード付加 (#${roomCode})` : `Include Remote Room Code (#${roomCode})`}
                  </span>
                  <p className="text-[11px] text-slate-400">
                    {language === 'zh' 
                      ? '勾選後，即使 OBS 與記分板在不同電腦/手機上，也能透過 WebRTC 無線即時更新！若在同一台電腦執行 OBS，勾不勾選皆能極速同步。'
                      : 'Allows OBS to receive live score updates wirelessly from other PCs or mobile controllers via WebRTC.'}
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Step 3: Generated URL */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Tv size={14} className="text-indigo-400" />
                <span>{t.urlLabel}</span>
              </span>
              <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle2 size={12} />
                <span>100% Alpha Transparent</span>
              </span>
            </label>

            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <div className="flex-1 bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2.5 font-mono text-xs text-indigo-300 overflow-x-auto whitespace-nowrap select-all shadow-inner">
                {obsUrl}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopy}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg cursor-pointer ${
                    isCopied 
                      ? 'bg-emerald-600 text-white scale-95 shadow-emerald-900/40' 
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/40 active:scale-95'
                  }`}
                >
                  {isCopied ? <Check size={16} /> : <Copy size={16} />}
                  <span>{isCopied ? t.copiedBtn : t.copyBtn}</span>
                </button>
                <button
                  onClick={handleOpenPreview}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors border border-slate-700 cursor-pointer"
                  title={t.previewBtn}
                >
                  <ExternalLink size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Step 4: Step-by-Step Instructions */}
          <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-400" />
              <span>{t.instructionsTitle}</span>
            </h4>
            <div className="grid grid-cols-1 gap-2 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 font-bold flex items-center justify-center text-[11px] shrink-0">1</span>
                <span>{t.step1}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 font-bold flex items-center justify-center text-[11px] shrink-0">2</span>
                <span>{t.step2}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 font-bold flex items-center justify-center text-[11px] shrink-0">3</span>
                <span>{t.step3}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 font-bold flex items-center justify-center text-[11px] shrink-0">4</span>
                <span>{t.step4}</span>
              </div>
            </div>
          </div>

          {/* Helpful Tips */}
          <div className="p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-xl text-xs text-indigo-200/90 leading-relaxed flex items-start gap-2">
            <Info size={16} className="text-indigo-400 shrink-0 mt-0.5" />
            <div>{t.tipNote}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            OBS Studio 28+ / Streamlabs Desktop Compatible
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            {language === 'zh' ? '關閉' : language === 'ja' ? '閉じる' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
