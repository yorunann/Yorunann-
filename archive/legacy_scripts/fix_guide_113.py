import re

with open('components/UserGuideModal.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(
    '<p className="text-slate-600 mt-1"><strong>使用時機：</strong>比賽進行中。</p>',
    '<p className="text-slate-600 mt-1">{language === \'en\' ? <span><strong>When to use:</strong> During gameplay.</span> : language === \'zh\' ? <span><strong>使用時機：</strong>比賽進行中。</span> : <span><strong>使用タイミング：</strong>試合進行中。</span>}</p>'
)

text = text.replace(
    '<p className="text-sm text-slate-500">精簡的左下角/右下角字卡設計，顯示當前打者、投手、好壞球與壘包狀態。進入「調整模式 (Adjustment Mode)」後，可以自由拖曳位置、縮放大小，甚至<strong>調整各個區塊的邊界寬度與高度</strong>，完美契合您的轉播畫面。</p>',
    '<p className="text-sm text-slate-500">{language === \'en\' ? <span>Compact bug graphics showing current batter, pitcher, count and bases. In <strong>Adjustment Mode</strong>, you can drag, scale, and <strong>adjust borders</strong> to fit your broadcast.</span> : language === \'zh\' ? <span>精簡的左下角/右下角字卡設計，顯示當前打者、投手、好壞球與壘包狀態。進入<strong>「調整模式 (Adjustment Mode)」</strong>後，可以自由拖曳位置、縮放大小，甚至<strong>調整各個區塊的邊界寬度與高度</strong>，完美契合您的轉播畫面。</span> : <span>現在の打者、投手、カウント、塁の状況を表示するコンパクトなグラフィック。<strong>「調整モード (Adjustment Mode)」</strong>に入ると、自由にドラッグ、リサイズ、さらには<strong>各セクションの境界線の幅や高さを調整</strong>でき、配信画面に完璧にフィットします。</span>}</p>'
)

with open('components/UserGuideModal.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

