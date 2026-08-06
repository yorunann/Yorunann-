import re

with open('components/ScoreboardControls.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Add new imports
if "useEffect," not in text:
    text = text.replace("import React, { ", "import React, { useEffect, ")
if "useRef" not in text:
    text = text.replace("import React, { ", "import React, { useRef, ")

# Inject hooks for HR button inside ScoreboardControls component
# Find start of component
old_start = '''export const ScoreboardControls: React.FC<ScoreboardControlsProps> = ({ state, dispatch, isLocalAction }) => {
  const language = state.language || 'en';'''

new_start = '''export const ScoreboardControls: React.FC<ScoreboardControlsProps> = ({ state, dispatch, isLocalAction }) => {
  const language = state.language || 'en';

  const [hrState, setHrState] = React.useState<'idle' | 'playing' | 'locked'>('idle');
  const hrTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const hrLockTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const hrBubbleIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
     if (!state.animation && hrState !== 'idle') {
         setHrState('idle');
         if (hrTimeoutRef.current) clearTimeout(hrTimeoutRef.current);
         if (hrBubbleIntervalRef.current) clearInterval(hrBubbleIntervalRef.current);
     }
  }, [state.animation, hrState]);

  const endHr = () => {
    setHrState('idle');
    if (hrTimeoutRef.current) clearTimeout(hrTimeoutRef.current);
    if (hrBubbleIntervalRef.current) clearInterval(hrBubbleIntervalRef.current);
    dispatch({ type: 'SET_ANIMATION', animation: null });
  };

  const handleHrMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (hrState === 'locked') {
       endHr();
       return;
    }
    if (hrState === 'playing') {
       return;
    }

    setHrState('playing');
    const team = state.isTop ? state.awayTeam : state.homeTeam;
    const batter = team.lineup[team.currentBatterIndex] || { name: 'Unknown' };
    const runnersOnBase = state.bases.filter(Boolean).length;
    let animationType: 'homerun' | '2-run-homer' | '3-run-homer' | 'grand-slam' = 'homerun';
    if (runnersOnBase === 1) animationType = '2-run-homer';
    else if (runnersOnBase === 2) animationType = '3-run-homer';
    else if (runnersOnBase === 3) animationType = 'grand-slam';
    
    dispatch({ 
      type: 'SET_ANIMATION', 
      animation: {
        type: animationType,
        playerName: batter.name,
        teamName: team.name,
        teamColor: team.color
      }
    });
    dispatch({ type: 'HOME_RUN' });

    hrLockTimeoutRef.current = setTimeout(() => {
        setHrState('locked');
        if (hrTimeoutRef.current) clearTimeout(hrTimeoutRef.current);
        hrBubbleIntervalRef.current = setInterval(() => {
            dispatch({ type: 'TRIGGER_HR_BUBBLE' });
        }, 3000);
    }, 500);

    hrTimeoutRef.current = setTimeout(() => {
        setHrState(prev => {
            if (prev === 'playing') {
                dispatch({ type: 'SET_ANIMATION', animation: null });
                return 'idle';
            }
            return prev;
        });
    }, 5000);
  };

  const handleHrMouseUp = () => {
    if (hrLockTimeoutRef.current) {
        clearTimeout(hrLockTimeoutRef.current);
        hrLockTimeoutRef.current = null;
    }
  };

  const handleHrDoubleClick = () => {
     endHr();
  };
'''
if "const [hrState, setHrState]" not in text:
    text = text.replace(old_start, new_start)

# Replace the HR button
old_button = '''                <button 
                  className="w-16 h-16 bg-purple-600 hover:bg-purple-700 text-white font-black text-xl rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 animate-pulse flex items-center justify-center shrink-0 border-4 border-purple-800"
                  onClick={() => {
                    const team = state.isTop ? state.awayTeam : state.homeTeam;
                    const batter = team.lineup[team.currentBatterIndex] || { name: 'Unknown' };
                    const runnersOnBase = state.bases.filter(Boolean).length;
                    let animationType: 'homerun' | '2-run-homer' | '3-run-homer' | 'grand-slam' = 'homerun';
                    if (runnersOnBase === 1) animationType = '2-run-homer';
                    else if (runnersOnBase === 2) animationType = '3-run-homer';
                    else if (runnersOnBase === 3) animationType = 'grand-slam';
                    
                    dispatch({ 
                      type: 'SET_ANIMATION', 
                      animation: {
                        type: animationType,
                        playerName: batter.name,
                        teamName: team.name,
                        teamColor: team.color
                      }
                    });
                    dispatch({ type: 'HOME_RUN' });
                    setTimeout(() => dispatch({ type: 'SET_ANIMATION', animation: null }), 5000);
                  }}
                  title="HOME RUN"
                >
                  HR
                </button>'''

new_button = '''                <div className="relative w-16 h-16 shrink-0 group">
                   {hrState === 'playing' && (
                      <svg className="absolute inset-[-4px] w-[72px] h-[72px] -rotate-90 pointer-events-none rounded-full" style={{ zIndex: 10 }}>
                          <circle cx="36" cy="36" r="34" stroke="transparent" strokeWidth="4" fill="none" />
                          <circle cx="36" cy="36" r="34" stroke="#a855f7" strokeWidth="4" fill="none" strokeDasharray="213.6" style={{ animation: 'hrProgressSvg 5s linear forwards' }} />
                      </svg>
                   )}
                   {hrState === 'locked' && (
                      <div className="absolute inset-[-4px] rounded-full border-4 border-purple-500 shadow-[0_0_10px_#a855f7]" style={{ zIndex: 10, pointerEvents: 'none' }} />
                   )}
                   <button 
                     className={`absolute inset-0 bg-purple-600 hover:bg-purple-700 text-white font-black text-xl rounded-full shadow-lg transition-transform active:scale-95 flex items-center justify-center border-4 border-transparent ${hrState !== 'idle' ? 'animate-pulse' : ''}`}
                     onMouseDown={handleHrMouseDown}
                     onMouseUp={handleHrMouseUp}
                     onMouseLeave={handleHrMouseUp}
                     onTouchStart={handleHrMouseDown}
                     onTouchEnd={handleHrMouseUp}
                     onDoubleClick={handleHrDoubleClick}
                     title="HOME RUN (Hold to lock)"
                   >
                     HR
                   </button>
                </div>'''
text = text.replace(old_button, new_button)

# Also update the 1B/2B/3B row layout
old_grid = '''              <div className={language === 'ja' ? "grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3" : "grid grid-cols-3 gap-2 mt-3"}>
                <button 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded shadow transition-transform active:scale-95 text-xs text-center"
                  onClick={() => dispatch({ type: 'SINGLE' })}
                >
                  {language === 'en' ? '1B / Single' : language === 'zh' ? '一壘安' : 'シングル (1B)'}
                </button>
                <button 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded shadow transition-transform active:scale-95 text-xs text-center"
                  onClick={() => dispatch({ type: 'DOUBLE' })}
                >
                  {language === 'en' ? '2B / Double' : language === 'zh' ? '二壘安' : 'ツーベース (2B)'}
                </button>
                <button 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded shadow transition-transform active:scale-95 text-xs text-center"
                  onClick={() => dispatch({ type: 'TRIPLE' })}
                >
                  {language === 'en' ? '3B / Triple' : language === 'zh' ? '三壘安' : 'スリーベース (3B)'}
                </button>
                <button 
                  className="sm:col-span-2 col-span-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded shadow transition-transform active:scale-95 text-xs"
                  onClick={() => dispatch({ type: 'WALK' })}
                >
                  {language === 'en' ? 'BB / Walk' : language === 'zh' ? '保送 (Walk)' : '四死球 (Walk)'}
                </button>
                <button 
                  className="col-span-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 rounded text-xs shadow-md"
                  onClick={() => dispatch({ type: 'WILD_PITCH' })}
                  title={language === 'en' ? 'Wild Pitch / Passed Ball' : language === 'zh' ? '暴投 / 捕逸' : '暴投 / 捕逸'}
                >
                  {language === 'en' ? 'WP / PB' : language === 'zh' ? '暴投/捕逸' : '暴投/捕逸'}
                </button>
              </div>'''

new_grid = '''              <div className="flex flex-col gap-1.5 mt-3">
                <button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded shadow transition-transform active:scale-95 text-xs text-center"
                  onClick={() => dispatch({ type: 'SINGLE' })}
                >
                  {language === 'en' ? '1B / Single' : language === 'zh' ? '一壘安' : 'シングル (1B)'}
                </button>
                <button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded shadow transition-transform active:scale-95 text-xs text-center"
                  onClick={() => dispatch({ type: 'DOUBLE' })}
                >
                  {language === 'en' ? '2B / Double' : language === 'zh' ? '二壘安' : 'ツーベース (2B)'}
                </button>
                <button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded shadow transition-transform active:scale-95 text-xs text-center"
                  onClick={() => dispatch({ type: 'TRIPLE' })}
                >
                  {language === 'en' ? '3B / Triple' : language === 'zh' ? '三壘安' : 'スリーベース (3B)'}
                </button>
                <div className="flex gap-2 w-full mt-1">
                  <button 
                    className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded shadow transition-transform active:scale-95 text-xs"
                    onClick={() => dispatch({ type: 'WALK' })}
                  >
                    {language === 'en' ? 'BB / Walk' : language === 'zh' ? '保送 (Walk)' : '四死球 (Walk)'}
                  </button>
                  <button 
                    className="flex-[1] bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 rounded text-xs shadow-md"
                    onClick={() => dispatch({ type: 'WILD_PITCH' })}
                    title={language === 'en' ? 'Wild Pitch / Passed Ball' : language === 'zh' ? '暴投 / 捕逸' : '暴投 / 捕逸'}
                  >
                    {language === 'en' ? 'WP / PB' : language === 'zh' ? '暴投/捕逸' : '暴投/捕逸'}
                  </button>
                </div>
              </div>'''
text = text.replace(old_grid, new_grid)

with open('components/ScoreboardControls.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
