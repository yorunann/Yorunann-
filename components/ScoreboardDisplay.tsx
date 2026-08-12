import React, { useRef, useEffect, useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, ActionType, Team, Player } from '../types';
import { Diamond } from './Diamond';
import { Timer, Plus, Minus, GripVertical, ArrowDown, ArrowUp, RotateCcw } from 'lucide-react';
import { AutoScalingText } from './AutoScalingText';
import {
  DndContext, 
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

interface ScoreboardDisplayProps {
  state: GameState;
  dispatch: React.Dispatch<ActionType>;
  language?: 'en' | 'zh';
}

// Simple Audio Context Helper
const playBeep = (freq: number, duration: number, type: 'sine' | 'square' | 'triangle' = 'sine') => {
  try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.value = freq;
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      
      // Fade out
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
      
      osc.stop(ctx.currentTime + duration);
  } catch (e) {
      console.error("Audio playback failed", e);
  }
};

// Helper for Score Animation
const AnimatedScore = ({ score, color, sizeClass, disableScale, style }: { score: number, color?: string, sizeClass?: string, disableScale?: boolean, style?: React.CSSProperties }) => {
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        setAnimate(true);
        const timer = setTimeout(() => setAnimate(false), 500); // 500ms flash
        return () => clearTimeout(timer);
    }, [score]);

    return (
        <div 
          className={`flex items-center justify-center w-full h-full ${sizeClass || 'text-[5rem] sm:text-[9rem] lg:text-[12rem] xl:text-[17rem]'} font-bold text-center cursor-pointer select-none transition-all drop-shadow-lg leading-none rounded-lg ${animate ? (disableScale ? 'scale-110' : 'scale-150') + ' duration-150 z-50' : 'duration-300'}`}
          style={{ 
             color: animate ? '#fde047' : 'white', // Yellow flash
             textShadow: animate ? `0 0 40px ${color || '#fde047'}` : 'none',
             ...style
          }}
        >
          {score}
        </div>
    );
};

// Helper for Indicator Animation (Ball/Strike/Out)
interface AnimatedIndicatorProps {
  active: boolean;
  colorClass: string;
  shadowClass: string;
  baseClass: string;
  disableAnimation?: boolean;
  disableGlow?: boolean;
}


const TeamLogo = ({ team, isActive }: { team: Team, isActive?: boolean }) => {
    return (
        <div className="relative shrink-0 w-10 h-10 sm:w-16 sm:h-16 lg:w-20 lg:h-20">
            {isActive && <div className="absolute inset-[-2px] rounded-full border-2 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)] animate-[pulse_2s_ease-in-out_infinite] z-20 pointer-events-none"></div>}
            <div className={`w-full h-full rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border-2 z-10 shadow-lg ${isActive ? 'border-yellow-400' : 'border-slate-700 shadow-black/20'}`} style={{ backgroundColor: team.color }}>
                {team.logoUrl ? (
                    <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-white font-bold text-xl sm:text-3xl drop-shadow-md">{team.name.charAt(0)}</span>
                )}
            </div>
        </div>
    );
};

interface SortablePlayerItemProps { p: Player; idx: number; activeBatterId: string | undefined; isAway: boolean; isBench?: boolean; state?: any; dispatch?: any; }
const SortablePlayerItem: React.FC<SortablePlayerItemProps> = ({ p, idx, activeBatterId, isAway, isBench }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: p.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 0,
        opacity: isDragging ? 0.5 : 1
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            {...attributes} 
            {...listeners} 
            className={`flex justify-between items-center px-1.5 sm:px-2 py-1 rounded transition-colors cursor-grab active:cursor-grabbing ${activeBatterId === p.id && !isBench ? "bg-blue-600/30 ring-1 ring-blue-500" : "hover:bg-slate-700/50"}`}
        >
            <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                {!isBench && <span className="text-[10px] sm:text-xs text-slate-400 font-mono w-3 sm:w-4 shrink-0">{idx + 1}.</span>}
                <span className={`text-[10px] sm:text-xs font-bold truncate ${activeBatterId === p.id && !isBench ? "text-white" : "text-slate-300"}`}>
                    {p.name}
                    {p.number && <span className="ml-1 text-[9px] sm:text-[10px] text-slate-500">#{p.number}</span>}
                </span>
            </div>
            <span className="text-[9px] sm:text-[10px] font-mono text-slate-500 shrink-0 ml-2">{p.stat}</span>
        </div>
    );
};

const AnimatedIndicator: React.FC<AnimatedIndicatorProps> = ({ active, colorClass, shadowClass, baseClass, disableAnimation = false, disableGlow = false }) => {
    return (
        <div 
            key={active ? "active" : "inactive"}
            className={`${baseClass} ${active ? `${colorClass} ${disableGlow ? "" : shadowClass} border-transparent ${disableAnimation ? "" : "animate-pop-in"}` : "bg-slate-900 border-slate-600"} transition-colors duration-200`} 
        />
    );
};

const LineupColumn = ({ team, isAway, state, dispatch }: { team: Team, isAway: boolean, state: GameState, dispatch: React.Dispatch<ActionType> }) => {
    const isTeamPitching = isAway ? !state.isTop : state.isTop;
    const activeBatterId = state.isTop ? state.awayTeam.lineup[state.awayTeam.currentBatterIndex]?.id : state.homeTeam.lineup[state.homeTeam.currentBatterIndex]?.id;
    const isLineupMode = state.displayMode === 'lineup';
    
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const {active, over} = event;
        
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        if (activeId === overId) return;

        const teamKey = isAway ? 'away' : 'home';

        // Check if active is in lineup or bench
        const activeInLineupIdx = team.lineup.findIndex(p => p.id === activeId);
        const activeInBenchIdx = team.bench.findIndex(p => p.id === activeId);

        // Check if over is in lineup or bench
        const overInLineupIdx = team.lineup.findIndex(p => p.id === overId);
        const overInBenchIdx = team.bench.findIndex(p => p.id === overId);

        // Case 1: Reorder within Lineup
        if (activeInLineupIdx !== -1 && overInLineupIdx !== -1) {
            dispatch({
                type: 'REORDER_LINEUP',
                team: teamKey,
                startIndex: activeInLineupIdx,
                endIndex: overInLineupIdx
            });
        }
        // Case 2: Reorder within Bench
        else if (activeInBenchIdx !== -1 && overInBenchIdx !== -1) {
            dispatch({
                type: 'REORDER_BENCH',
                team: teamKey,
                startIndex: activeInBenchIdx,
                endIndex: overInBenchIdx
            });
        }
        // Case 3: Move from Bench to Lineup
        else if (activeInBenchIdx !== -1 && overInLineupIdx !== -1) {
            dispatch({
                type: 'MOVE_TO_LINEUP',
                team: teamKey,
                index: activeInBenchIdx
            });
            // After moving, we might want to reorder, but MOVE_TO_LINEUP usually appends.
            // For simplicity, we just move it.
        }
        // Case 4: Move from Lineup to Bench
        else if (activeInLineupIdx !== -1 && overInBenchIdx !== -1) {
            dispatch({
                type: 'MOVE_TO_BENCH',
                team: teamKey,
                index: activeInLineupIdx
            });
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-950 border-r-2 border-slate-800 relative min-h-0">
            {/* Header */}
            <div className="p-3 border-b-2 border-slate-800 flex items-center gap-3 relative overflow-hidden shrink-0">
                 <div className="absolute inset-0 opacity-20" style={{ backgroundColor: team.color }}></div>
                 <TeamLogo team={team} />
                 <div className="flex flex-col relative z-10 min-w-0 flex-1">
                     <AutoScalingText text={team.name} className="text-3xl font-bold leading-none" align="left" />
                     <AutoScalingText text={team.fullName} className="text-xs text-slate-400 font-bold uppercase" align="left" />
                 </div>
            </div>

            <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis]}
            >
                {/* Lineup List */}
                <div className="flex-1 flex flex-col p-2 gap-1 overflow-y-auto no-scrollbar min-h-0">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 px-1">Lineup</div>
                    <SortableContext 
                        items={team.lineup.map(p => p.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {team.lineup.map((p, idx) => (
                            <SortablePlayerItem 
                                key={p.id}
                                p={p}
                                idx={idx}
                                activeBatterId={activeBatterId}
                                isAway={isAway}
                                state={state}
                                dispatch={dispatch}
                                isBench={false}
                            />
                        ))}
                    </SortableContext>

                    {/* Bench List */}
                    {!isLineupMode && (
                        <div className="mt-4">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 px-1 border-t border-slate-800 pt-2">Bench</div>
                            <SortableContext 
                                items={team.bench.map(p => p.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="flex flex-col gap-1">
                                    {team.bench.map((p, idx) => (
                                        <SortablePlayerItem 
                                            key={p.id}
                                            p={p}
                                            idx={idx}
                                            activeBatterId={activeBatterId}
                                            isAway={isAway}
                                            state={state}
                                            dispatch={dispatch}
                                            isBench={true}
                                        />
                                    ))}
                                    {team.bench.length === 0 && (
                                        <div className="text-center text-slate-700 text-[10px] py-4 border border-dashed border-slate-800 rounded">
                                            Empty Bench
                                        </div>
                                    )}
                                </div>
                            </SortableContext>
                        </div>
                    )}
                </div>
            </DndContext>

            {/* Pitcher Slot (Bottom) */}
            <div className="p-2 border-t-2 border-slate-800 bg-slate-900 mt-auto shrink-0">
                {isTeamPitching ? (
                    <div className="flex items-center justify-between bg-red-900/20 border-2 border-red-900/50 p-2 rounded">
                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest">Pitching</span>
                            <AutoScalingText text={`${team.pitcher.name} #${team.pitcher.number}`} className="text-white font-bold" align="left" />
                        </div>
                        {state.showPlayerStat && <span className="text-xl text-yellow-500 font-display ml-2">{team.pitcher.stat}</span>}
                    </div>
                ) : (
                     <div className="flex items-center justify-between bg-blue-900/20 border-2 border-blue-900/50 p-2 rounded cursor-pointer hover:bg-blue-900/30 transition-colors" onClick={() => dispatch({ type: 'NEXT_BATTER' })}>
                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Batting</span>
                            <AutoScalingText text={`${team.lineup[team.currentBatterIndex]?.name} #${team.lineup[team.currentBatterIndex]?.number}`} className="text-white font-bold" align="left" />
                        </div>
                        {state.showPlayerStat && <span className="text-xl text-yellow-500 font-display ml-2">{team.lineup[team.currentBatterIndex]?.stat}</span>}
                     </div>
                )}
            </div>
        </div>
    );
};

export const ScoreboardDisplay = forwardRef<HTMLDivElement, ScoreboardDisplayProps>(({ state, dispatch, language = 'zh' }, ref) => {
  const [showInningControls, setShowInningControls] = useState(false);
  const [showScoreControlsHome, setShowScoreControlsHome] = useState(false);
  const [showScoreControlsAway, setShowScoreControlsAway] = useState(false);
  const [showKAnimation, setShowKAnimation] = useState(false);
  const [showUmpireControls, setShowUmpireControls] = useState(false);
  const umpireTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignoreUmpireClickRef = useRef(false);

  const handleInningMouseDown = () => {
    ignoreUmpireClickRef.current = false;
    umpireTimerRef.current = setTimeout(() => {
        setShowUmpireControls(true);
        setShowInningControls(false);
        ignoreUmpireClickRef.current = true;
    }, 600);
  };

  const handleInningMouseUp = () => {
    if (umpireTimerRef.current) clearTimeout(umpireTimerRef.current);
  };

  const handleInningClick = (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      if (ignoreUmpireClickRef.current) return;
      if (showUmpireControls) {
          setShowUmpireControls(false);
          return;
      }
      setShowInningControls(!showInningControls);
      setShowScoreControlsHome(false);
      setShowScoreControlsAway(false);
      if (!showInningControls) {
          dispatch({type: 'NEXT_INNING'});
      }
  };

  
  const prevStrikeoutTriggerRef = useRef(state.strikeoutAnimationTrigger || 0);

  useEffect(() => {
    const currentTrigger = state.strikeoutAnimationTrigger || 0;
    if (currentTrigger > prevStrikeoutTriggerRef.current) {
      setShowKAnimation(true);
      const timer = setTimeout(() => setShowKAnimation(false), 2000);
      prevStrikeoutTriggerRef.current = currentTrigger;
      return () => clearTimeout(timer);
    }
    prevStrikeoutTriggerRef.current = currentTrigger;
  }, [state.strikeoutAnimationTrigger]);
  
  const [awaySettledKey, setAwaySettledKey] = useState('');
  const [homeSettledKey, setHomeSettledKey] = useState('');
  
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignoreTimerClickRef = useRef(false);

  // Score Interaction Refs
  const scoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignoreScoreClickRef = useRef(false);

  // Audio Effects for Timer
  useEffect(() => {
    if (!state.isTimerRunning) return;
    
    if (state.timer === 8) {
        playBeep(800, 0.2, 'sine'); // Warning beep
    } else if (state.timer === 0) {
        playBeep(300, 0.8, 'square'); // Time up buzzer
    }
  }, [state.timer, state.isTimerRunning]);

  // Timer Click Logic
  const handleTimerMouseDown = () => {
    ignoreTimerClickRef.current = false;
    timerRef.current = setTimeout(() => {
      dispatch({ type: 'SET_TIMER', value: 20 }); 
      if (state.isTimerRunning) dispatch({ type: 'TOGGLE_TIMER' }); 
      ignoreTimerClickRef.current = true;
    }, 800);
  };

  const handleTimerMouseUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleTimerClick = () => {
    if (!ignoreTimerClickRef.current) {
        dispatch({ type: 'TOGGLE_TIMER' });
    }
    ignoreTimerClickRef.current = false;
  };

  // Score Logic
  const handleScoreMouseDown = (team: 'home' | 'away') => {
    ignoreScoreClickRef.current = false;
    scoreTimerRef.current = setTimeout(() => {
        dispatch({ type: 'ADD_SCORE', team, amount: 1 });
        if (team === 'home') setShowScoreControlsHome(false);
        else setShowScoreControlsAway(false);
        ignoreScoreClickRef.current = true;
    }, 500); 
  };

  const handleScoreMouseUp = () => {
      if (scoreTimerRef.current) {
          clearTimeout(scoreTimerRef.current);
          scoreTimerRef.current = null;
      }
  };

  const handleScoreClick = (e: React.MouseEvent, team: 'home' | 'away') => {
      e.stopPropagation();
      if (ignoreScoreClickRef.current) {
          ignoreScoreClickRef.current = false;
          return;
      }
      if (team === 'home') {
          setShowScoreControlsHome(!showScoreControlsHome);
          setShowScoreControlsAway(false);
          setShowInningControls(false);
      } else {
          setShowScoreControlsAway(!showScoreControlsAway);
          setShowScoreControlsHome(false);
          setShowInningControls(false);
      }
  };
  
  const handleScoreMouseLeave = () => {
      handleScoreMouseUp();
      setTimeout(() => {
          setShowScoreControlsHome(false);
          setShowScoreControlsAway(false);
      }, 3000);
  };

  // Global click listener to close popovers
  useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
          // If clicking inside a popover or its trigger, don't close it here.
          // The click handlers on the triggers will handle toggling.
          // But to keep it simple, we can just let the triggers stopPropagation.
          setShowInningControls(false);
          setShowScoreControlsHome(false);
          setShowScoreControlsAway(false);
      };
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleBallClick = () => dispatch({ type: 'INCREMENT_BALL' });
  const handleStrikeClick = () => dispatch({ type: 'INCREMENT_STRIKE' });
  const handleOutClick = () => dispatch({ type: 'INCREMENT_OUT' });
  const handleBatterClick = () => dispatch({ type: 'NEXT_BATTER' });
  const handlePitcherStatClick = () => dispatch({ type: 'INCREMENT_PLAYER_STAT', role: 'pitcher' });

  const activeBaseColor = state.isTop 
    ? (state.awayTeam.baseColor || state.awayTeam.color) 
    : (state.homeTeam.baseColor || state.homeTeam.color);

  const awayRole = state.isTop ? 'AT BAT' : 'PITCHING';
  const homeRole = state.isTop ? 'PITCHING' : 'AT BAT';
  const isAwayVisible = awayRole === 'AT BAT' ? state.showBatterInfo : state.showPitcherInfo;
  const isHomeVisible = homeRole === 'AT BAT' ? state.showBatterInfo : state.showPitcherInfo;

  useEffect(() => {
    if (!isAwayVisible) setAwaySettledKey('');
  }, [isAwayVisible]);

  useEffect(() => {
    if (!isHomeVisible) setHomeSettledKey('');
  }, [isHomeVisible]);

  // --- RENDER FUNCTIONS (Avoid Components to fix remount issues) ---

  const renderDefaultView = () => {
      const awayPlayer = state.isTop ? state.awayTeam.lineup[state.awayTeam.currentBatterIndex] || { name: 'Batter', number: '', stat: '0-0' } : state.awayTeam.pitcher;
      const homePlayer = state.isTop ? state.homeTeam.pitcher : state.homeTeam.lineup[state.homeTeam.currentBatterIndex] || { name: 'Batter', number: '', stat: '0-0' };

      const currentAwayKey = `${awayPlayer.name}-${awayPlayer.number}`;
      const currentHomeKey = `${homePlayer.name}-${homePlayer.number}`;

      const isAwayNameSettled = isAwayVisible && awaySettledKey === currentAwayKey;
      const isHomeNameSettled = isHomeVisible && homeSettledKey === currentHomeKey;

      return (
        <div className={`bg-slate-900 border-2 border-slate-700 rounded-xl overflow-hidden shadow-2xl relative font-display text-white w-full mx-auto flex flex-col h-full max-h-none`}>
        
        {/* Top Section */}
        <div className={`flex flex-col sm:flex-row flex-1 min-h-0`}>
          
          {/* LEFT: Away Team */}
          <div className="flex-1 sm:flex-none w-full sm:w-[35%] shrink-0 border-b-2 sm:border-b-0 sm:border-r-2 border-slate-700 relative group overflow-hidden order-1">
             <div className="absolute inset-0 opacity-20 transition-colors duration-500" style={{ backgroundColor: state.awayTeam.color }}></div>
            
            <div className="flex h-full relative z-10 p-2 sm:p-4 lg:p-5 flex-col justify-between">
                <div className="flex justify-start items-stretch gap-2 sm:gap-3">
                  <div className="shrink-0 relative flex items-center justify-center">
                     <TeamLogo team={state.awayTeam} isActive={state.isTop} />
                  </div>
                  
                  <div className="flex flex-col items-start justify-center h-10 sm:h-16 lg:h-20 min-w-0 flex-1 py-1">
                     <AutoScalingText text={state.awayTeam.name} className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white tracking-tight drop-shadow-sm leading-tight" align="left" />
                  </div>
                </div>
                
                {/* Score Area */}
                <div 
                   className="flex-1 flex items-center justify-center relative group/score px-2 sm:px-8"
                   onMouseDown={() => handleScoreMouseDown('away')}
                   onMouseUp={handleScoreMouseUp}
                   onMouseLeave={handleScoreMouseLeave}
                   onTouchStart={() => handleScoreMouseDown('away')}
                   onTouchEnd={handleScoreMouseUp}
                   onClick={(e) => handleScoreClick(e, 'away')}
                >
                   <AnimatedScore score={state.awayTeam.score} color={state.awayTeam.color} />
                   
                   {/* Popover Controls for Score */}
                   {showScoreControlsAway && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-2 bg-slate-900/95 p-2 rounded border-2 border-slate-500 shadow-2xl z-50 animate-in fade-in zoom-in duration-200">
                          <button className="p-3 bg-white/10 hover:bg-white/20 rounded text-green-400" onClick={(e) => { e.stopPropagation(); dispatch({type: 'ADD_SCORE', team: 'away', amount: 1})}}><Plus size={24}/></button>
                          <button className="p-3 bg-white/10 hover:bg-white/20 rounded text-red-400" onClick={(e) => { e.stopPropagation(); dispatch({type: 'ADD_SCORE', team: 'away', amount: -1})}}><Minus size={24}/></button>
                      </div>
                   )}
                </div>
                
                <div 
                    className="mt-auto text-sm text-slate-300 border-t border-white/20 pt-2 sm:pt-3 flex justify-between items-end cursor-pointer hover:bg-white/5 rounded px-2 transition-colors overflow-hidden min-h-[60px] sm:min-h-[72px]"
                    onClick={awayRole === 'AT BAT' ? handleBatterClick : handlePitcherStatClick}
                >
                   <div className="flex flex-col overflow-hidden h-full justify-between">
                      <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${awayRole === 'AT BAT' ? 'text-green-400' : 'text-red-400'}`}>{awayRole}</span>
                      <AnimatePresence mode="wait">
                        {isAwayVisible && (
                          <motion.div 
                            key={`${awayPlayer.name}-${awayPlayer.number}`}
                            initial={{ x: -100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -100, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            onAnimationComplete={() => { if (isAwayVisible) setAwaySettledKey(currentAwayKey); }}
                            className="flex flex-col overflow-hidden flex-1 justify-end"
                          >
                             <AutoScalingText text={`${state.isTop ? state.awayTeam.currentBatterIndex + 1 + '. ' : ''}${awayPlayer.name} #${awayPlayer.number}`} className="text-2xl sm:text-3xl lg:text-4xl text-white font-semibold font-display leading-none" align="left" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                   </div>
                   {isAwayVisible && isAwayNameSettled && (awayRole === 'AT BAT' ? state.showPlayerStat : state.showCount) && (
                     <span className="text-2xl sm:text-3xl lg:text-4xl font-display text-yellow-500 leading-none">
                       {awayPlayer.stat}
                     </span>
                   )}
                </div>
            </div>
          </div>

          {/* CENTER: Info */}
          <div className="flex-1 sm:flex-none w-full sm:w-[30%] shrink-0 bg-slate-800 flex flex-col relative border-x-0 sm:border-x-2 border-slate-900 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] order-2">
            
            {/* Top: Inning & Timer */}
            <div className="h-14 sm:h-20 lg:h-24 border-b border-slate-600 flex items-center justify-between px-3 bg-slate-800/80 shrink-0">
               <div 
                  className="relative flex items-center space-x-3 cursor-pointer hover:bg-slate-700/50 px-2 py-1 rounded transition-colors group" 
                  onMouseDown={handleInningMouseDown}
                  onMouseUp={handleInningMouseUp}
                  onMouseLeave={handleInningMouseUp}
                  onTouchStart={handleInningMouseDown}
                  onTouchEnd={handleInningMouseUp}
                  onClick={handleInningClick}
               >
                 <div className="flex flex-col gap-1.5">
                    <div className={`w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent ${state.isTop ? 'border-b-[12px] border-b-yellow-400' : 'border-b-[12px] border-b-slate-700'}`}></div>
                    <div className={`w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent ${!state.isTop ? 'border-t-[12px] border-t-yellow-400' : 'border-t-[12px] border-t-slate-700'}`}></div>
                 </div>
                 <span className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-none select-none text-slate-200">
                   {state.inning}
                 </span>

                 {showInningControls && (
                    <div className="absolute top-1/2 left-full ml-2 transform -translate-y-1/2 flex flex-col gap-1 bg-slate-900 p-1 rounded border-2 border-slate-600 shadow-xl z-50">
                        <button className="p-1 hover:bg-white/20 rounded" onClick={(e) => { e.stopPropagation(); dispatch({type: 'NEXT_INNING'}) }}><Plus size={16}/></button>
                        <button className="p-1 hover:bg-white/20 rounded" onClick={(e) => { e.stopPropagation(); dispatch({type: 'PREVIOUS_HALF_INNING'}) }}><Minus size={16}/></button>
                    </div>
                 )}
                 {showUmpireControls && (
                    <div className="absolute top-full left-0 mt-2 grid grid-cols-2 gap-2 bg-slate-900 p-3 rounded-lg border-2 border-slate-600 shadow-2xl z-50 w-64 animate-in zoom-in-95 duration-200">
                        <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-2 rounded shadow text-sm" onClick={(e) => { e.stopPropagation(); dispatch({type: 'BATTER_OUT'}); setShowUmpireControls(false); }}>OUT</button>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded shadow text-sm" onClick={(e) => { e.stopPropagation(); dispatch({type: 'SINGLE'}); setShowUmpireControls(false); }}>1B</button>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded shadow text-sm" onClick={(e) => { e.stopPropagation(); dispatch({type: 'DOUBLE'}); setShowUmpireControls(false); }}>2B</button>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded shadow text-sm" onClick={(e) => { e.stopPropagation(); dispatch({type: 'TRIPLE'}); setShowUmpireControls(false); }}>3B</button>
                        <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-2 rounded shadow text-sm" onClick={(e) => { e.stopPropagation(); dispatch({type: 'WALK'}); setShowUmpireControls(false); }}>BB</button>
                        <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-2 rounded shadow text-sm" onClick={(e) => { e.stopPropagation(); dispatch({type: 'HOME_RUN'}); setShowUmpireControls(false); }}>HR</button>
                        <button className="col-span-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-2 rounded shadow text-sm flex justify-center items-center gap-1 mt-1" onClick={(e) => { e.stopPropagation(); dispatch({type: 'UNDO'}); setShowUmpireControls(false); }}><RotateCcw size={14}/> Undo</button>
                    </div>
                 )}
               </div>
               
               {/* Timer */}
               {state.showTimer && (<div 
                  className={`flex items-center space-x-1 px-2 py-1 rounded border-2 cursor-pointer select-none active:scale-95 transition-all ${state.timer <= 8 && state.isTimerRunning ? 'bg-red-900/80 border-red-500 animate-pulse' : 'bg-black/40 border-slate-600/50'}`}
                  onMouseDown={handleTimerMouseDown}
                  onMouseUp={handleTimerMouseUp}
                  onMouseLeave={handleTimerMouseUp}
                  onTouchStart={handleTimerMouseDown}
                  onTouchEnd={handleTimerMouseUp}
                  onClick={handleTimerClick}
               >
                    <Timer size={20} className={state.isTimerRunning ? "text-green-400 animate-spin" : "text-slate-400"} />
                    <span className={`text-3xl sm:text-4xl lg:text-5xl font-display font-bold w-[40px] sm:w-[50px] lg:w-[70px] text-center ${state.timer <= 8 ? 'text-white' : 'text-yellow-400'}`}>
                      {state.timer}
                    </span>
               </div>)}
            </div>

            {/* Middle: Bases & Counts */}
            <div className="flex-1 flex flex-row sm:flex-col items-center justify-evenly w-full relative min-h-0">
                <AnimatePresence>
                  {showKAnimation && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none backdrop-blur-sm bg-black/20"
                    >
                      <div className="relative flex items-center justify-center">
                        <span 
                          className="text-[140px] sm:text-[200px] lg:text-[240px] font-black font-rammetto leading-none" 
                          style={{ 
                            color: state.isTop ? state.homeTeam.color : state.awayTeam.color,
                            WebkitTextStroke: '4px white',
                            filter: `drop-shadow(0 0 40px ${state.isTop ? state.homeTeam.color : state.awayTeam.color})`
                          }}
                        >
                          K
                        </span>
                        <motion.div 
                          initial={{ opacity: 1, scale: 0.5 }}
                          animate={{ opacity: 0, scale: 1.5 }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className="absolute w-[150px] h-[150px] sm:w-[200px] sm:h-[200px] lg:w-[250px] lg:h-[250px] border-[8px] rounded-full" 
                          style={{ borderColor: state.isTop ? state.homeTeam.color : state.awayTeam.color }}
                        />
                        <motion.div 
                          initial={{ opacity: 1, scale: 0.2 }}
                          animate={{ opacity: 0, scale: 2 }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                          className="absolute w-[150px] h-[150px] sm:w-[200px] sm:h-[200px] lg:w-[250px] lg:h-[250px] border-[4px] border-white rounded-full" 
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="w-1/2 sm:w-auto flex justify-end sm:justify-center shrink-0 transform scale-[0.85] sm:scale-80 lg:scale-100 origin-right sm:origin-center pr-4 sm:pr-0">
                   <Diamond 
                      bases={state.bases} 
                      onToggle={(idx) => dispatch({type: 'TOGGLE_BASE', baseIndex: idx})}
                      className="" 
                      activeColor={activeBaseColor}
                   />
                </div>

                <div className="w-1/2 sm:w-full flex justify-start sm:justify-center shrink-0 pl-4 sm:pl-0">
                    <div className="flex flex-col space-y-2 items-start pl-0 lg:pl-8 sm:-ml-3 lg:ml-0">
                        {/* Balls */}
                        <div className="flex items-center gap-3 sm:gap-4 cursor-pointer group" onClick={handleBallClick}>
                            <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-500 group-hover:text-white transition-colors w-8 sm:w-10 text-center">B</span>
                            <div className="flex space-x-2 sm:space-x-3">
                                {[0, 1, 2].map(i => (
                                    <AnimatedIndicator 
                                        key={i}
                                        active={i < state.balls} 
                                        colorClass="bg-led-green" 
                                        shadowClass="shadow-[0_0_20px_#00ff41]" 
                                        baseClass="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full border-2"
                                    />
                                ))}
                            </div>
                        </div>
                        {/* Strikes */}
                        <div className="flex items-center gap-3 sm:gap-4 cursor-pointer group" onClick={handleStrikeClick}>
                            <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-500 group-hover:text-white transition-colors w-8 sm:w-10 text-center">S</span>
                            <div className="flex space-x-2 sm:space-x-3">
                                {[0, 1].map(i => (
                                    <AnimatedIndicator 
                                        key={i}
                                        active={i < state.strikes} 
                                        colorClass="bg-led-yellow" 
                                        shadowClass="shadow-[0_0_20px_#ffcc00]" 
                                        baseClass="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full border-2"
                                    />
                                ))}
                            </div>
                        </div>
                        {/* Outs */}
                        <div className="flex items-center gap-3 sm:gap-4 cursor-pointer group" onClick={handleOutClick}>
                            <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-500 group-hover:text-white transition-colors w-8 sm:w-10 text-center">O</span>
                            <div className="flex space-x-2 sm:space-x-3">
                                {[0, 1].map(i => (
                                    <AnimatedIndicator 
                                        key={i}
                                        active={i < state.outs} 
                                        colorClass="bg-led-red" 
                                        shadowClass="shadow-[0_0_20px_#ff3b30]" 
                                        baseClass="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full border-2"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </div>

          {/* RIGHT: Home Team */}
          <div className={`flex-1 sm:flex-none w-full sm:w-[35%] shrink-0 border-t-2 sm:border-t-0 sm:border-l-2 border-slate-700 relative group overflow-hidden order-3`}>
             <div className="absolute inset-0 opacity-20 transition-colors duration-500" style={{ backgroundColor: state.homeTeam.color }}></div>

             <div className="flex h-full p-2 sm:p-4 lg:p-5 flex-col justify-between text-right relative z-10">
                <div className="flex justify-end items-stretch gap-2 sm:gap-3">
                   <div className="flex flex-col items-end justify-center h-10 sm:h-16 lg:h-20 min-w-0 flex-1 py-1">
                      <AutoScalingText text={state.homeTeam.name} className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white tracking-tight drop-shadow-sm leading-tight" align="right" />
                   </div>
                   
                   <div className="shrink-0 relative flex items-center justify-center">
                      <TeamLogo team={state.homeTeam} isActive={!state.isTop} />
                   </div>
                </div>
                
                {/* Score Area */}
                <div 
                   className="flex-1 flex items-center justify-center relative group/score px-2 sm:px-8"
                   onMouseDown={() => handleScoreMouseDown('home')}
                   onMouseUp={handleScoreMouseUp}
                   onMouseLeave={handleScoreMouseLeave}
                   onTouchStart={() => handleScoreMouseDown('home')}
                   onTouchEnd={handleScoreMouseUp}
                   onClick={(e) => handleScoreClick(e, 'home')}
                >
                   <AnimatedScore score={state.homeTeam.score} color={state.homeTeam.color} />
                   
                   {showScoreControlsHome && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col gap-2 bg-slate-900/95 p-2 rounded border-2 border-slate-500 shadow-2xl z-50 animate-in fade-in zoom-in duration-200">
                          <button className="p-3 bg-white/10 hover:bg-white/20 rounded text-green-400" onClick={(e) => { e.stopPropagation(); dispatch({type: 'ADD_SCORE', team: 'home', amount: 1})}}><Plus size={24}/></button>
                          <button className="p-3 bg-white/10 hover:bg-white/20 rounded text-red-400" onClick={(e) => { e.stopPropagation(); dispatch({type: 'ADD_SCORE', team: 'home', amount: -1})}}><Minus size={24}/></button>
                      </div>
                   )}
                </div>
                
                 <div 
                    className="mt-auto text-sm text-slate-300 border-t border-white/20 pt-2 sm:pt-3 flex justify-between items-end flex-row-reverse cursor-pointer hover:bg-white/5 rounded px-2 transition-colors overflow-hidden min-h-[60px] sm:min-h-[72px]"
                    onClick={homeRole === 'AT BAT' ? handleBatterClick : handlePitcherStatClick}
                 >
                   <div className="flex flex-col items-end overflow-hidden h-full justify-between">
                      <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${homeRole === 'AT BAT' ? 'text-green-400' : 'text-red-400'}`}>{homeRole}</span>
                      <AnimatePresence mode="wait">
                        {isHomeVisible && (
                          <motion.div 
                            key={`${homePlayer.name}-${homePlayer.number}`}
                            initial={{ x: -100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -100, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            onAnimationComplete={() => { if (isHomeVisible) setHomeSettledKey(currentHomeKey); }}
                            className="flex flex-col items-end overflow-hidden flex-1 justify-end"
                          >
                             <AutoScalingText text={`${!state.isTop ? state.homeTeam.currentBatterIndex + 1 + '. ' : ''}${homePlayer.name} #${homePlayer.number}`} className="text-2xl sm:text-3xl lg:text-4xl text-white font-semibold font-display leading-none" align="right" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                   </div>
                   {isHomeVisible && isHomeNameSettled && (homeRole === 'AT BAT' ? state.showPlayerStat : state.showCount) && (
                     <span className="text-2xl sm:text-3xl lg:text-4xl font-display text-yellow-500 leading-none">
                       {homePlayer.stat}
                     </span>
                   )}
                </div>
            </div>
          </div>

        </div>

      </div>
      )
  };

  const renderLineupView = () => {
    // 3-Column Layout: Lineup | Center | Lineup

    return (
        <div className="w-full h-full bg-slate-900 border-2 border-slate-700 rounded-xl overflow-hidden shadow-2xl flex flex-col sm:flex-row font-display text-white">
            
            {/* Left: Away Lineup */}
            <div className={`flex-1 sm:flex-none w-full sm:w-[35%] shrink-0 sm:h-full min-w-0 border-b-2 sm:border-b-0 sm:border-r-2 border-slate-700 order-2 sm:order-1`}>
                <LineupColumn team={state.awayTeam} isAway={true} state={state} dispatch={dispatch} />
            </div>

            {/* Center: Simplified Scoreboard */}
            <div className="flex-1 sm:flex-none w-full sm:w-[30%] shrink-0 sm:h-full flex flex-col bg-slate-800 min-w-0 border-x-0 sm:border-x-2 border-slate-900 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] order-1 sm:order-2">
                {/* Score Strip */}
                <div className="h-20 bg-slate-950 flex border-b-2 border-slate-600 shrink-0">
                    {/* Away Score */}
                    <div 
                        className="flex-1 flex items-center justify-center text-5xl lg:text-7xl font-bold relative overflow-hidden cursor-pointer hover:bg-white/5 transition-colors" 
                        style={{ color: state.awayTeam.color }}
                        onMouseDown={() => handleScoreMouseDown('away')}
                        onMouseUp={handleScoreMouseUp}
                        onMouseLeave={handleScoreMouseLeave}
                        onTouchStart={() => handleScoreMouseDown('away')}
                        onTouchEnd={handleScoreMouseUp}
                        onClick={(e) => handleScoreClick(e, 'away')}
                    >
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-20"></div>
                         <div className="z-10"><AnimatedScore score={state.awayTeam.score} color={state.awayTeam.color} sizeClass="text-3xl lg:text-4xl" /></div>
                         
                         {/* Popover Controls for Score */}
                         {showScoreControlsAway && (
                            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 flex gap-2 bg-slate-900/95 p-2 rounded border-2 border-slate-500 shadow-2xl z-50 animate-in fade-in zoom-in duration-200">
                                <button className="p-2 bg-white/10 hover:bg-white/20 rounded text-green-400" onClick={(e) => { e.stopPropagation(); dispatch({type: 'ADD_SCORE', team: 'away', amount: 1})}}><Plus size={20}/></button>
                                <button className="p-2 bg-white/10 hover:bg-white/20 rounded text-red-400" onClick={(e) => { e.stopPropagation(); dispatch({type: 'ADD_SCORE', team: 'away', amount: -1})}}><Minus size={20}/></button>
                            </div>
                         )}
                    </div>
                    {/* Inning */}
                    <div 
                        className="w-24 bg-slate-900 flex flex-col items-center justify-center border-x-2 border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors relative"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowInningControls(true);
                            setShowScoreControlsHome(false);
                            setShowScoreControlsAway(false);
                            dispatch({type: 'NEXT_INNING'});
                        }}
                    >
                        <div className="flex flex-col gap-1 mb-1">
                            <div className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent ${state.isTop ? 'border-b-[8px] border-b-yellow-400' : 'border-b-[8px] border-b-slate-700'}`}></div>
                            <div className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent ${!state.isTop ? 'border-t-[8px] border-t-yellow-400' : 'border-t-[8px] border-t-slate-700'}`}></div>
                         </div>
                        <span className="text-3xl font-bold text-slate-200">{state.inning}</span>
                        
                        {/* Popover Controls for Inning */}
                        {showInningControls && (
                            <div className="absolute top-full mt-2 flex gap-2 bg-slate-900/95 p-2 rounded border-2 border-slate-500 shadow-2xl z-50 animate-in fade-in zoom-in duration-200">
                                <button className="p-2 bg-white/10 hover:bg-white/20 rounded text-green-400" onClick={(e) => { e.stopPropagation(); dispatch({type: 'NEXT_INNING'}) }}><Plus size={20}/></button>
                                <button className="p-2 bg-white/10 hover:bg-white/20 rounded text-red-400" onClick={(e) => { e.stopPropagation(); dispatch({type: 'PREVIOUS_HALF_INNING'}) }}><Minus size={20}/></button>
                            </div>
                        )}
                    </div>
                    {/* Home Score */}
                    <div 
                        className="flex-1 flex items-center justify-center text-5xl lg:text-7xl font-bold relative overflow-hidden cursor-pointer hover:bg-white/5 transition-colors" 
                        style={{ color: state.homeTeam.color }}
                        onMouseDown={() => handleScoreMouseDown('home')}
                        onMouseUp={handleScoreMouseUp}
                        onMouseLeave={handleScoreMouseLeave}
                        onTouchStart={() => handleScoreMouseDown('home')}
                        onTouchEnd={handleScoreMouseUp}
                        onClick={(e) => handleScoreClick(e, 'home')}
                    >
                        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-white/5 to-transparent opacity-20"></div>
                        <div className="z-10"><AnimatedScore score={state.homeTeam.score} color={state.homeTeam.color} sizeClass="text-3xl lg:text-4xl" /></div>

                        {/* Popover Controls for Score */}
                         {showScoreControlsHome && (
                            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 flex gap-2 bg-slate-900/95 p-2 rounded border-2 border-slate-500 shadow-2xl z-50 animate-in fade-in zoom-in duration-200">
                                <button className="p-2 bg-white/10 hover:bg-white/20 rounded text-green-400" onClick={(e) => { e.stopPropagation(); dispatch({type: 'ADD_SCORE', team: 'home', amount: 1})}}><Plus size={20}/></button>
                                <button className="p-2 bg-white/10 hover:bg-white/20 rounded text-red-400" onClick={(e) => { e.stopPropagation(); dispatch({type: 'ADD_SCORE', team: 'home', amount: -1})}}><Minus size={20}/></button>
                            </div>
                         )}
                    </div>
                </div>

                {/* Top: Timer (Moved from Inning & Timer since Inning is in Score Strip) */}
                <div className="h-16 lg:h-24 border-b-2 border-slate-600 flex items-center justify-center px-3 bg-slate-800/80 shrink-0">
                   {/* Timer */}
                   {state.showTimer && (<div 
                      className={`flex items-center space-x-1 px-4 py-2 rounded border-2 cursor-pointer select-none active:scale-95 transition-all ${state.timer <= 8 && state.isTimerRunning ? 'bg-red-900/80 border-red-500 animate-pulse' : 'bg-black/40 border-slate-600/50'}`}
                      onMouseDown={handleTimerMouseDown}
                      onMouseUp={handleTimerMouseUp}
                      onMouseLeave={handleTimerMouseUp}
                      onTouchStart={handleTimerMouseDown}
                      onTouchEnd={handleTimerMouseUp}
                      onClick={handleTimerClick}
                   >
                        <Timer size={24} className={state.isTimerRunning ? "text-green-400 animate-spin" : "text-slate-400"} />
                        <span className={`text-5xl lg:text-6xl font-display font-bold w-[60px] lg:w-[80px] text-center ${state.timer <= 8 ? 'text-white' : 'text-yellow-400'}`}>
                          {state.timer}
                        </span>
                   </div>)}
                </div>

                {/* Middle: Bases & Counts */}
                <div className="flex-1 flex flex-row sm:flex-col items-center justify-evenly w-full relative min-h-0">
                    <div className="w-1/2 sm:w-auto flex justify-end sm:justify-center shrink-0 transform scale-[0.85] sm:scale-80 lg:scale-100 origin-right sm:origin-center pr-4 sm:pr-0">
                       <Diamond 
                          bases={state.bases} 
                          onToggle={(idx) => dispatch({type: 'TOGGLE_BASE', baseIndex: idx})}
                          className="" 
                          activeColor={activeBaseColor}
                       />
                    </div>

                    <div className="w-1/2 sm:w-full flex justify-start sm:justify-center shrink-0 pl-4 sm:pl-0">
                        <div className="flex flex-col space-y-2 items-start pl-0 lg:pl-8 sm:-ml-3 lg:ml-0">
                            {/* Balls */}
                            <div className="flex items-center gap-3 sm:gap-4 cursor-pointer group" onClick={handleBallClick}>
                                <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-500 group-hover:text-white transition-colors w-8 sm:w-10 text-center">B</span>
                                <div className="flex space-x-2 sm:space-x-3">
                                    {[0, 1, 2].map(i => (
                                        <AnimatedIndicator 
                                            key={i}
                                            active={i < state.balls} 
                                            colorClass="bg-led-green" 
                                            shadowClass="shadow-[0_0_20px_#00ff41]" 
                                            baseClass="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full border-2"
                                        />
                                    ))}
                                </div>
                            </div>
                            {/* Strikes */}
                            <div className="flex items-center gap-3 sm:gap-4 cursor-pointer group" onClick={handleStrikeClick}>
                                <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-500 group-hover:text-white transition-colors w-8 sm:w-10 text-center">S</span>
                                <div className="flex space-x-2 sm:space-x-3">
                                    {[0, 1].map(i => (
                                        <AnimatedIndicator 
                                            key={i}
                                            active={i < state.strikes} 
                                            colorClass="bg-led-yellow" 
                                            shadowClass="shadow-[0_0_20px_#ffcc00]" 
                                            baseClass="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full border-2"
                                        />
                                    ))}
                                </div>
                            </div>
                            {/* Outs */}
                            <div className="flex items-center gap-3 sm:gap-4 cursor-pointer group" onClick={handleOutClick}>
                                <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-500 group-hover:text-white transition-colors w-8 sm:w-10 text-center">O</span>
                                <div className="flex space-x-2 sm:space-x-3">
                                    {[0, 1].map(i => (
                                        <AnimatedIndicator 
                                            key={i}
                                            active={i < state.outs} 
                                            colorClass="bg-led-red" 
                                            shadowClass="shadow-[0_0_20px_#ff3b30]" 
                                            baseClass="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full border-2"
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Home Lineup */}
            <div className={`flex-1 sm:flex-none w-full sm:w-[35%] shrink-0 sm:h-full min-w-0 border-t-2 sm:border-t-0 sm:border-l-2 border-slate-700 order-3`}>
                <LineupColumn team={state.homeTeam} isAway={false} state={state} dispatch={dispatch} />
            </div>

        </div>
    )
  };

  const renderRHEView = () => {
    const maxInnings = Math.max(9, state.awayTeam.inningScores.length, state.homeTeam.inningScores.length);
    const inningsArray = Array.from({ length: maxInnings }, (_, i) => i + 1);

    const getBatter = (team: Team, offset: number) => {
      if (team.lineup.length === 0) return null;
      const index = (team.currentBatterIndex + offset) % team.lineup.length;
      return team.lineup[index];
    };

    const battingTeam = state.isTop ? state.awayTeam : state.homeTeam;
    
    const awayRuns = state.awayTeam.inningScores.reduce((sum, score) => sum + (score || 0), 0);
    const homeRuns = state.homeTeam.inningScores.reduce((sum, score) => sum + (score || 0), 0);

    const renderTeamRow = (team: Team, runs: number, isBottomBorder: boolean) => (
      <tr key={team.name} className={isBottomBorder ? "border-b border-slate-800/50" : ""}>
        <td className="text-left py-6 pl-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center shrink-0" style={{ backgroundColor: team.color }}>
            {team.logoUrl ? (
              <img src={team.logoUrl} alt={`${team.name} Logo`} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl text-white">{team.name.substring(0, 1)}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <AutoScalingText text={team.name} className="text-3xl font-bold" align="left" />
          </div>
        </td>
        {inningsArray.map(i => {
          const score = team.inningScores[i - 1];
          return (
            <td key={i} className="py-6 text-slate-300">
              {score !== null && score !== undefined ? score : '-'}
            </td>
          );
        })}
        <td className="py-6 pl-4 text-yellow-400">{runs}</td>
        <td className="py-6 text-white">{team.hits}</td>
        <td className="py-6 text-white">{team.errors}</td>
      </tr>
    );

    return (
      <div className="w-full h-full bg-slate-900 border-2 border-slate-700 rounded-xl overflow-hidden shadow-2xl flex flex-col font-display text-white p-4 lg:p-8">
        {/* Game Info Header */}
        <div 
          className="grid items-center mb-6 px-6 py-4 bg-slate-800/50 rounded-xl border-2 border-slate-700 shadow-inner"
          style={{ gridTemplateColumns: `repeat(${state.meta.gameInfos?.length || 1}, minmax(0, 1fr))` }}
        >
          {state.meta.gameInfos?.map((info, idx) => {
            // Apply different styles based on position to mimic the original look
            let textClass = "text-xl lg:text-2xl font-bold text-slate-400 truncate";
            if (idx === 0) textClass = "text-xl lg:text-2xl text-yellow-500 uppercase tracking-widest font-black truncate";
            else if (idx === Math.floor((state.meta.gameInfos.length - 1) / 2)) textClass = "text-3xl lg:text-4xl font-black text-white tracking-tighter truncate";
            
            return (
              <div key={idx} className="flex justify-center">
                <span className={textClass}>{info}</span>
              </div>
            );
          })}
        </div>

        {/* Header: Inning */}
        <div className="flex justify-center items-center mb-8">
          <div className="text-4xl lg:text-5xl font-bold text-yellow-400">
            {state.isTop ? 'TOP' : 'BOT'} {state.inning}
          </div>
        </div>

        {/* Scoreboard Table */}
        <div className="w-full overflow-x-auto mb-12">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-700 text-slate-400 text-xl lg:text-2xl">
                <th className="text-left font-normal pb-4 pl-4 w-1/4">TEAM</th>
                {inningsArray.map(i => (
                  <th key={i} className="font-normal pb-4 w-12">{i}</th>
                ))}
                <th className="font-bold text-white pb-4 pl-4 w-16">R</th>
                <th className="font-bold text-white pb-4 w-16">H</th>
                <th className="font-bold text-white pb-4 w-16">E</th>
              </tr>
            </thead>
            <tbody className="text-3xl lg:text-4xl font-bold">
              <>
                {renderTeamRow(state.awayTeam, awayRuns, true)}
                {renderTeamRow(state.homeTeam, homeRuns, false)}
              </>
            </tbody>
          </table>
        </div>


        {/* Next 3 Batters */}
        <div className="mt-auto bg-slate-950/50 rounded-xl p-6 border-2 border-slate-800 flex items-center">
          <div className="text-2xl lg:text-3xl font-bold text-yellow-500 mr-8 shrink-0 flex items-center gap-2">
            DUE UP <span className="text-yellow-400/50">{'>>>'}</span>
          </div>
          <div className="flex-1 flex justify-around items-center">
            {[0, 1, 2].map(offset => {
              const batter = getBatter(battingTeam, offset);
              if (!batter) return null;
              return (
                <div key={offset} className="flex flex-col items-center min-w-0 flex-1">
                  <div className="text-xl lg:text-2xl text-slate-400 mb-1">#{batter.number}</div>
                  <AutoScalingText text={batter.name} className="text-2xl lg:text-3xl font-bold text-white" align="center" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderBroadcastView = () => {
    const getPlayerText = (player) => {
      const hasNumber = "number" in player && player.number;
      const numberStyle = state.meta.broadcastPlayerNumberStyle || "normal";
      if (!hasNumber || numberStyle === "hidden") return player.name;
      return `${player.name} #${player.number}`;
    };

    const getPlayerContent = (player) => {
      const hasNumber = "number" in player && player.number;
      const numberStyle = state.meta.broadcastPlayerNumberStyle || "normal";
      if (!hasNumber || numberStyle === "hidden") return player.name;
      return (
        <span>
          {player.name}
          <span className={numberStyle === "gray" ? "text-slate-400 ml-1.5" : "ml-1.5"}>
            #{player.number}
          </span>
        </span>
      );
    };
    const isAwayBatter = state.isTop;
    const awayPlayer = isAwayBatter ? (state.awayTeam.lineup[state.awayTeam.currentBatterIndex] || { name: 'UNKNOWN', number: '00' }) : (state.awayTeam.pitcher || { name: 'UNKNOWN', stat: '0' });
    const homePlayer = !state.isTop ? (state.homeTeam.lineup[state.homeTeam.currentBatterIndex] || { name: 'UNKNOWN', number: '00' }) : (state.homeTeam.pitcher || { name: 'UNKNOWN', stat: '0' });
    
    const activeBaseColor = state.isTop ? (state.awayTeam.baseColor || state.awayTeam.color) : (state.homeTeam.baseColor || state.homeTeam.color);

    const currentAwayKey = `${awayPlayer.name}-${'number' in awayPlayer ? awayPlayer.number : ''}`;
    const currentHomeKey = `${homePlayer.name}-${'number' in homePlayer ? homePlayer.number : ''}`;

    const isAwayVisible = isAwayBatter ? state.showBatterInfo : state.showPitcherInfo;
    const isHomeVisible = !isAwayBatter ? state.showBatterInfo : state.showPitcherInfo;
    const showAwayPlayer = true;
    const showHomePlayer = true;

    const pitcher = state.isTop ? (state.homeTeam.pitcher || { name: 'UNKNOWN', stat: '0' }) : (state.awayTeam.pitcher || { name: 'UNKNOWN', stat: '0' });

    const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
      if (!state.isAdjustmentMode) return;
      e.preventDefault();
      
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      
      const startX = clientX;
      const startY = clientY;
      const startMarginX = state.meta.broadcastMarginX ?? 20;
      const startMarginY = state.meta.broadcastMarginY ?? 20;

      const onMove = (moveEvent: MouseEvent | TouchEvent) => {
        const moveClientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
        const moveClientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
        
        const deltaX = moveClientX - startX;
        const deltaY = moveClientY - startY;
        
        dispatch({ type: 'UPDATE_META', field: 'broadcastMarginX', value: startMarginX + deltaX });
        dispatch({ type: 'UPDATE_META', field: 'broadcastMarginY', value: startMarginY - deltaY }); // Subtract because bottom is anchored
      };

      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('touchend', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', onUp);
    };

    const handleScale = (e: React.WheelEvent) => {
      if (!state.isAdjustmentMode) return;
      e.preventDefault();
      const currentScale = state.meta.broadcastScale ?? 1;
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      const newScale = Math.max(0.5, Math.min(2, currentScale + delta));
      dispatch({ type: 'UPDATE_META', field: 'broadcastScale', value: newScale });
    };

    const awayPlayerHeight = state.meta.broadcastPlayerRowHeight ?? 50;
    const homePlayerHeight = state.meta.broadcastPlayerRowHeight ?? 50;
    const teamRowHeight = state.meta.broadcastTeamRowHeight ?? 72;
    const pitchInfoHeight = 0;
    const showBroadcastTimer = state.showTimer && (state.meta.broadcastShowTimer ?? false);
    const showBroadcastPitchCount = state.meta.broadcastShowPitchCount ?? false;

    const effectiveA = showAwayPlayer ? awayPlayerHeight : 0;
    const effectiveH = (showHomePlayer ? homePlayerHeight + 3 : 0) + pitchInfoHeight;

    const topSpacerHeight = Math.max(0, effectiveH - effectiveA);
    const bottomSpacerHeight = Math.max(0, effectiveA - effectiveH);

    return (
      <div className="w-full h-full relative pointer-events-none animate-in slide-in-from-left duration-500 overflow-hidden">
        <div 
          className={`absolute bg-slate-900/90 backdrop-blur-md border-[4px] border-slate-700 text-white font-display shadow-2xl pointer-events-auto overflow-hidden flex flex-col origin-top-left ${state.isAdjustmentMode ? 'cursor-move ring-4 ring-blue-500 ring-offset-4 ring-offset-transparent' : ''}`} 
          style={{ 
            width: `${state.meta.broadcastWidth ?? 450}px`,
            left: `${state.meta.broadcastMarginX ?? 20}px`,
            bottom: `${state.meta.broadcastMarginY ?? 20}px`,
            transform: `scale(${state.meta.broadcastScale ?? 1})`
          }}
          onMouseDown={handleDrag}
          onTouchStart={handleDrag}
          onWheel={handleScale}
        >
          {/* Width Resizer */}
          {state.isAdjustmentMode && (
            <div 
              className="absolute right-0 top-0 bottom-0 w-4 cursor-ew-resize z-50 hover:bg-blue-500/50"
              onMouseDown={(e) => {
                e.stopPropagation();
                const startX = e.clientX;
                const startWidth = state.meta.broadcastWidth ?? 450;
                const onMove = (moveEvent: MouseEvent) => {
                  const newWidth = Math.max(300, startWidth + (moveEvent.clientX - startX) / (state.meta.broadcastScale ?? 1));
                  dispatch({ type: 'UPDATE_META', field: 'broadcastWidth', value: newWidth });
                };
                const onUp = () => {
                  window.removeEventListener('mousemove', onMove);
                  window.removeEventListener('mouseup', onUp);
                };
                window.addEventListener('mousemove', onMove);
                window.addEventListener('mouseup', onUp);
              }}
            />
          )}
          {/* Column Resizer */}
          {state.isAdjustmentMode && (
            <div 
              className="absolute top-0 bottom-0 w-4 cursor-ew-resize z-50 hover:bg-blue-500/50"
              style={{ right: `${(state.meta.broadcastRightColumnWidth ?? 150) - 8}px` }}
              onMouseDown={(e) => {
                e.stopPropagation();
                const startX = e.clientX;
                const startWidth = state.meta.broadcastRightColumnWidth ?? 150;
                const onMove = (moveEvent: MouseEvent) => {
                  const newWidth = Math.max(100, startWidth - (moveEvent.clientX - startX) / (state.meta.broadcastScale ?? 1));
                  dispatch({ type: 'UPDATE_META', field: 'broadcastRightColumnWidth', value: newWidth });
                };
                const onUp = () => {
                  window.removeEventListener('mousemove', onMove);
                  window.removeEventListener('mouseup', onUp);
                };
                window.addEventListener('mousemove', onMove);
                window.addEventListener('mouseup', onUp);
              }}
            />
          )}
          
          {/* Corner Scaler */}
          {state.isAdjustmentMode && (
            <div 
              className="absolute right-0 bottom-0 w-6 h-6 cursor-se-resize z-50 bg-blue-500/80 rounded-tl-lg flex items-center justify-center"
              onMouseDown={(e) => {
                e.stopPropagation();
                const startY = e.clientY;
                const startScale = state.meta.broadcastScale ?? 1;
                const onMove = (moveEvent: MouseEvent) => {
                  const deltaY = moveEvent.clientY - startY;
                  const newScale = Math.max(0.2, Math.min(3, startScale + deltaY * 0.005));
                  dispatch({ type: 'UPDATE_META', field: 'broadcastScale', value: newScale });
                };
                const onUp = () => {
                  window.removeEventListener('mousemove', onMove);
                  window.removeEventListener('mouseup', onUp);
                };
                window.addEventListener('mousemove', onMove);
                window.addEventListener('mouseup', onUp);
              }}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-white transform rotate-90"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
            </div>
          )}

          {/* Broadcast Home Run Animation */}
          {state.animation && (
            <div 
              className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none overflow-hidden bg-black/80 backdrop-blur-sm"
              style={{ animation: state.animation.isLocked ? 'none' : state.animation.isExiting ? 'fadeOut 0.5s ease-in-out forwards' : 'fadeOut 0.5s ease-in-out 4.5s forwards' }}
            >
              <div 
                className="relative flex flex-col items-center justify-center w-full h-full"
                style={{ animation: state.animation.isLocked ? 'none' : state.animation.isExiting ? 'outroContainer 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards' : 'outroContainer 0.5s cubic-bezier(0.4, 0, 0.2, 1) 4.5s forwards' }}
              >
                <div 
                  className="absolute rounded-full mix-blend-screen"
                  style={{
                    backgroundColor: state.animation.teamColor || '#fff',
                    animation: 'expandCircle 1s cubic-bezier(0.1, 0.8, 0.3, 1) forwards'
                  }}
                />
                <div className="relative z-10 flex flex-col items-center gap-1 w-full px-4">
                  <div className="overflow-hidden">
                    <div 
                      className="flex items-center justify-center gap-4 text-xl font-bold text-white/80 uppercase w-full px-4"
                      style={{ animation: 'slideRightOut 0.6s cubic-bezier(0.16, 1, 0.3, 1) 1.0s both' }}
                    >
                      <div className="flex-1 min-w-0">
                        <AutoScalingText text={state.animation.teamName} align="right" />
                      </div>
                      <span className="opacity-50 font-light">|</span>
                      <div className="flex-1 min-w-0">
                        <AutoScalingText text={state.animation.playerName} align="left" />
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className="flex flex-col items-center uppercase tracking-tighter text-center"
                    style={{
                      fontFamily: '"LINE Seed JP", sans-serif',
                      fontWeight: 800,
                      animation: 'popScale 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both'
                    }}
                  >
                    <div className={`text-4xl whitespace-nowrap leading-none ${
                      state.animation.type === 'homerun' ? 'text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]' :
                      state.animation.type === '2-run-homer' ? 'text-yellow-200 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]' :
                      state.animation.type === '3-run-homer' ? 'text-orange-400 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]' :
                      'text-transparent bg-clip-text bg-gradient-to-b from-red-600 via-red-500 to-yellow-400 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]'
                    }`}>
                      {state.animation.type === 'homerun' && (language === 'zh' ? '陽春砲' : language === 'ja' ? <span className="flex flex-col items-center justify-center leading-tight"><span>ソロ</span><span>ホームラン</span></span> : 'HOMERUN!')}
                      {state.animation.type === '2-run-homer' && (language === 'zh' ? '兩分砲' : language === 'ja' ? <span className="flex flex-col items-center justify-center leading-tight"><span>2ラン</span><span>ホームラン</span></span> : '2-RUN HOMER!')}
                      {state.animation.type === '3-run-homer' && (language === 'zh' ? '三分砲' : language === 'ja' ? <span className="flex flex-col items-center justify-center leading-tight"><span>3ラン</span><span>ホームラン</span></span> : '3-RUN HOMER!')}
                      {state.animation.type === 'grand-slam' && (language === 'zh' ? '滿貫砲' : language === 'ja' ? '満塁ホームラン' : 'GRAND SLAM!')}
                    </div>
                    {(language === 'zh' || language === 'ja') && (
                      <div className={`text-lg mt-1 tracking-widest opacity-90 ${
                        state.animation.type === 'homerun' ? 'text-white' :
                        state.animation.type === '2-run-homer' ? 'text-yellow-200' :
                        state.animation.type === '3-run-homer' ? 'text-orange-400' :
                        'text-transparent bg-clip-text bg-gradient-to-b from-red-600 via-red-500 to-yellow-400'
                      }`}>
                        {state.animation.type === 'homerun' && 'SOLO HOME RUN'}
                        {state.animation.type === '2-run-homer' && '2-RUN HOME RUN'}
                        {state.animation.type === '3-run-homer' && '3-RUN HOME RUN'}
                        {state.animation.type === 'grand-slam' && 'GRAND SLAM'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top Section (Left Column + Right Column) */}
          <div className={`flex w-full`}>
            
            {/* Left Column */}
            <div className={`flex flex-col justify-center flex-1 border-r-[3px] border-slate-700 min-w-0`}>
              
              {topSpacerHeight > 0 && <div style={{ height: `${topSpacerHeight}px` }} className="shrink-0" />}
              
              {/* Away Player Row (Top) */}
              {showAwayPlayer && (
                <div 
                  className="border-b-[3px] border-slate-700 px-2 flex items-center gap-2 text-xl font-bold uppercase overflow-hidden shrink-0 min-h-0 relative"
                  style={{ height: `${state.meta.broadcastPlayerRowHeight ?? 50}px` }}
                >
                  {/* Top Resizer */}
                  {state.isAdjustmentMode && (
                    <div 
                      className="absolute left-0 right-0 top-[-8px] h-4 cursor-ns-resize z-50 hover:bg-blue-500/50"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const startY = e.clientY;
                        const startHeight = state.meta.broadcastPlayerRowHeight ?? 50;
                        const startMarginY = state.meta.broadcastMarginY ?? 20;
                        const scale = state.meta.broadcastScale ?? 1;
                        const onMove = (moveEvent: MouseEvent) => {
                          const deltaY = moveEvent.clientY - startY;
                          const deltaH = -deltaY / scale;
                          const newHeight = Math.max(30, startHeight + deltaH);
                          const actualDeltaH = newHeight - startHeight;
                          dispatch({ type: 'UPDATE_META', field: 'broadcastPlayerRowHeight', value: newHeight });
                          dispatch({ type: 'UPDATE_META', field: 'broadcastMarginY', value: startMarginY - actualDeltaH * scale });
                        };
                        const onUp = () => {
                          window.removeEventListener('mousemove', onMove);
                          window.removeEventListener('mouseup', onUp);
                        };
                        window.addEventListener('mousemove', onMove);
                        window.addEventListener('mouseup', onUp);
                      }}
                    />
                  )}
                  {isAwayBatter ? (
                    <span className="shrink-0 text-slate-400 font-bold inline-block text-center w-[1.125rem]">{state.awayTeam.currentBatterIndex + 1}.</span>
                  ) : (
                    <span className="shrink-0 text-slate-400 font-bold inline-block text-center w-[1.125rem]">P</span>
                  )}
                  <AnimatePresence mode="wait">
                    {isAwayVisible && (
                    <motion.div
                      key={currentAwayKey}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3 }}
                      className="flex-1 min-w-0 flex items-center h-full justify-between gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <AutoScalingText 
                          text={getPlayerText(awayPlayer)} 
                          content={getPlayerContent(awayPlayer)} 
                          className="leading-tight py-0.5" 
                          style={{ fontSize: `${state.meta.broadcastPlayerNameSize ?? 20}px` }} 
                          align="left" 
                        />
                      </div>
                      {isAwayBatter && state.showTimer && (showBroadcastTimer || state.isAdjustmentMode) && (
                        <div 
                          className={`font-display shrink-0 ${state.isAdjustmentMode ? 'cursor-pointer' : ''} ${state.timer <= 8 && state.isTimerRunning && showBroadcastTimer ? 'text-red-500 animate-pulse' : 'text-yellow-400'} ${!showBroadcastTimer ? 'opacity-30' : ''}`}
                          style={{ fontSize: `${state.meta.broadcastTimerSize ?? 24}px` }}
                          onClick={(e) => {
                            if (state.isAdjustmentMode) {
                              e.stopPropagation();
                              dispatch({ type: 'UPDATE_META', field: 'broadcastShowTimer', value: !showBroadcastTimer });
                            }
                          }}
                          title={state.isAdjustmentMode ? "Toggle timer in broadcast mode" : undefined}
                        >
                          {state.timer}
                        </div>
                      )}
                      {!isAwayBatter && (showBroadcastPitchCount || state.isAdjustmentMode) && (
                        <div 
                          className={`font-display text-lg shrink-0 ${state.isAdjustmentMode ? 'cursor-pointer' : ''} text-slate-300 font-bold ${!showBroadcastPitchCount ? 'opacity-30' : ''}`}
                          onClick={(e) => {
                            if (state.isAdjustmentMode) {
                              e.stopPropagation();
                              dispatch({ type: 'UPDATE_META', field: 'broadcastShowPitchCount', value: !showBroadcastPitchCount });
                            }
                          }}
                          title={state.isAdjustmentMode ? "Toggle pitch count in broadcast mode" : undefined}
                        >
                          P:{'stat' in awayPlayer ? awayPlayer.stat.replace('P: ', '') : '0'}
                        </div>
                      )}
                    </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Teams & Inning Row */}
              <div className={`flex ${showHomePlayer ? 'border-b-[3px]' : ''} border-slate-700 shrink-0`}>
                {/* Teams */}
                <div className={`flex flex-col flex-1 border-slate-700 min-w-0 border-r-[3px]`}>
                  {/* Away */}
                  <div 
                    className="flex relative overflow-hidden shrink-0 min-h-0"
                    style={{ height: `${state.meta.broadcastTeamRowHeight ?? 72}px` }}
                  >
                    <div className="absolute inset-0 opacity-20" style={{ backgroundColor: state.awayTeam.color }}></div>
                    <div className="flex-1 px-2 flex items-center gap-3 min-w-0 relative z-10 h-full">
                      <div 
                        className="rounded-full border-[3px] border-slate-700 overflow-hidden flex items-center justify-center bg-slate-800 shrink-0 transition-all"
                        style={{ width: `${state.meta.broadcastLogoSize ?? 40}px`, height: `${state.meta.broadcastLogoSize ?? 40}px` }}
                      >
                        {state.awayTeam.logoUrl ? (
                          <img src={state.awayTeam.logoUrl} alt="Away Logo" className="w-full h-full object-cover" />
                        ) : (
                          <div 
                            className="w-full h-full rounded-full flex items-center justify-center font-bold text-white uppercase" 
                            style={{ backgroundColor: state.awayTeam.color, fontSize: `${(state.meta.broadcastLogoSize ?? 40) * 0.5}px` }}
                          >
                            {state.awayTeam.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <AutoScalingText text={state.awayTeam.name} className="font-bold tracking-wider uppercase leading-tight py-0.5" style={{ fontSize: `${state.meta.broadcastTeamNameSize ?? 24}px` }} align="left" />
                      </div>
                    </div>
                    <div 
                      className={`border-slate-700 px-2 flex items-center justify-center text-3xl font-black font-display text-yellow-400 shrink-0 relative z-10 cursor-pointer hover:bg-white/10 transition-colors border-l-[3px] h-full`}
                      style={{ width: `${state.meta.broadcastScoreWidth ?? 72}px` }}
                      onMouseDown={() => handleScoreMouseDown('away')}
                      onMouseUp={handleScoreMouseUp}
                      onMouseLeave={handleScoreMouseLeave}
                      onTouchStart={() => handleScoreMouseDown('away')}
                      onTouchEnd={handleScoreMouseUp}
                      onClick={(e) => handleScoreClick(e, 'away')}
                    >
                      {/* Score Width Resizer */}
                      {state.isAdjustmentMode && (
                        <div 
                          className="absolute left-[-8px] top-0 bottom-0 w-4 cursor-ew-resize z-50 hover:bg-blue-500/50"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            const startX = e.clientX;
                            const startWidth = state.meta.broadcastScoreWidth ?? 72;
                            const scale = state.meta.broadcastScale ?? 1;
                            const onMove = (moveEvent: MouseEvent) => {
                              const deltaX = moveEvent.clientX - startX;
                              const deltaW = -deltaX / scale;
                              const newWidth = Math.max(40, startWidth + deltaW);
                              dispatch({ type: 'UPDATE_META', field: 'broadcastScoreWidth', value: newWidth });
                            };
                            const onUp = () => {
                              window.removeEventListener('mousemove', onMove);
                              window.removeEventListener('mouseup', onUp);
                            };
                            window.addEventListener('mousemove', onMove);
                            window.addEventListener('mouseup', onUp);
                          }}
                        />
                      )}
                      <AnimatedScore score={state.awayTeam.score} color="#facc15" sizeClass="" style={{ fontSize: `${state.meta.broadcastScoreSize ?? 30}px` }} disableScale={true} />
                      {showScoreControlsAway && (
                        <div className={`absolute right-full mr-2 top-1/2 -translate-y-1/2 flex gap-2 bg-slate-900/95 p-2 rounded border-2 border-slate-500 shadow-2xl z-50 animate-in fade-in zoom-in duration-200`}>
                            <button className="p-2 bg-white/10 hover:bg-white/20 rounded text-green-400" onClick={(e) => { e.stopPropagation(); dispatch({type: 'ADD_SCORE', team: 'away', amount: 1})}}><Plus size={20}/></button>
                            <button className="p-2 bg-white/10 hover:bg-white/20 rounded text-red-400" onClick={(e) => { e.stopPropagation(); dispatch({type: 'ADD_SCORE', team: 'away', amount: -1})}}><Minus size={20}/></button>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Vertical Center Divider */}
                  <div className="h-[3px] bg-slate-700 w-full shrink-0" />
                  {/* Home */}
                  <div 
                    className="flex relative overflow-hidden shrink-0"
                    style={{ height: `${state.meta.broadcastTeamRowHeight ?? 72}px` }}
                  >
                    {/* Team Row Resizer */}
                    {state.isAdjustmentMode && (
                      <div 
                        className="absolute left-0 right-0 bottom-[-8px] h-4 cursor-ns-resize z-50 hover:bg-blue-500/50"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          const startY = e.clientY;
                          const startHeight = state.meta.broadcastTeamRowHeight ?? 72;
                          const onMove = (moveEvent: MouseEvent) => {
                            // Since this is the bottom element, dragging the bottom boundary doesn't usually make sense unless it's expanding something else.
                            // Assuming it expands itself just like Away. Wait, if Away team resizer expands itself, and Home team resizer expands itself.
                            const newHeight = Math.max(30, startHeight + (moveEvent.clientY - startY) / (state.meta.broadcastScale ?? 1));
                            dispatch({ type: 'UPDATE_META', field: 'broadcastTeamRowHeight', value: newHeight });
                          };
                          const onUp = () => {
                            window.removeEventListener('mousemove', onMove);
                            window.removeEventListener('mouseup', onUp);
                          };
                          window.addEventListener('mousemove', onMove);
                          window.addEventListener('mouseup', onUp);
                        }}
                      />
                    )}
                    <div className="absolute inset-0 opacity-20" style={{ backgroundColor: state.homeTeam.color }}></div>
                    <div className="flex-1 p-2 flex items-center gap-3 min-w-0 relative z-10">
                      <div 
                        className="rounded-full border-[3px] border-slate-700 overflow-hidden flex items-center justify-center bg-slate-800 shrink-0 transition-all"
                        style={{ width: `${state.meta.broadcastLogoSize ?? 40}px`, height: `${state.meta.broadcastLogoSize ?? 40}px` }}
                      >
                        {state.homeTeam.logoUrl ? (
                          <img src={state.homeTeam.logoUrl} alt="Home Logo" className="w-full h-full object-cover" />
                        ) : (
                          <div 
                            className="w-full h-full rounded-full flex items-center justify-center font-bold text-white uppercase" 
                            style={{ backgroundColor: state.homeTeam.color, fontSize: `${(state.meta.broadcastLogoSize ?? 40) * 0.5}px` }}
                          >
                            {state.homeTeam.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <AutoScalingText text={state.homeTeam.name} className="font-bold tracking-wider uppercase leading-tight py-0.5" style={{ fontSize: `${state.meta.broadcastTeamNameSize ?? 24}px` }} align="left" />
                      </div>
                    </div>
                    <div 
                      className={`border-slate-700 px-2 flex items-center justify-center text-3xl font-black font-display text-yellow-400 shrink-0 relative z-10 cursor-pointer hover:bg-white/10 transition-colors border-l-[3px] h-full`}
                      style={{ width: `${state.meta.broadcastScoreWidth ?? 72}px` }}
                      onMouseDown={() => handleScoreMouseDown('home')}
                      onMouseUp={handleScoreMouseUp}
                      onMouseLeave={handleScoreMouseLeave}
                      onTouchStart={() => handleScoreMouseDown('home')}
                      onTouchEnd={handleScoreMouseUp}
                      onClick={(e) => handleScoreClick(e, 'home')}
                    >
                      <AnimatedScore score={state.homeTeam.score} color="#facc15" sizeClass="" style={{ fontSize: `${state.meta.broadcastScoreSize ?? 30}px` }} disableScale={true} />
                      {showScoreControlsHome && (
                        <div className={`absolute right-full mr-2 top-1/2 -translate-y-1/2 flex gap-2 bg-slate-900/95 p-2 rounded border-2 border-slate-500 shadow-2xl z-50 animate-in fade-in zoom-in duration-200`}>
                            <button className="p-2 bg-white/10 hover:bg-white/20 rounded text-green-400" onClick={(e) => { e.stopPropagation(); dispatch({type: 'ADD_SCORE', team: 'home', amount: 1})}}><Plus size={20}/></button>
                            <button className="p-2 bg-white/10 hover:bg-white/20 rounded text-red-400" onClick={(e) => { e.stopPropagation(); dispatch({type: 'ADD_SCORE', team: 'home', amount: -1})}}><Minus size={20}/></button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Inning */}
                <div 
                  className="p-2 flex flex-col items-center justify-center gap-2 shrink-0 relative"
                  style={{ width: `${state.meta.broadcastInningWidth ?? 56}px` }}
                >
                  {state.isAdjustmentMode && (
                    <div 
                      className="absolute left-[-8px] top-0 bottom-0 w-4 cursor-ew-resize z-50 hover:bg-blue-500/50"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const startX = e.clientX;
                        const startWidth = state.meta.broadcastInningWidth ?? 56;
                        const scale = state.meta.broadcastScale ?? 1;
                        const onMove = (moveEvent: MouseEvent) => {
                          const deltaX = moveEvent.clientX - startX;
                          const deltaW = -deltaX / scale;
                          const newWidth = Math.max(30, startWidth + deltaW);
                          dispatch({ type: 'UPDATE_META', field: 'broadcastInningWidth', value: newWidth });
                        };
                        const onUp = () => {
                          window.removeEventListener('mousemove', onMove);
                          window.removeEventListener('mouseup', onUp);
                        };
                        window.addEventListener('mousemove', onMove);
                        window.addEventListener('mouseup', onUp);
                      }}
                    />
                  )}
                  <div className={`w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[12px] ${state.isTop ? 'border-b-yellow-400' : 'border-b-slate-600'}`} />
                  <div className="font-black font-display" style={{ fontSize: `${state.meta.broadcastInningSize ?? 24}px` }}>{state.inning}</div>
                  <div className={`w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] ${!state.isTop ? 'border-t-yellow-400' : 'border-t-slate-600'}`} />
                </div>
              </div>

              {/* Home Player Row (Bottom) */}
              {showHomePlayer && (
                <div 
                  className="px-2 flex items-center gap-2 text-xl font-bold uppercase overflow-hidden shrink-0 min-h-0 relative"
                  style={{ height: `${state.meta.broadcastPlayerRowHeight ?? 50}px` }}
                >
                  {/* Bottom Resizer */}
                  {state.isAdjustmentMode && (
                    <div 
                      className="absolute left-0 right-0 bottom-[-8px] h-4 cursor-ns-resize z-50 hover:bg-blue-500/50"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const startY = e.clientY;
                        const startHeight = state.meta.broadcastPlayerRowHeight ?? 50;
                        const startMarginY = state.meta.broadcastMarginY ?? 20;
                        const scale = state.meta.broadcastScale ?? 1;
                        const onMove = (moveEvent: MouseEvent) => {
                          const deltaY = moveEvent.clientY - startY;
                          const deltaH = deltaY / scale;
                          const newHeight = Math.max(30, startHeight + deltaH);
                          const actualDeltaH = newHeight - startHeight;
                          dispatch({ type: 'UPDATE_META', field: 'broadcastPlayerRowHeight', value: newHeight });
                          dispatch({ type: 'UPDATE_META', field: 'broadcastMarginY', value: startMarginY - actualDeltaH * scale });
                        };
                        const onUp = () => {
                          window.removeEventListener('mousemove', onMove);
                          window.removeEventListener('mouseup', onUp);
                        };
                        window.addEventListener('mousemove', onMove);
                        window.addEventListener('mouseup', onUp);
                      }}
                    />
                  )}
                  {!isAwayBatter ? (
                    <span className="shrink-0 text-slate-400 font-bold inline-block text-center w-[1.125rem]">{state.homeTeam.currentBatterIndex + 1}.</span>
                  ) : (
                    <span className="shrink-0 text-slate-400 font-bold inline-block text-center w-[1.125rem]">P</span>
                  )}
                  <AnimatePresence mode="wait">
                    {isHomeVisible && (
                    <motion.div
                      key={currentHomeKey}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3 }}
                      className="flex-1 min-w-0 flex items-center h-full justify-between gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <AutoScalingText 
                          text={getPlayerText(homePlayer)} 
                          content={getPlayerContent(homePlayer)} 
                          className="leading-tight py-0.5" 
                          style={{ fontSize: `${state.meta.broadcastPlayerNameSize ?? 20}px` }} 
                          align="left" 
                        />
                      </div>
                      {!isAwayBatter && state.showTimer && (showBroadcastTimer || state.isAdjustmentMode) && (
                        <div 
                          className={`font-display shrink-0 ${state.isAdjustmentMode ? 'cursor-pointer' : ''} ${state.timer <= 8 && state.isTimerRunning && showBroadcastTimer ? 'text-red-500 animate-pulse' : 'text-yellow-400'} ${!showBroadcastTimer ? 'opacity-30' : ''}`}
                          style={{ fontSize: `${state.meta.broadcastTimerSize ?? 24}px` }}
                          onClick={(e) => {
                            if (state.isAdjustmentMode) {
                              e.stopPropagation();
                              dispatch({ type: 'UPDATE_META', field: 'broadcastShowTimer', value: !showBroadcastTimer });
                            }
                          }}
                          title={state.isAdjustmentMode ? "Toggle timer in broadcast mode" : undefined}
                        >
                          {state.timer}
                        </div>
                      )}
                      {isAwayBatter && (showBroadcastPitchCount || state.isAdjustmentMode) && (
                        <div 
                          className={`font-display text-lg shrink-0 ${state.isAdjustmentMode ? 'cursor-pointer' : ''} text-slate-300 font-bold ${!showBroadcastPitchCount ? 'opacity-30' : ''}`}
                          onClick={(e) => {
                            if (state.isAdjustmentMode) {
                              e.stopPropagation();
                              dispatch({ type: 'UPDATE_META', field: 'broadcastShowPitchCount', value: !showBroadcastPitchCount });
                            }
                          }}
                          title={state.isAdjustmentMode ? "Toggle pitch count in broadcast mode" : undefined}
                        >
                          P:{'stat' in homePlayer ? homePlayer.stat.replace('P: ', '') : '0'}
                        </div>
                      )}
                    </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              
              
            </div>

            {/* Right Column (Count & Diamond) */}
            <div 
              className="px-2 flex flex-col items-center shrink-0 relative h-full"
              style={{ width: `${state.meta.broadcastRightColumnWidth ?? 150}px` }}
            >
                            <AnimatePresence>
                {showKAnimation && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none backdrop-blur-sm bg-black/20"
                  >
                    <div className="relative flex items-center justify-center">
                      <span 
                        className="text-[80px] font-black font-rammetto leading-none" 
                        style={{ 
                          color: state.isTop ? state.homeTeam.color : state.awayTeam.color,
                          WebkitTextStroke: '2px white',
                          filter: `drop-shadow(0 0 30px ${state.isTop ? state.homeTeam.color : state.awayTeam.color})`
                        }}
                      >
                        K
                      </span>
                      <motion.div 
                        initial={{ opacity: 1, scale: 0.5 }}
                        animate={{ opacity: 0, scale: 1.5 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="absolute w-[90px] h-[90px] border-[4px] rounded-full" 
                        style={{ borderColor: state.isTop ? state.homeTeam.color : state.awayTeam.color }}
                      />
                      <motion.div 
                        initial={{ opacity: 1, scale: 0.2 }}
                        animate={{ opacity: 0, scale: 2 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                        className="absolute w-[90px] h-[90px] border-[2px] border-white rounded-full" 
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Diamond (Top Half) */}
              <div 
                className="flex items-center justify-center w-full shrink-0"
                style={{ height: `${Math.max(effectiveA, effectiveH) + teamRowHeight}px` }}
              >
                 <div style={{ transform: 'scale(0.35)', transformOrigin: 'center' }}>
                   <Diamond 
                      bases={state.bases} 
                      onToggle={(idx) => dispatch({type: 'TOGGLE_BASE', baseIndex: idx})}
                      className="" 
                      activeColor={activeBaseColor}
                      disableScale={true}
                   />
                 </div>
              </div>

              {/* Divider to perfectly align with Left Column's middle border */}
              <div style={{ height: '3px' }} className="w-full shrink-0" />

              {/* Count (Bottom Half) */}
              <div 
                className="flex flex-col justify-center items-center w-full px-2 shrink-0 overflow-hidden min-h-0"
                style={{ 
                  height: `${teamRowHeight + effectiveH - pitchInfoHeight}px`,
                  paddingTop: `${pitchInfoHeight}px`
                }}
              >
                  <div 
                    className="flex flex-col justify-center items-start my-auto transition-all"
                    style={{ gap: `${Math.max(0, state.meta.broadcastCountGap ?? 2)}px` }}
                  >
                      {/* Balls */}
                      <div className="flex items-center gap-1.5 cursor-pointer group" onClick={handleBallClick}>
                          <span className="text-base sm:text-lg font-bold text-slate-500 group-hover:text-white transition-colors w-4 text-center leading-none">B</span>
                          <div className="flex space-x-1 items-center">
                              {[0, 1, 2].map(i => (
                                  <AnimatedIndicator 
                                      key={i}
                                      active={i < state.balls} 
                                      colorClass="bg-led-green" 
                                      shadowClass="shadow-[0_0_10px_#00ff41]" 
                                      baseClass="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full border-2"
                                      disableAnimation={true}
                                      disableGlow={true}
                                  />
                              ))}
                          </div>
                      </div>
                      {/* Strikes */}
                      <div 
                        className="flex items-center gap-1.5 cursor-pointer group" 
                        style={{ marginTop: (state.meta.broadcastCountGap ?? 2) < 0 ? `${state.meta.broadcastCountGap}px` : undefined }}
                        onClick={handleStrikeClick}
                      >
                          <span className="text-base sm:text-lg font-bold text-slate-500 group-hover:text-white transition-colors w-4 text-center leading-none">S</span>
                          <div className="flex space-x-1 items-center">
                              {[0, 1].map(i => (
                                  <AnimatedIndicator 
                                      key={i}
                                      active={i < state.strikes} 
                                      colorClass="bg-led-yellow" 
                                      shadowClass="shadow-[0_0_10px_#ffcc00]" 
                                      baseClass="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full border-2"
                                      disableAnimation={true}
                                      disableGlow={true}
                                  />
                              ))}
                          </div>
                      </div>
                      {/* Outs */}
                      <div 
                        className="flex items-center gap-1.5 cursor-pointer group" 
                        style={{ marginTop: (state.meta.broadcastCountGap ?? 2) < 0 ? `${state.meta.broadcastCountGap}px` : undefined }}
                        onClick={handleOutClick}
                      >
                          <span className="text-base sm:text-lg font-bold text-slate-500 group-hover:text-white transition-colors w-4 text-center leading-none">O</span>
                          <div className="flex space-x-1 items-center">
                              {[0, 1].map(i => (
                                  <AnimatedIndicator 
                                      key={i}
                                      active={i < state.outs} 
                                      colorClass="bg-led-red" 
                                      shadowClass="shadow-[0_0_10px_#ff3b30]" 
                                      baseClass="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full border-2"
                                      disableAnimation={true}
                                      disableGlow={true}
                                  />
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
            </div>

          </div>


        </div>
      </div>
    );
  };

  return (
    <div ref={ref} className="w-full h-full relative">
        {state.displayMode === 'lineup' ? renderLineupView() : 
         state.displayMode === 'rhe' ? renderRHEView() : 
         state.displayMode === 'broadcast' ? renderBroadcastView() :
         renderDefaultView()}
        
        {/* Home Run Animation Overlay (Full Screen for non-broadcast) */}
        {state.displayMode !== 'broadcast' && state.animation && (
          <div 
            className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none overflow-hidden bg-black/70 backdrop-blur-md"
            style={{ animation: state.animation.isLocked ? 'none' : state.animation.isExiting ? 'fadeOut 0.5s ease-in-out forwards' : 'fadeOut 0.5s ease-in-out 4.5s forwards' }}
          >
            <div 
              className="relative flex flex-col items-center justify-center w-full h-full"
              style={{ animation: state.animation.isLocked ? 'none' : state.animation.isExiting ? 'outroContainer 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards' : 'outroContainer 0.5s cubic-bezier(0.4, 0, 0.2, 1) 4.5s forwards' }}
            >
              {/* Expanding circle */}
              <div 
                key={`bubble-local-${state.animation.bubbleKey || 0}`}
                className="absolute rounded-full mix-blend-screen"
                style={{
                  backgroundColor: state.animation.teamColor || '#fff',
                  animation: 'expandCircle 1s cubic-bezier(0.1, 0.8, 0.3, 1) forwards'
                }}
              />
              
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="overflow-hidden">
                  <div 
                    className="flex items-center justify-center gap-6 text-3xl md:text-5xl font-bold text-white/80 uppercase w-full px-10"
                    style={{ animation: 'slideRightOut 0.6s cubic-bezier(0.16, 1, 0.3, 1) 1.0s both' }}
                  >
                    <div className="flex-1 min-w-0">
                      <AutoScalingText text={state.animation.teamName} align="right" />
                    </div>
                    <span className="opacity-50 font-light">|</span>
                    <div className="flex-1 min-w-0">
                      <AutoScalingText text={state.animation.playerName} align="left" />
                    </div>
                  </div>
                </div>
                
                <div 
                  className="flex flex-col items-center uppercase tracking-tighter text-center"
                  style={{
                    fontFamily: '"LINE Seed JP", sans-serif',
                    fontWeight: 800,
                    animation: 'popScale 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both'
                  }}
                >
                  <div className={`text-8xl md:text-[12rem] leading-none ${
                    state.animation.type === 'homerun' ? 'text-white drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]' :
                    state.animation.type === '2-run-homer' ? 'text-yellow-200 drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]' :
                    state.animation.type === '3-run-homer' ? 'text-orange-400 drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]' :
                    'text-transparent bg-clip-text bg-gradient-to-b from-red-600 via-red-500 to-yellow-400 drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]'
                  }`}>
                    {state.animation.type === 'homerun' && (language === 'zh' ? '陽春砲' : language === 'ja' ? <span className="flex flex-col items-center justify-center leading-tight"><span>ソロ</span><span>ホームラン</span></span> : 'HOMERUN!')}
                    {state.animation.type === '2-run-homer' && (language === 'zh' ? '兩分砲' : language === 'ja' ? <span className="flex flex-col items-center justify-center leading-tight"><span>2ラン</span><span>ホームラン</span></span> : '2-RUN HOMER!')}
                    {state.animation.type === '3-run-homer' && (language === 'zh' ? '三分砲' : language === 'ja' ? <span className="flex flex-col items-center justify-center leading-tight"><span>3ラン</span><span>ホームラン</span></span> : '3-RUN HOMER!')}
                    {state.animation.type === 'grand-slam' && (language === 'zh' ? '滿貫砲' : language === 'ja' ? '満塁ホームラン' : 'GRAND SLAM!')}
                  </div>
                  {(language === 'zh' || language === 'ja') && (
                    <div className={`text-3xl md:text-5xl mt-2 md:mt-4 tracking-widest opacity-90 ${
                      state.animation.type === 'homerun' ? 'text-white' :
                      state.animation.type === '2-run-homer' ? 'text-yellow-200' :
                      state.animation.type === '3-run-homer' ? 'text-orange-400' :
                      'text-transparent bg-clip-text bg-gradient-to-b from-red-600 via-red-500 to-yellow-400'
                    }`}>
                      {state.animation.type === 'homerun' && 'SOLO HOME RUN'}
                      {state.animation.type === '2-run-homer' && '2-RUN HOME RUN'}
                      {state.animation.type === '3-run-homer' && '3-RUN HOME RUN'}
                      {state.animation.type === 'grand-slam' && 'GRAND SLAM'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <style>{`
          @keyframes slamIn {
            0% { transform: scale(3) translateY(-50px) rotate(-10deg); opacity: 0; filter: blur(10px); }
            100% { transform: scale(1) translateY(0) rotate(-5deg); opacity: 1; filter: blur(0); }
          }
          @keyframes slide-down {
            0% { transform: translateY(-50px) skewX(-12deg); opacity: 0; }
            100% { transform: translateY(0) skewX(-12deg); opacity: 1; }
          }
          .animate-slide-down {
            animation: slide-down 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          }
          @keyframes flashBg {
            0% { opacity: 0.1; }
            100% { opacity: 0.5; }
          }
          @keyframes slideInLeft {
            0% { transform: translateX(-100vw) skewX(-12deg); opacity: 0; }
            100% { transform: translateX(0) skewX(-12deg); opacity: 1; }
          }
          @keyframes slideInRight {
            0% { transform: translateX(100vw) skewX(-12deg); opacity: 0; }
            100% { transform: translateX(0) skewX(-12deg); opacity: 1; }
          }
          @keyframes pan-bg {
            0% { background-position: 0 0; }
            100% { background-position: 100px 100px; }
          }
          .animate-pan-bg {
            animation: pan-bg 2s linear infinite;
          }
          @keyframes hrProgressSvg {
            from { stroke-dashoffset: 0; }
            to { stroke-dashoffset: 213.6; }
          }
          @keyframes expandCircle {
            0% { width: 0; height: 0; opacity: 0.8; }
            100% { width: 150vw; height: 150vw; opacity: 0; }
          }
          @keyframes revealUp {
            0% { transform: translateY(100%); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
          }
          @keyframes popScale {
            0% { transform: scale(0.5); opacity: 0; }
            70% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes slideRightOut {
            0% { transform: translateX(-101%); }
            100% { transform: translateX(0); }
          }
          @keyframes fadeOut {
            0% { opacity: 1; }
            100% { opacity: 0; }
          }
          @keyframes outroContainer {
            0% { opacity: 1; transform: scale(1); filter: blur(0); }
            100% { opacity: 0; transform: scale(0.9); filter: blur(8px); }
          }
        `}</style>
    </div>
  );
});