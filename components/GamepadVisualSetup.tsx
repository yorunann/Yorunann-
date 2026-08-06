import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  language?: 'en' | 'zh' | 'ja';
}

const GamepadVisualSetup: React.FC<Props> = ({ language = 'zh' }) => {
  const isEn = language === 'en';
  const isZh = language === 'zh';

  const leftMappings = [
    { id: 'L2', label: isEn ? 'Away Score +1' : isZh ? '客隊分數 +1' : 'ビジター得点 +1', x: 15, y: 15 },
    { id: 'L1', label: isEn ? 'Prev Batter' : isZh ? '上一棒' : '前の打者', sub: isEn ? 'Long: Hide Batter' : isZh ? '長按: 隱藏打者' : '長押し: 打者非表示', x: 15, y: 25 },
    { id: 'DPAD-UP', label: isEn ? '2nd Base' : isZh ? '二壘' : '二塁', sub: isEn ? 'Long: Double' : isZh ? '長按: 二安' : '長押し: 二塁打', x: 15, y: 38 },
    { id: 'DPAD-LEFT', label: isEn ? '3rd Base' : isZh ? '三壘' : '三塁', sub: isEn ? 'Long: Triple' : isZh ? '長按: 三安' : '長押し: 三塁打', x: 15, y: 48 },
    { id: 'DPAD-RIGHT', label: isEn ? '1st Base' : isZh ? '一壘' : '一塁', sub: isEn ? 'Long: Single' : isZh ? '長按: 一安' : '長押し: 単打', x: 15, y: 58 },
    { id: 'DPAD-DOWN', label: isEn ? 'Clear Bases' : isZh ? '清空壘包' : '走者クリア', x: 15, y: 70 },
  ];

  const rightMappings = [
    { id: 'R2', label: isEn ? 'Home Score +1' : isZh ? '主隊分數 +1' : 'ホーム得点 +1', x: 85, y: 15 },
    { id: 'R1', label: isEn ? 'Next Batter' : isZh ? '下一棒' : '次の打者', sub: isEn ? 'Long: Hide Pitcher' : isZh ? '長按: 隱藏投手' : '長押し: 投手非表示', x: 85, y: 25 },
    { id: 'TRIANGLE', label: isEn ? 'Ball' : isZh ? '壞球' : 'ボール', x: 85, y: 38 },
    { id: 'SQUARE', label: isEn ? 'Reset Count' : isZh ? '重置球數' : 'カウントリセット', x: 85, y: 48 },
    { id: 'CIRCLE', label: isEn ? 'Strike' : isZh ? '好球' : 'ストライク', x: 85, y: 58 },
    { id: 'CROSS', label: isEn ? 'Out' : isZh ? '出局' : 'アウト', sub: isEn ? 'Long: Out+Next' : isZh ? '長按: 出局+下一棒' : '長押し: アウト+次打者', x: 85, y: 70 },
  ];

  const centerMappings = [
    { id: 'SHARE', label: isEn ? 'Timer' : isZh ? '計時器' : 'タイマー', x: 38, y: 20 },
    { id: 'TOUCHPAD', label: isEn ? 'Home Run' : isZh ? '全壘打' : 'ホームラン', x: 50, y: 15 },
    { id: 'OPTIONS', label: isEn ? 'Display Mode' : isZh ? '顯示模式' : '表示モード', x: 62, y: 20 },
  ];

  return (
    <div className="relative w-full aspect-[16/10] bg-[#1a1c2c] rounded-xl overflow-hidden p-6 flex items-center justify-center border border-slate-700/50 shadow-2xl">
      {/* Background stylized grid */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="w-full h-full" style={{ backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      <div className="relative w-full h-full flex items-center justify-center">
        {/* Controller SVG */}
        <div className="w-[60%] opacity-90 drop-shadow-[0_0_40px_rgba(59,130,246,0.2)]">
          <svg viewBox="0 0 800 600" className="w-full h-auto">
            {/* Main Body */}
            <path 
              d="M250,150 L550,150 Q650,150 700,250 L730,450 Q730,520 650,520 L550,450 L250,450 L150,520 Q70,520 70,450 L100,250 Q150,150 250,150 Z" 
              fill="#2a2d3e" 
              stroke="#4f5b93" 
              strokeWidth="2"
            />
            
            {/* Inner details */}
            <path d="M300,160 L500,160 L510,280 L290,280 Z" fill="#1e2132" stroke="#4f5b93" strokeWidth="1" /> {/* Touchpad */}
            
            {/* Joysticks */}
            <circle cx="320" cy="400" r="50" fill="#1e2132" stroke="#4f5b93" strokeWidth="2" />
            <circle cx="320" cy="400" r="40" fill="#2a2d3e" stroke="#4f5b93" strokeWidth="1" />
            <circle cx="480" cy="400" r="50" fill="#1e2132" stroke="#4f5b93" strokeWidth="2" />
            <circle cx="480" cy="400" r="40" fill="#2a2d3e" stroke="#4f5b93" strokeWidth="1" />

            {/* D-Pad Area */}
            <circle cx="210" cy="300" r="65" fill="#1e2132" stroke="#4f5b93" strokeWidth="1" strokeDasharray="4 4" />
            <path d="M210,250 L210,350 M160,300 L260,300" stroke="#4f5b93" strokeWidth="12" strokeLinecap="round" opacity="0.4" />
            
            {/* Buttons Area */}
            <circle cx="590" cy="300" r="65" fill="#1e2132" stroke="#4f5b93" strokeWidth="1" strokeDasharray="4 4" />
            <path d="M590,250 L610,280 L570,280 Z" fill="none" stroke="#3b82f6" strokeWidth="2" /> {/* Triangle */}
            <circle cx="630" cy="300" r="12" fill="none" stroke="#ef4444" strokeWidth="2" /> {/* Circle */}
            <path d="M580,340 L600,360 M600,340 L580,360" stroke="#3b82f6" strokeWidth="2" /> {/* Cross */}
            <rect x="540" y="290" width="20" height="20" fill="none" stroke="#eab308" strokeWidth="2" /> {/* Square */}

            {/* Share/Options */}
            <rect x="260" y="200" width="25" height="12" rx="6" fill="#4f5b93" opacity="0.6" />
            <rect x="515" y="200" width="25" height="12" rx="6" fill="#4f5b93" opacity="0.6" />
          </svg>
        </div>

        {/* Left Labels */}
        {leftMappings.map((m, i) => (
          <motion.div 
            key={m.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="absolute flex items-center gap-3"
            style={{ left: `${m.x}%`, top: `${m.y}%`, transform: 'translateX(-100%)' }}
          >
            <div className="text-right">
              <div className="text-slate-400 text-[9px] font-mono uppercase tracking-tighter mb-0.5">{m.id}</div>
              <div className="text-white text-xs font-semibold whitespace-nowrap">{m.label}</div>
              {m.sub && <div className="text-blue-400/70 text-[9px] font-medium whitespace-nowrap">{m.sub}</div>}
            </div>
            <div className="w-12 h-[1px] bg-blue-500/30 relative">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
            </div>
          </motion.div>
        ))}

        {/* Right Labels */}
        {rightMappings.map((m, i) => (
          <motion.div 
            key={m.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="absolute flex items-center gap-3"
            style={{ left: `${m.x}%`, top: `${m.y}%` }}
          >
            <div className="w-12 h-[1px] bg-blue-500/30 relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
            </div>
            <div className="text-left">
              <div className="text-slate-400 text-[9px] font-mono uppercase tracking-tighter mb-0.5">{m.id}</div>
              <div className="text-white text-xs font-semibold whitespace-nowrap">{m.label}</div>
              {m.sub && <div className="text-blue-400/70 text-[9px] font-medium whitespace-nowrap">{m.sub}</div>}
            </div>
          </motion.div>
        ))}

        {/* Center Labels */}
        {centerMappings.map((m, i) => (
          <motion.div 
            key={m.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="absolute flex flex-col items-center gap-2"
            style={{ left: `${m.x}%`, top: `${m.y}%`, transform: 'translateX(-50%)' }}
          >
            <div className="text-center">
              <div className="text-slate-400 text-[9px] font-mono uppercase tracking-tighter mb-0.5">{m.id}</div>
              <div className="text-white text-xs font-semibold whitespace-nowrap">{m.label}</div>
            </div>
            <div className="h-8 w-[1px] bg-blue-500/30 relative">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
            </div>
          </motion.div>
        ))}

        {/* Header/Footer */}
        <div className="absolute top-0 left-0 flex items-center gap-2 opacity-60">
          <div className="w-8 h-8 rounded-full border border-slate-600 flex items-center justify-center text-[10px] text-slate-400 font-bold">PS</div>
          <div className="text-xs text-slate-400 font-bold tracking-widest uppercase">Controller Setup</div>
        </div>
        
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
          <div className="text-[10px] text-blue-400/50 uppercase tracking-[0.3em]">Default Gameplay Controls</div>
          <div className="text-[9px] text-slate-500 italic">Choose your preferred controller layout</div>
        </div>

        <div className="absolute bottom-0 right-0 flex items-center gap-4 opacity-70">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full border border-slate-500 flex items-center justify-center text-[8px] text-slate-400">◯</div>
            <span className="text-[10px] text-slate-400 uppercase font-bold">Back</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded border border-slate-500 flex items-center justify-center text-[8px] text-slate-400">□</div>
            <span className="text-[10px] text-slate-400 uppercase font-bold">Edit</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamepadVisualSetup;
