

import React, { useRef, useEffect, useState } from 'react';
import { GameState, ActionType, Player, Team, PitchInfo, GameMeta } from '../types';
import { Play, Pause, RotateCcw, Eye, EyeOff, User, Trash2, Plus, PenTool, Tv, LayoutTemplate, Square, Image as ImageIcon, RefreshCw, ArrowDown, ArrowUp, GripVertical, Settings, Check, CircleDot } from 'lucide-react';
import { ImageCropperModal } from './ImageCropperModal';
import { 
  DndContext, 
  closestCenter, 
  PointerSensor, 
  TouchSensor,
  useSensor, 
  useSensors, 
  DragEndEvent 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  verticalListSortingStrategy, 
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

interface ControlsProps {
  state: GameState;
  dispatch: React.Dispatch<ActionType>;
  language?: 'en' | 'zh' | 'ja';
}

const SortablePlayerRow = ({ 
  player, 
  idx, 
  isLineup, 
  isCurrentBatter, 
  onUpdate, 
  onMove, 
  onRemove,
  onSetPitcher,
  language,
  selectedPosId,
  onPosClick,
  onPosDoubleClick,
  onPosBlur,
  isPosEditing
}: { 
  player: Player; 
  idx: number; 
  isLineup: boolean; 
  isCurrentBatter: boolean;
  onUpdate: (field: keyof Player, value: string) => void;
  onMove: () => void;
  onRemove: () => void;
  onSetPitcher: () => void;
  language: 'en' | 'zh' | 'ja';
  key?: any;
  selectedPosId?: string | null;
  onPosClick?: (id: string) => void;
  onPosDoubleClick?: (id: string) => void;
  onPosBlur?: () => void;
  isPosEditing?: boolean;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: player.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`flex items-center gap-1 text-xs p-1 rounded border min-w-max ${isDragging ? 'opacity-50 bg-blue-50 border-blue-200' : isCurrentBatter ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-transparent'}`}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-gray-500 hover:text-gray-800 transition-colors shrink-0">
        <GripVertical size={14} />
      </div>
      {!isLineup ? null : <span className="w-4 shrink-0 text-gray-400 font-mono text-[10px] text-right">{idx + 1}</span>}
      <input 
        className={`w-8 shrink-0 border rounded px-1 text-center font-bold text-slate-900 bg-white ${selectedPosId === player.id ? 'ring-2 ring-blue-500' : ''} ${!isPosEditing ? 'cursor-pointer select-none' : ''}`} 
        value={player.position || ''} 
        placeholder="Pos" 
        onChange={(e) => onUpdate('position', e.target.value)}
        readOnly={!isPosEditing}
        onClick={() => onPosClick?.(player.id)}
        onDoubleClick={() => onPosDoubleClick?.(player.id)}
        onBlur={() => onPosBlur?.()}
      />
      <input 
        className="w-8 shrink-0 border rounded px-1 text-center text-slate-900 bg-white" 
        value={player.number} 
        placeholder="#" 
        onChange={(e) => onUpdate('number', e.target.value)} 
      />
      <input 
        className="w-24 shrink-0 border rounded px-1 text-slate-900 bg-white" 
        value={player.name} 
        placeholder="Name" 
        onChange={(e) => onUpdate('name', e.target.value)} 
      />
      <input 
        className="w-12 shrink-0 border rounded px-1 text-center text-slate-900 bg-white" 
        value={player.stat} 
        placeholder="Avg" 
        onChange={(e) => onUpdate('stat', e.target.value)} 
      />
      <button 
        onClick={onMove} 
        className={`shrink-0 p-1 ${isLineup ? 'text-blue-400 hover:text-blue-600' : 'text-green-600 hover:text-green-700'}`} 
        title={isLineup ? (language === 'zh' ? "移至板凳" : language === 'en' ? "To Bench" : "ベンチへ") : (language === 'zh' ? "移至打線" : language === 'en' ? "To Lineup" : "打順へ")}
      >
        {isLineup ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
      </button>
      <button 
        onClick={onSetPitcher} 
        className="shrink-0 p-1 text-purple-400 hover:text-purple-600" 
        title={language === 'en' ? 'Set as Pitcher' : language === 'zh' ? '設為投手' : '投手に設定'}
      >
        <CircleDot size={14} />
      </button>
      <button onClick={onRemove} className="shrink-0 p-1 text-red-400 hover:text-red-600" title={language === 'zh' ? '移除' : language === 'ja' ? '削除' : 'Remove'}>
        <Trash2 size={14} />
      </button>
    </div>
  );
};

const TeamEditor: React.FC<{ teamKey: 'home' | 'away', state: GameState, dispatch: React.Dispatch<ActionType>, language?: 'en' | 'zh' | 'ja' }> = ({ teamKey, state, dispatch, language = 'zh' }) => {
  const globalTeam = state[teamKey === 'home' ? 'homeTeam' : 'awayTeam'];
  const [draft, setDraft] = React.useState<Team>(globalTeam);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState('');
  
  const [selectedPosId, setSelectedPosId] = useState<string | null>(null);
  const [editingPosId, setEditingPosId] = useState<string | null>(null);

  const handlePosClick = (id: string) => {
    if (editingPosId === id) return;
    if (selectedPosId && selectedPosId !== id) {
      const getPlayerLoc = (pid: string) => {
        let idx = draft.lineup.findIndex(p => p.id === pid);
        if (idx >= 0) return { list: 'lineup' as const, idx };
        idx = draft.bench.findIndex(p => p.id === pid);
        if (idx >= 0) return { list: 'bench' as const, idx };
        return null;
      };

      const loc1 = getPlayerLoc(selectedPosId);
      const loc2 = getPlayerLoc(id);

      if (loc1 && loc2) {
        const newDraft = { ...draft, lineup: [...draft.lineup], bench: [...draft.bench] };
        const p1Pos = newDraft[loc1.list][loc1.idx].position;
        const p2Pos = newDraft[loc2.list][loc2.idx].position;
        
        newDraft[loc1.list][loc1.idx] = { ...newDraft[loc1.list][loc1.idx], position: p2Pos };
        newDraft[loc2.list][loc2.idx] = { ...newDraft[loc2.list][loc2.idx], position: p1Pos };
        
        setDraft(newDraft);
      }
      setSelectedPosId(null);
    } else {
      setSelectedPosId(selectedPosId === id ? null : id);
    }
  };

  const handlePosDoubleClick = (id: string) => {
    setSelectedPosId(null);
    setEditingPosId(id);
  };

  React.useEffect(() => {
    setDraft(globalTeam);
  }, [state.meta.settingsVersion]);

  // Sync score and currentBatterIndex from global to draft so they don't get overwritten with stale values
  React.useEffect(() => {
    setDraft(prev => ({
      ...prev,
      score: globalTeam.score,
      currentBatterIndex: globalTeam.currentBatterIndex
    }));
  }, [globalTeam.score, globalTeam.currentBatterIndex]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImageSrc(reader.result as string);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = ''; // Reset input
  };

  const handleCropComplete = (croppedImage: string) => {
    setDraft(prev => ({ ...prev, logoUrl: croppedImage }));
    setCropModalOpen(false);
    setTempImageSrc('');
  };

  const updateDraft = (field: keyof Team, value: any) => {
    setDraft(prev => ({ ...prev, [field]: value }));
  };

  const updatePitcher = (field: keyof Player, value: string) => {
    setDraft(prev => ({ ...prev, pitcher: { ...prev.pitcher, [field]: value } }));
  };

  const updateLineupPlayer = (index: number, field: keyof Player, value: string) => {
    setDraft(prev => {
      const newLineup = [...prev.lineup];
      newLineup[index] = { ...newLineup[index], [field]: value };
      return { ...prev, lineup: newLineup };
    });
  };

  const updateBenchPlayer = (index: number, field: keyof Player, value: string) => {
    setDraft(prev => {
      const newBench = [...prev.bench];
      newBench[index] = { ...newBench[index], [field]: value };
      return { ...prev, bench: newBench };
    });
  };

  const addLineupPlayer = () => {
    setDraft(prev => ({
      ...prev,
      lineup: [...prev.lineup, { id: Math.random().toString(36).substr(2, 9), name: '', number: '', stat: '', position: '' }]
    }));
  };

  const addBenchPlayer = () => {
    setDraft(prev => ({
      ...prev,
      bench: [...prev.bench, { id: Math.random().toString(36).substr(2, 9), name: '', number: '', stat: '', position: '' }]
    }));
  };

  const removeLineupPlayer = (index: number) => {
    setDraft(prev => ({
      ...prev,
      lineup: prev.lineup.filter((_, i) => i !== index)
    }));
  };

  const removeBenchPlayer = (index: number) => {
    setDraft(prev => ({
      ...prev,
      bench: prev.bench.filter((_, i) => i !== index)
    }));
  };

  const moveToBench = (index: number) => {
    setDraft(prev => {
      const player = prev.lineup[index];
      return {
        ...prev,
        lineup: prev.lineup.filter((_, i) => i !== index),
        bench: [...prev.bench, player]
      };
    });
  };

  const moveToLineup = (index: number) => {
    setDraft(prev => {
      const player = prev.bench[index];
      return {
        ...prev,
        bench: prev.bench.filter((_, i) => i !== index),
        lineup: [...prev.lineup, player]
      };
    });
  };

  const setAsPitcher = (player: Player) => {
    setDraft(prev => ({
      ...prev,
      pitcher: { 
        ...prev.pitcher, 
        name: player.name, 
        number: player.number 
      }
    }));
  };

  const handleSubmit = () => {
    dispatch({ type: 'APPLY_TEAM_CONFIG', team: teamKey, config: draft });
  };

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
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeInLineupIdx = draft.lineup.findIndex(p => p.id === activeId);
    const activeInBenchIdx = draft.bench.findIndex(p => p.id === activeId);
    
    const overInLineupIdx = draft.lineup.findIndex(p => p.id === overId);
    const overInBenchIdx = draft.bench.findIndex(p => p.id === overId);

    if (activeInLineupIdx !== -1 && overInLineupIdx !== -1) {
      setDraft(prev => ({
        ...prev,
        lineup: arrayMove(prev.lineup, activeInLineupIdx, overInLineupIdx)
      }));
    } else if (activeInBenchIdx !== -1 && overInBenchIdx !== -1) {
      setDraft(prev => ({
        ...prev,
        bench: arrayMove(prev.bench, activeInBenchIdx, overInBenchIdx)
      }));
    }
  };

  return (
    <div 
      className={`p-3 rounded border min-w-0 overflow-hidden box-border ${teamKey === 'away' ? 'bg-blue-50/50 border-blue-200' : 'bg-red-50/50 border-red-200'}`}
    >
      <div className="flex flex-col gap-2 mb-2 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
           <div className="flex items-center gap-1 shrink-0">
             <div className="flex flex-col gap-1">
               <div className="flex items-center gap-1" title={language === 'en' ? 'Team Color' : language === 'zh' ? '隊伍色' : 'チーム色'}>
                 <input type="color" className="w-6 h-6 rounded cursor-pointer border-none p-0 shrink-0" value={draft.color} onChange={(e) => updateDraft('color', e.target.value)} />
                 <span className="text-[9px] text-gray-500 font-bold leading-none w-8">{language === 'en' ? 'TEAM' : language === 'zh' ? '隊伍' : 'チーム'}</span>
               </div>
               <div className="flex items-center gap-1" title={language === 'en' ? 'Base Color' : language === 'zh' ? '壘包色' : 'ベース色'}>
                 <input type="color" className="w-6 h-6 rounded cursor-pointer border-none p-0 shrink-0" value={draft.baseColor || '#facc15'} onChange={(e) => updateDraft('baseColor', e.target.value)} />
                 <span className="text-[9px] text-gray-500 font-bold leading-none w-8">{language === 'en' ? 'BASE' : language === 'zh' ? '壘包' : 'ベース'}</span>
               </div>
             </div>
             <label className="cursor-pointer bg-white border rounded p-1 hover:bg-gray-50 h-full flex items-center justify-center shrink-0" title="Upload Logo">
               <ImageIcon size={16} className="text-gray-500" />
               <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
             </label>
           </div>
           
           <div className="flex flex-col gap-1 flex-1 min-w-[100px]">
               <div className="flex items-center justify-between border-2 border-slate-400 bg-white rounded text-black overflow-hidden shadow-sm">
                  <button className="px-2 py-1 hover:bg-gray-100 text-black font-bold border-r-2 border-slate-200 flex-1" onClick={() => dispatch({type: 'ADD_SCORE', team: teamKey, amount: -1})}>-</button>
                  <span className="font-mono font-bold text-black text-base min-w-[1.2rem] text-center px-1">{globalTeam.score}</span>
                  <button className="px-2 py-1 hover:bg-gray-100 text-black font-bold border-l-2 border-slate-200 flex-1" onClick={() => dispatch({type: 'ADD_SCORE', team: teamKey, amount: 1})}>+</button>
               </div>
               <div className="flex gap-1 w-full min-w-0">
                 <button 
                   onClick={() => {
                     if (confirm(language === 'en' ? 'Reset this team?' : language === 'zh' ? '確定要重置此隊伍的陣容與設定嗎？' : 'このチームのラインナップと設定をリセットしますか？')) {
                       dispatch({ type: 'RESET_TEAM', team: teamKey });
                     }
                   }} 
                   className="bg-red-600 hover:bg-red-700 text-white flex items-center justify-center py-1 px-1.5 rounded shadow shrink-0"
                   title={language === 'en' ? 'Reset Team' : language === 'zh' ? '重置隊伍' : 'チームリセット'}
                 >
                   <RotateCcw size={12} />
                 </button>
                 <button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold py-1 px-1 rounded shadow flex-1 whitespace-nowrap overflow-hidden text-ellipsis text-center min-w-0">
                   {language === 'en' ? 'Update Info' : language === 'zh' ? '更新資訊' : '情報更新'}
                 </button>
               </div>
           </div>
        </div>
        
        <div className="flex flex-col gap-1 min-w-0 w-full">
            <input 
              className="w-full border-2 border-slate-300 p-1.5 rounded text-sm font-bold text-black bg-white box-border min-w-0" 
              value={draft.name}
              onChange={(e) => updateDraft('name', e.target.value)}
              placeholder="Team (Abbr)"
            />
             <input 
              className="w-full border-2 border-slate-300 p-1.5 rounded text-xs text-black bg-white box-border min-w-0" 
              value={draft.fullName}
              onChange={(e) => updateDraft('fullName', e.target.value)}
              placeholder="Team Full Name"
            />
        </div>
      </div>
      
      {/* RHE & Inning Scores Editor */}
      <div className="bg-white p-2 rounded border shadow-sm mt-2 min-w-0 overflow-hidden">
        <div className="flex justify-between items-center mb-1">
          <h4 className="font-bold text-xs text-gray-700">{language === 'en' ? 'RHE & Innings' : language === 'zh' ? 'RHE 與局數分數' : 'RHEとイニングスコア'}</h4>
        </div>
        <div className="flex items-center gap-2 mb-2 flex-wrap min-w-0">
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs font-bold w-3 text-slate-700">H</span>
            <input type="number" className="w-10 border rounded px-1 text-sm text-slate-900 bg-white min-w-0" value={draft.hits} onChange={(e) => updateDraft('hits', parseInt(e.target.value) || 0)} />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs font-bold w-3 text-slate-700">E</span>
            <input type="number" className="w-10 border rounded px-1 text-sm text-slate-900 bg-white min-w-0" value={draft.errors} onChange={(e) => updateDraft('errors', parseInt(e.target.value) || 0)} />
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1 min-w-0 max-w-full">
          {draft.inningScores.map((score, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <span className="text-[10px] text-gray-500">{idx + 1}</span>
              <input 
                type="text" 
                className="w-8 border rounded px-1 text-center text-xs text-slate-900 bg-white" 
                value={score === null ? '' : score}
                onChange={(e) => {
                  const val = e.target.value;
                  const newScores = [...draft.inningScores];
                  newScores[idx] = val === '' ? null : (parseInt(val) || 0);
                  updateDraft('inningScores', newScores);
                }}
              />
            </div>
          ))}
          <button 
            onClick={() => updateDraft('inningScores', [...draft.inningScores, null])}
            className="w-8 h-[22px] mt-[15px] flex items-center justify-center border border-dashed rounded text-gray-400 hover:text-gray-600 hover:bg-gray-50 shrink-0"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* Pitcher Editor */}
      <div className="bg-orange-50 p-2 rounded border border-orange-200 mt-2 min-w-0 overflow-hidden">
          <h4 className="font-bold text-xs text-orange-800 mb-1 flex items-center gap-1"><PenTool size={12}/> Active Pitcher</h4>
          <div className="flex items-center gap-1 min-w-0 w-full overflow-x-auto">
              <div className="flex items-center gap-1 min-w-max">
                  <input className="w-12 border rounded px-1 text-sm text-slate-900 bg-white shrink-0" value={draft.pitcher.number} onChange={(e) => updatePitcher('number', e.target.value)} placeholder="#" />
                  <input className="w-32 border rounded px-1 text-sm text-slate-900 bg-white shrink-0" value={draft.pitcher.name} onChange={(e) => updatePitcher('name', e.target.value)} placeholder="Name" />
                  <input className="w-16 border rounded px-1 text-sm text-slate-900 bg-white shrink-0" value={draft.pitcher.stat} onChange={(e) => updatePitcher('stat', e.target.value)} placeholder="P: 0" />
              </div>
          </div>
      </div>

      {/* Lineup Editor */}
      <div className="bg-white p-3 rounded border shadow-sm mt-2">
        <div className="flex justify-between items-center mb-2">
          <div className="flex flex-col">
            <h4 className="font-bold text-sm text-gray-700">{draft.name} 打線 (Lineup)</h4>
            <span className="text-[9px] text-gray-400 italic">拖曳左側圖示可重新排序</span>
          </div>
          <button onClick={addLineupPlayer} className="text-xs flex items-center bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">
            <Plus size={12} className="mr-1" /> 新增
          </button>
        </div>
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <div className="space-y-1 max-h-48 overflow-y-auto overflow-x-auto pr-1">
            <SortableContext items={draft.lineup.map(p => p.id)} strategy={verticalListSortingStrategy}>
              {draft.lineup.map((player, idx) => (
                <SortablePlayerRow 
                  key={player.id}
                  player={player}
                  idx={idx}
                  isLineup={true}
                  isCurrentBatter={idx === globalTeam.currentBatterIndex && ((state.isTop && teamKey === 'away') || (!state.isTop && teamKey === 'home'))}
                  language={language as "en" | "zh" | "ja"}
                  onUpdate={(field, value) => updateLineupPlayer(idx, field, value)}
                  onMove={() => moveToBench(idx)}
                  onRemove={() => removeLineupPlayer(idx)}
                  onSetPitcher={() => setAsPitcher(player)}
                  selectedPosId={selectedPosId}
                  onPosClick={handlePosClick}
                  onPosDoubleClick={handlePosDoubleClick}
                  onPosBlur={() => setEditingPosId(null)}
                  isPosEditing={editingPosId === player.id}
                />
              ))}
            </SortableContext>
          </div>
        </DndContext>
      </div>

      {/* Bench Editor */}
      <div className="bg-slate-50 p-3 rounded border shadow-sm mt-2">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-bold text-sm text-slate-700">{draft.name} 板凳 (Bench)</h4>
          <button onClick={addBenchPlayer} className="text-xs flex items-center bg-slate-200 text-slate-700 px-2 py-1 rounded hover:bg-slate-300">
            <Plus size={12} className="mr-1" /> 新增
          </button>
        </div>
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <div className="space-y-1 max-h-40 overflow-y-auto overflow-x-auto pr-1">
            <SortableContext items={draft.bench.map(p => p.id)} strategy={verticalListSortingStrategy}>
              {draft.bench.map((player, idx) => (
                <SortablePlayerRow 
                  key={player.id}
                  player={player}
                  idx={idx}
                  isLineup={false}
                  isCurrentBatter={false}
                  language={language as "en" | "zh" | "ja"}
                  onUpdate={(field, value) => updateBenchPlayer(idx, field, value)}
                  onMove={() => moveToLineup(idx)}
                  onRemove={() => removeBenchPlayer(idx)}
                  onSetPitcher={() => setAsPitcher(player)}
                  selectedPosId={selectedPosId}
                  onPosClick={handlePosClick}
                  onPosDoubleClick={handlePosDoubleClick}
                  onPosBlur={() => setEditingPosId(null)}
                  isPosEditing={editingPosId === player.id}
                />
              ))}
            </SortableContext>
            {draft.bench.length === 0 && <div className="text-center text-slate-400 text-[10px] py-2">板凳區目前沒有球員</div>}
          </div>
        </DndContext>
      </div>

      <ImageCropperModal
        isOpen={cropModalOpen}
        imageSrc={tempImageSrc}
        onClose={() => {
          setCropModalOpen(false);
          setTempImageSrc('');
        }}
        onCropComplete={handleCropComplete}
        language={language as "en" | "zh" | "ja"}
      />
    </div>
  );
};

export const ScoreboardControls: React.FC<ControlsProps> = ({ state, dispatch, language = 'zh' }) => {
  const [activeTab, setActiveTab] = useState<'controls' | 'info'>('controls');

  const [hrState, setHrState] = React.useState<'idle' | 'playing' | 'locked' | 'exiting'>('idle');
  const hrTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const hrLockTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const hrBubbleIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const activeBatterTeam = state.isTop ? 'away' : 'home';
  const activePitcherTeam = state.isTop ? 'home' : 'away';
  const activeBatterTeamObj = state.isTop ? state.awayTeam : state.homeTeam;
  const activePitcherTeamObj = state.isTop ? state.homeTeam : state.awayTeam;
  
  const activeBatter = activeBatterTeamObj.lineup[activeBatterTeamObj.currentBatterIndex] || null;
  const activePitcher = activePitcherTeamObj.pitcher;

  const [matchupDraft, setMatchupDraft] = useState({ batter: activeBatter, pitcher: activePitcher });

  React.useEffect(() => {
    setMatchupDraft({ batter: activeBatter, pitcher: activePitcher });
  }, [activeBatter, activePitcher]);

  const handleUpdateMatchup = () => {
    if (matchupDraft.batter && activeBatter) {
      if (matchupDraft.batter.number !== activeBatter.number) dispatch({ type: 'UPDATE_LINEUP_PLAYER', team: activeBatterTeam, index: activeBatterTeamObj.currentBatterIndex, field: 'number', value: matchupDraft.batter.number });
      if (matchupDraft.batter.name !== activeBatter.name) dispatch({ type: 'UPDATE_LINEUP_PLAYER', team: activeBatterTeam, index: activeBatterTeamObj.currentBatterIndex, field: 'name', value: matchupDraft.batter.name });
    }
    if (matchupDraft.pitcher && activePitcher) {
      if (matchupDraft.pitcher.number !== activePitcher.number || matchupDraft.pitcher.name !== activePitcher.name) {
        dispatch({ type: 'UPDATE_TEAM', team: activePitcherTeam, field: 'pitcher', value: { ...activePitcher, number: matchupDraft.pitcher.number, name: matchupDraft.pitcher.name } });
      }
    }
  };

  const updateMatchupDraft = (role: 'batter' | 'pitcher', field: keyof Player, value: string) => {
    setMatchupDraft(prev => ({
      ...prev,
      [role]: prev[role] ? { ...prev[role], [field]: value } : null
    }));
  };

  const handleSelectBench = (role: 'batter' | 'pitcher', e: React.ChangeEvent<HTMLSelectElement>) => {
    const playerId = e.target.value;
    if (!playerId) return;
    const teamObj = role === 'batter' ? activeBatterTeamObj : activePitcherTeamObj;
    const player = teamObj.bench.find(p => p.id === playerId);
    if (player) {
      setMatchupDraft(prev => ({
        ...prev,
        [role]: prev[role] ? { ...prev[role], number: player.number, name: player.name } : null
      }));
    }
    e.target.value = ''; // Reset select
  };

  React.useEffect(() => {
     if (!state.animation && hrState !== 'idle') {
         setHrState('idle');
         if (hrTimeoutRef.current) clearTimeout(hrTimeoutRef.current);
         if (hrBubbleIntervalRef.current) clearInterval(hrBubbleIntervalRef.current);
     }
  }, [state.animation, hrState]);

  const endHr = (immediate: boolean = false) => {
    if (hrLockTimeoutRef.current) {
        clearTimeout(hrLockTimeoutRef.current);
        hrLockTimeoutRef.current = null;
    }
    if (hrTimeoutRef.current) clearTimeout(hrTimeoutRef.current);
    if (hrBubbleIntervalRef.current) clearInterval(hrBubbleIntervalRef.current);
    if (immediate) {
        setHrState('idle');
        dispatch({ type: 'SET_ANIMATION', animation: null });
    } else {
        setHrState('exiting');
        dispatch({ type: 'EXIT_HR_ANIMATION' });
        hrTimeoutRef.current = setTimeout(() => {
            setHrState('idle');
            dispatch({ type: 'SET_ANIMATION', animation: null });
        }, 500);
    }
  };

  const handleHrMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (hrState === 'locked') {
       endHr(false);
       return;
    }
    if (hrState === 'exiting') {
       return;
    }
    if (hrState === 'playing') {
       hrLockTimeoutRef.current = setTimeout(() => {
           setHrState('locked');
           dispatch({ type: 'LOCK_HR_ANIMATION' });
           if (hrTimeoutRef.current) clearTimeout(hrTimeoutRef.current);
           hrBubbleIntervalRef.current = setInterval(() => {
               dispatch({ type: 'TRIGGER_HR_BUBBLE' });
           }, 3000);
       }, 500);
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
        dispatch({ type: 'LOCK_HR_ANIMATION' });
        if (hrTimeoutRef.current) clearTimeout(hrTimeoutRef.current);
        hrBubbleIntervalRef.current = setInterval(() => {
            dispatch({ type: 'TRIGGER_HR_BUBBLE' });
        }, 3000);
    }, 500);

    hrTimeoutRef.current = setTimeout(() => {
        setHrState('idle');
        dispatch({ type: 'SET_ANIMATION', animation: null });
    }, 5000);
  };

  const handleHrMouseUp = () => {
    if (hrLockTimeoutRef.current) {
        clearTimeout(hrLockTimeoutRef.current);
        hrLockTimeoutRef.current = null;
    }
  };

  const handleHrDoubleClick = () => {
     endHr(true);
  };

  const updatePitch = (field: keyof PitchInfo, value: string) => {
    dispatch({ type: 'UPDATE_PITCH', field, value });
  };
  
  const updateMeta = (field: keyof GameMeta, value: any) => {
    dispatch({ type: 'UPDATE_META', field, value });
  };



  return (
    <div className="flex flex-col min-h-full bg-gray-100">
      <div className="flex border-b border-gray-300 bg-white shrink-0">
        <button
          className={`flex-1 py-3 text-sm font-bold uppercase transition-colors ${activeTab === 'controls' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
          onClick={() => setActiveTab('controls')}
        >
          {language === 'en' ? 'Game Controls' : language === 'zh' ? '控制台' : 'コントロール'}
        </button>
        <button
          className={`flex-1 py-3 text-sm font-bold uppercase transition-colors ${activeTab === 'info' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
          onClick={() => setActiveTab('info')}
        >
          {language === 'en' ? 'Teams & Info' : language === 'zh' ? '比賽資訊與名單' : '試合情報と名簿'}
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 gap-6">
        
        {activeTab === 'controls' && (
          <div className="flex flex-col gap-6">
           {/* Game State Actions */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide border-b pb-1">{language === 'en' ? 'Umpire Controls' : language === 'zh' ? 'Umpire Controls 裁判控制' : '審判コントロール'}</h3>            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column (Count Controls) */}
            <div className="flex flex-col gap-2 h-full">
              <div className="flex flex-1 min-h-[44px]">
                <button 
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-2 rounded-l shadow flex-1 flex flex-col items-center justify-center transition-transform active:scale-95"
                  onClick={() => dispatch({ type: 'INCREMENT_BALL' })}
                  onContextMenu={(e) => { e.preventDefault(); dispatch({ type: 'DECREMENT_BALL' }); }}
                >
                  <span className="text-lg">{language === 'ja' ? 'ボール' : language === 'zh' ? '壞球' : 'BALL'}</span>
                </button>
                <button
                  className="bg-green-700 hover:bg-green-800 text-white font-bold px-4 rounded-r shadow flex items-center justify-center transition-transform active:scale-95 border-l border-green-800 text-xl"
                  onClick={() => dispatch({ type: 'DECREMENT_BALL' })}
                  title={language === 'en' ? 'Decrease Ball' : language === 'zh' ? '減少壞球' : 'ボール-1'}
                >
                  -
                </button>
              </div>
              <div className="flex flex-1 min-h-[44px]">
                <button 
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-2 rounded-l shadow flex-1 flex flex-col items-center justify-center transition-transform active:scale-95"
                  onClick={() => dispatch({ type: 'INCREMENT_STRIKE' })}
                  onContextMenu={(e) => { e.preventDefault(); dispatch({ type: 'DECREMENT_STRIKE' }); }}
                >
                  <span className="text-lg">{language === 'ja' ? 'ストライク' : language === 'zh' ? '好球' : 'STRIKE'}</span>
                </button>
                <button
                  className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold px-4 rounded-r shadow flex items-center justify-center transition-transform active:scale-95 border-l border-yellow-700 text-xl"
                  onClick={() => dispatch({ type: 'DECREMENT_STRIKE' })}
                  title={language === 'en' ? 'Decrease Strike' : language === 'zh' ? '減少好球' : 'ストライク-1'}
                >
                  -
                </button>
              </div>
              <div className="flex flex-1 min-h-[44px]">
                <button 
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-2 rounded-l shadow flex-1 flex flex-col items-center justify-center transition-transform active:scale-95"
                  onClick={() => dispatch({ type: 'INCREMENT_OUT' })}
                  onContextMenu={(e) => { e.preventDefault(); dispatch({ type: 'DECREMENT_OUT' }); }}
                >
                  <span className="text-lg">{language === 'ja' ? 'アウト' : language === 'zh' ? '出局' : 'OUT'}</span>
                </button>
                <button
                  className="bg-red-700 hover:bg-red-800 text-white font-bold px-4 rounded-r shadow flex items-center justify-center transition-transform active:scale-95 border-l border-red-800 text-xl"
                  onClick={() => dispatch({ type: 'DECREMENT_OUT' })}
                  title={language === 'en' ? 'Decrease Out' : language === 'zh' ? '減少出局' : 'アウト-1'}
                >
                  -
                </button>
              </div>
              <button 
                className="w-full flex-1 min-h-[44px] bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 rounded shadow transition-transform active:scale-95 text-lg"
                onClick={() => dispatch({ type: 'RESET_COUNT' })}
              >
                {language === 'en' ? 'Reset Count' : language === 'zh' ? '重置好壞球' : 'カウントリセット'}
              </button>
              
              <div className="flex gap-2 w-full flex-1 min-h-[44px]">
                <button
                  className="flex-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-semibold py-2 rounded text-xs flex items-center justify-center gap-2 border border-indigo-200 transition-transform active:scale-95"
                  onClick={() => dispatch({ type: 'PREVIOUS_BATTER' })}
                >
                  <User size={14} /> {language === 'en' ? 'Previous Batter' : language === 'zh' ? '上一位打者' : '前の打者へ'}
                </button>
                <button
                  className="flex-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-semibold py-2 rounded text-xs flex items-center justify-center gap-2 border border-indigo-200 transition-transform active:scale-95"
                  onClick={() => dispatch({ type: 'NEXT_BATTER' })}
                >
                  <User size={14} /> {language === 'en' ? 'Next Batter' : language === 'zh' ? '下一位打者' : '次の打者へ'}
                </button>
              </div>

              {/* HR & Undo */}
              <div className="flex gap-4 pt-2 items-stretch h-[60px] shrink-0">
                <div className="flex-1 flex justify-center items-center">
                  <div className="relative w-14 h-14 shrink-0 group">
                    {hrState === 'playing' && (
                        <svg className="absolute inset-[-4px] w-[64px] h-[64px] -rotate-90 pointer-events-none rounded-full" style={{ zIndex: 10 }}>
                            <circle cx="32" cy="32" r="30" stroke="transparent" strokeWidth="4" fill="none" />
                            <circle cx="32" cy="32" r="30" stroke="#a855f7" strokeWidth="4" fill="none" strokeDasharray="188.5" style={{ animation: 'hrProgressSvg 5s linear forwards' }} />
                        </svg>
                    )}
                    {hrState === 'locked' && (
                        <div className="absolute inset-[-4px] rounded-full border-4 border-purple-500 shadow-[0_0_10px_#a855f7]" style={{ zIndex: 10, pointerEvents: 'none' }} />
                    )}
                    <button
                        className={`absolute inset-0 bg-purple-600 hover:bg-purple-700 text-white font-black text-lg rounded-full shadow-lg transition-transform active:scale-95 flex items-center justify-center border-4 border-transparent ${hrState !== 'idle' ? 'animate-pulse' : ''}`}
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
                  </div>
                </div>
                <div className="flex-1 flex">
                  <button 
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded text-xs shadow-md flex items-center justify-center gap-1 transition-transform active:scale-95"
                    onClick={() => dispatch({ type: 'UNDO' })}
                    title={language === 'en' ? 'Undo (Ctrl+Z)' : language === 'zh' ? '復原 (Ctrl+Z)' : '元に戻す (Ctrl+Z)'}
                  >
                    <RotateCcw size={14} /> {language === 'en' ? 'Undo' : language === 'zh' ? '復原' : '元に戻す'}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Right Column (Event Controls) */}
            <div className="flex flex-col gap-2 h-full">
              <button 
                className="w-full flex-1 min-h-[44px] bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded shadow transition-transform active:scale-95 text-sm text-center"
                onClick={() => dispatch({ type: 'BATTER_OUT' })}
              >
                {language === 'en' ? 'Batter Out' : language === 'zh' ? '打者出局' : '打者アウト'}
              </button>
              <button 
                className="w-full flex-1 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded shadow transition-transform active:scale-95 text-sm text-center"
                onClick={() => dispatch({ type: 'SINGLE' })}
              >
                {language === 'en' ? '1B / Single' : language === 'zh' ? '一壘安' : 'シングル (1B)'}
              </button>
              <button 
                className="w-full flex-1 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded shadow transition-transform active:scale-95 text-sm text-center"
                onClick={() => dispatch({ type: 'DOUBLE' })}
              >
                {language === 'en' ? '2B / Double' : language === 'zh' ? '二壘安' : 'ツーベース (2B)'}
              </button>
              <button 
                className="w-full flex-1 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded shadow transition-transform active:scale-95 text-sm text-center"
                onClick={() => dispatch({ type: 'TRIPLE' })}
              >
                {language === 'en' ? '3B / Triple' : language === 'zh' ? '三壘安' : 'スリーベース (3B)'}
              </button>
              <div className="flex gap-2 w-full flex-1 min-h-[44px]">
                <button 
                  className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded shadow transition-transform active:scale-95 text-sm"
                  onClick={() => dispatch({ type: 'WALK' })}
                >
                  {language === 'en' ? 'BB / Walk' : language === 'zh' ? '保送 (Walk)' : '四死球 (Walk)'}
                </button>
                <button 
                  className="flex-[1] bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 rounded text-sm shadow-md transition-transform active:scale-95"
                  onClick={() => dispatch({ type: 'WILD_PITCH' })}
                  title={language === 'en' ? 'Wild Pitch / Passed Ball' : language === 'zh' ? '暴投 / 捕逸' : '暴投 / 捕逸'}
                >
                  {language === 'en' ? 'WP / PB' : language === 'zh' ? '暴投/捕逸' : '暴投/捕逸'}
                </button>
              </div>
              
              {/* Pitch +/- & Inning */}
              <div className="flex gap-2 pt-2 items-stretch h-[60px] shrink-0">
                <div className="flex flex-col gap-1 flex-1">
                  <button 
                    className="flex-1 bg-slate-500 hover:bg-slate-600 text-white rounded text-xs font-bold shadow-sm transition-transform active:scale-95"
                    onClick={() => dispatch({ type: 'INCREMENT_PLAYER_STAT', role: 'pitcher' })}
                  >
                    {language === 'en' ? 'Pitch +1' : language === 'zh' ? '用球數+1' : '球数+1'}
                  </button>
                  <button 
                    className="flex-1 bg-slate-500 hover:bg-slate-600 text-white rounded text-xs font-bold shadow-sm transition-transform active:scale-95"
                    onClick={() => dispatch({ type: 'DECREMENT_PLAYER_STAT', role: 'pitcher' })}
                  >
                    {language === 'en' ? 'Pitch -1' : language === 'zh' ? '用球數-1' : '球数-1'}
                  </button>
                </div>
                <div className="flex-1 flex items-center gap-1 bg-white border rounded px-1.5 shrink-0">
                   <span className="text-xs font-bold text-gray-500 shrink-0">INN:</span>
                   <input 
                      type="number" 
                      className="w-8 text-center font-bold border-none outline-none text-slate-900 bg-white"
                      value={state.inning}
                      onChange={(e) => dispatch({type: 'SET_INNING', value: parseInt(e.target.value) || 1})}
                    />
                    <button 
                      className="ml-auto bg-blue-800 hover:bg-blue-900 text-white font-bold px-2 py-1.5 rounded text-[10px] transition-transform active:scale-95"
                      onClick={() => dispatch({ type: 'NEXT_INNING' })}
                      title="Next Inning (Top/Bottom)"
                    >
                      {language === 'en' ? 'Next' : language === 'zh' ? '換局' : '次へ'}
                    </button>
                </div>
              </div>
            </div>
          </div>

            
            {/* Quick Matchup Editor */}
            <div className="bg-slate-100 p-2 rounded border border-slate-200 space-y-2">
              <h4 className="text-xs font-bold text-slate-600 flex items-center gap-1"><User size={12} /> {language === 'zh' ? '目前對決 (Current Matchup)' : language === 'en' ? 'Current Matchup' : '現在の対戦'}</h4>
              <div className="flex flex-col gap-2">
                {/* Active Batter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-green-700 w-8 shrink-0">{language === 'zh' ? '打者' : language === 'en' ? 'BAT' : '打者'}</span>
                  <input 
                    className="w-10 border rounded px-1 text-sm bg-white text-black" 
                    value={matchupDraft.batter?.number || ''} 
                    onChange={(e) => updateMatchupDraft('batter', 'number', e.target.value)} 
                    placeholder="#" 
                  />
                  <input 
                    className="flex-1 min-w-0 border rounded px-1 text-sm bg-white text-black" 
                    value={matchupDraft.batter?.name || ''} 
                    onChange={(e) => updateMatchupDraft('batter', 'name', e.target.value)} 
                    placeholder="Name" 
                  />
                  <select className="w-16 border rounded text-xs bg-white text-black shrink-0 outline-none" onChange={(e) => handleSelectBench('batter', e)} defaultValue="">
                    <option value="" disabled>{language === 'zh' ? '找板凳' : 'Bench'}</option>
                    {activeBatterTeamObj.bench.map(p => (
                      <option key={p.id} value={p.id}>{p.number} {p.name}</option>
                    ))}
                  </select>
                </div>
                {/* Active Pitcher */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-red-700 w-8 shrink-0">{language === 'zh' ? '投手' : language === 'en' ? 'PIT' : '投手'}</span>
                  <input 
                    className="w-10 border rounded px-1 text-sm bg-white text-black" 
                    value={matchupDraft.pitcher?.number || ''} 
                    onChange={(e) => updateMatchupDraft('pitcher', 'number', e.target.value)} 
                    placeholder="#" 
                  />
                  <input 
                    className="flex-1 min-w-0 border rounded px-1 text-sm bg-white text-black" 
                    value={matchupDraft.pitcher?.name || ''} 
                    onChange={(e) => updateMatchupDraft('pitcher', 'name', e.target.value)} 
                    placeholder="Name" 
                  />
                  <select className="w-16 border rounded text-xs bg-white text-black shrink-0 outline-none" onChange={(e) => handleSelectBench('pitcher', e)} defaultValue="">
                    <option value="" disabled>{language === 'zh' ? '找板凳' : 'Bench'}</option>
                    {activePitcherTeamObj.bench.map(p => (
                      <option key={p.id} value={p.id}>{p.number} {p.name}</option>
                    ))}
                  </select>
                </div>
                </div>
              <button onClick={handleUpdateMatchup} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded text-sm shadow transition-transform active:scale-95">
                {language === 'zh' ? '更新資訊' : language === 'en' ? 'Update Info' : '情報更新'}
              </button>
            </div>

      {/* Settings & Timer */}
          <div className="space-y-3">
             <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide border-b pb-1">{language === 'en' ? 'Settings & Timer' : language === 'zh' ? 'Settings & Timer 設定與計時器' : '設定とタイマー'}</h3>
             
             {/* Timer Controls */}
             <div className="bg-white p-2 rounded border shadow-sm flex flex-col space-y-2">
               <div className="flex justify-between items-center">
                 <label className="block text-xs text-gray-500 font-bold">{language === 'en' ? 'PITCH TIMER (Long Press Display to Reset)' : language === 'zh' ? 'PITCH TIMER 投球計時器 (長按重置)' : 'ピッチクロック (長押しでリセット)'}</label>
               </div>
               <div className="flex items-center space-x-2">
                  <input 
                    type="number" 
                    className="border p-1 rounded w-16 text-lg font-mono text-slate-900 bg-white"
                    value={state.timer}
                    onChange={(e) => dispatch({type: 'SET_TIMER', value: parseInt(e.target.value) || 0})}
                  />
                  <button 
                    className={`flex-1 p-2 rounded text-white flex items-center justify-center font-bold gap-2 ${state.isTimerRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                    onClick={() => dispatch({type: 'TOGGLE_TIMER'})}
                    title={state.isTimerRunning ? "Pause" : "Start"}
                  >
                    {state.isTimerRunning ? <Pause size={16} /> : <Play size={16} />}
                    {state.isTimerRunning ? "STOP" : "START"}
                  </button>
                  <button 
                     className="p-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 flex-shrink-0"
                     onClick={() => dispatch({type: 'RESET_TIMER'})}
                     title="Reset Timer"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button 
                    className={`p-2 rounded flex items-center justify-center border transition-colors flex-shrink-0 ${state.showTimer ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-white border-gray-300 text-gray-500'}`}
                    onClick={() => dispatch({type: 'TOGGLE_VISIBILITY', field: 'showTimer'})}
                    title={language === 'en' ? 'Hide Timer' : language === 'zh' ? '隱藏計時器' : 'タイマー非表示'}
                  >
                    {state.showTimer ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
               </div>
             </div>

             {/* Toggles */}
             <div className="grid grid-cols-1 gap-2">
                 {/* Display Mode Toggle */}
                 <div className={language === 'ja' ? "grid grid-cols-2 gap-1" : "flex space-x-1"}>
                   <button 
                    className={`flex-1 flex items-center justify-center space-x-1 px-2 py-2 rounded border text-xs transition-colors ${state.displayMode === 'default' ? 'bg-blue-100 border-blue-300 text-blue-800 font-bold' : 'bg-white border-gray-300 text-gray-500'}`}
                    onClick={() => dispatch({type: 'SET_DISPLAY_MODE', mode: 'default'})}
                  >
                     <LayoutTemplate size={12} />
                     <span>{language === 'en' ? 'Default' : language === 'zh' ? '預設' : '基本'}</span>
                  </button>
                  <button 
                    className={`flex-1 flex items-center justify-center space-x-1 px-2 py-2 rounded border text-xs transition-colors ${state.displayMode === 'lineup' ? 'bg-purple-100 border-purple-300 text-purple-800 font-bold' : 'bg-white border-gray-300 text-gray-500'}`}
                    onClick={() => dispatch({type: 'SET_DISPLAY_MODE', mode: 'lineup'})}
                  >
                     <User size={12} />
                     <span>{language === 'en' ? 'Lineup' : language === 'zh' ? '打線' : '打順'}</span>
                  </button>
                  <button 
                    className={`flex-1 flex items-center justify-center space-x-1 px-2 py-2 rounded border text-xs transition-colors ${state.displayMode === 'rhe' ? 'bg-emerald-100 border-emerald-300 text-emerald-800 font-bold' : 'bg-white border-gray-300 text-gray-500'}`}
                    onClick={() => dispatch({type: 'SET_DISPLAY_MODE', mode: 'rhe'})}
                  >
                     <Square size={12} />
                     <span>{language === 'en' ? 'RHE' : language === 'zh' ? '局間' : 'RHE'}</span>
                  </button>
                  <button 
                    className={`flex-1 flex items-center justify-center space-x-1 px-2 py-2 rounded border text-xs transition-colors ${state.displayMode === 'broadcast' ? 'bg-orange-100 border-orange-300 text-orange-800 font-bold' : 'bg-white border-gray-300 text-gray-500'}`}
                    onClick={() => dispatch({type: 'SET_DISPLAY_MODE', mode: 'broadcast'})}
                  >
                     <Tv size={12} />
                     <span>{language === 'en' ? 'Broadcast' : language === 'zh' ? '轉播' : '配信'}</span>
                  </button>
                 </div>

                {/* Show/Hide Player Stat Toggle */}
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    className={`flex items-center justify-center space-x-2 px-3 py-2 rounded border text-sm transition-colors ${state.showPlayerStat ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-white border-gray-300 text-gray-500'}`}
                    onClick={() => dispatch({type: 'TOGGLE_VISIBILITY', field: 'showPlayerStat'})}
                  >
                     {state.showPlayerStat ? <Eye size={14} /> : <EyeOff size={14} />}
                     <span>{language === 'en' ? 'Hide Stats' : language === 'zh' ? '隱藏數據' : '成績非表示'}</span>
                  </button>
                  <button 
                    className={`flex items-center justify-center space-x-2 px-3 py-2 rounded border text-sm transition-colors ${state.showCount ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-white border-gray-300 text-gray-500'}`}
                    onClick={() => dispatch({type: 'TOGGLE_VISIBILITY', field: 'showCount'})}
                  >
                     {state.showCount ? <Eye size={14} /> : <EyeOff size={14} />}
                     <span>{language === 'en' ? 'Hide Pitch Count' : language === 'zh' ? '隱藏投球數' : '球数非表示'}</span>
                  </button>
                  <button 
                    className={`flex items-center justify-center space-x-2 px-3 py-2 rounded border text-sm transition-colors ${state.showBatterInfo ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-white border-gray-300 text-gray-500'}`}
                    onClick={() => dispatch({type: 'TOGGLE_VISIBILITY', field: 'showBatterInfo'})}
                  >
                     {state.showBatterInfo ? <Eye size={14} /> : <EyeOff size={14} />}
                     <span>{language === 'en' ? 'Hide Batter' : language === 'zh' ? '隱藏打者' : '打者非表示'}</span>
                  </button>
                  <button 
                    className={`flex items-center justify-center space-x-2 px-3 py-2 rounded border text-sm transition-colors ${state.showPitcherInfo ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-white border-gray-300 text-gray-500'}`}
                    onClick={() => dispatch({type: 'TOGGLE_VISIBILITY', field: 'showPitcherInfo'})}
                  >
                     {state.showPitcherInfo ? <Eye size={14} /> : <EyeOff size={14} />}
                     <span>{language === 'en' ? 'Hide Pitcher' : language === 'zh' ? '隱藏投手' : '投手非表示'}</span>
                  </button>
                </div>
             </div>
             
             <div className="mt-4 pt-4 border-t w-full">
               <h4 className="font-semibold text-gray-600 text-xs uppercase mb-2">{language === 'en' ? 'Broadcast Mode Settings' : language === 'zh' ? '轉播模式設定' : '配信モード設定'}</h4>
               <button
                 onClick={() => dispatch({ type: 'TOGGLE_ADJUSTMENT_MODE' })}
                 className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
                   state.isAdjustmentMode 
                     ? 'bg-blue-600 text-white shadow-inner' 
                     : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                 }`}
               >
                 {state.isAdjustmentMode ? <Check size={16} /> : <Settings size={16} />}
                 {state.isAdjustmentMode 
                   ? (language === 'en' ? 'Finish Adjustment' : language === 'zh' ? '結束調整' : '調整終了') 
                   : (language === 'en' ? 'Adjustment Mode' : language === 'zh' ? '調整模式' : '調整モード')}
               </button>
               {state.isAdjustmentMode && (
                  <div className="mt-3 space-y-2 bg-slate-50 p-2.5 rounded border text-xs">
                     <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                        <span className="font-semibold text-slate-700">{language === "en" ? "Font Sizes" : language === "zh" ? "字體大小設定" : "フォントサイズ設定"}</span>
                        <button
                          onClick={() => {
                            dispatch({ type: "UPDATE_META", field: "broadcastTeamNameSize", value: 24 });
                            dispatch({ type: "UPDATE_META", field: "broadcastPlayerNameSize", value: 20 });
                            dispatch({ type: "UPDATE_META", field: "broadcastScoreSize", value: 30 });
                            dispatch({ type: "UPDATE_META", field: "broadcastTimerSize", value: 24 });
                            dispatch({ type: "UPDATE_META", field: "broadcastInningSize", value: 24 });
                            dispatch({ type: "UPDATE_META", field: "broadcastLogoSize", value: 40 });
                            dispatch({ type: "UPDATE_META", field: "broadcastCountGap", value: 2 });
                          }}
                          className="px-1.5 py-0.5 text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-700 rounded flex items-center gap-1 transition-colors"
                          title={language === "en" ? "Reset all font sizes to default" : language === "zh" ? "重置全部字體與元件大小為默認" : "所有的フォントサイズをデフォルトに戻す"}
                        >
                          <RotateCcw size={10} />
                          <span>{language === "en" ? "Reset All" : language === "zh" ? "重置全部" : "全重置"}</span>
                        </button>
                     </div>

                     <div className="flex items-center justify-between gap-1.5">
                        <span className="text-slate-600 whitespace-nowrap min-w-[60px]">{language === "en" ? "Logo Size" : language === "zh" ? "隊徽大小" : "ロゴサイズ"}</span>
                        <div className="flex items-center gap-1 flex-1 justify-end">
                          <input type="range" min="16" max="80" value={state.meta.broadcastLogoSize ?? 40} onChange={(e) => dispatch({ type: "UPDATE_META", field: "broadcastLogoSize", value: parseInt(e.target.value) })} className="w-16 sm:w-20 accent-blue-600" />
                          <span className="w-5 text-right font-mono text-[11px] text-slate-500 shrink-0">{state.meta.broadcastLogoSize ?? 40}</span>
                          <button
                            onClick={() => dispatch({ type: "UPDATE_META", field: "broadcastLogoSize", value: 40 })}
                            className="px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded flex items-center gap-0.5 shrink-0 transition-colors"
                            title={language === "en" ? "Reset to default (40)" : language === "zh" ? "重置為默認 (40)" : "默認に戻す (40)"}
                          >
                            <RotateCcw size={9} />
                            <span>{language === "en" ? "Reset" : language === "zh" ? "重置為默認" : "デフォルト"}</span>
                          </button>
                        </div>
                     </div>

                     <div className="flex items-center justify-between gap-1.5">
                        <span className="text-slate-600 whitespace-nowrap min-w-[60px]">{language === "en" ? "Count Spacing" : language === "zh" ? "球數間距" : "カウント間隔"}</span>
                        <div className="flex items-center gap-1 flex-1 justify-end">
                          <input type="range" min="-12" max="24" value={state.meta.broadcastCountGap ?? 2} onChange={(e) => dispatch({ type: "UPDATE_META", field: "broadcastCountGap", value: parseInt(e.target.value) })} className="w-16 sm:w-20 accent-blue-600" />
                          <span className="w-5 text-right font-mono text-[11px] text-slate-500 shrink-0">{state.meta.broadcastCountGap ?? 2}</span>
                          <button
                            onClick={() => dispatch({ type: "UPDATE_META", field: "broadcastCountGap", value: 2 })}
                            className="px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded flex items-center gap-0.5 shrink-0 transition-colors"
                            title={language === "en" ? "Reset to default (2)" : language === "zh" ? "重置為默認 (2)" : "默認に戻す (2)"}
                          >
                            <RotateCcw size={9} />
                            <span>{language === "en" ? "Reset" : language === "zh" ? "重置為默認" : "デフォルト"}</span>
                          </button>
                        </div>
                     </div>

                     <div className="flex items-center justify-between gap-1.5">
                        <span className="text-slate-600 whitespace-nowrap min-w-[60px]">{language === "en" ? "Team Name Size" : language === "zh" ? "隊名大小" : "チーム名サイズ"}</span>
                        <div className="flex items-center gap-1 flex-1 justify-end">
                          <input type="range" min="12" max="64" value={state.meta.broadcastTeamNameSize ?? 24} onChange={(e) => dispatch({ type: "UPDATE_META", field: "broadcastTeamNameSize", value: parseInt(e.target.value) })} className="w-16 sm:w-20 accent-blue-600" />
                          <span className="w-5 text-right font-mono text-[11px] text-slate-500 shrink-0">{state.meta.broadcastTeamNameSize ?? 24}</span>
                          <button
                            onClick={() => dispatch({ type: "UPDATE_META", field: "broadcastTeamNameSize", value: 24 })}
                            className="px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded flex items-center gap-0.5 shrink-0 transition-colors"
                            title={language === "en" ? "Reset to default (24)" : language === "zh" ? "重置為默認 (24)" : "默認に戻す (24)"}
                          >
                            <RotateCcw size={9} />
                            <span>{language === "en" ? "Reset" : language === "zh" ? "重置為默認" : "デフォルト"}</span>
                          </button>
                        </div>
                     </div>

                     <div className="flex items-center justify-between gap-1.5">
                        <span className="text-slate-600 whitespace-nowrap min-w-[60px]">{language === "en" ? "Player Name Size" : language === "zh" ? "球員名大小" : "選手名サイズ"}</span>
                        <div className="flex items-center gap-1 flex-1 justify-end">
                          <input type="range" min="10" max="48" value={state.meta.broadcastPlayerNameSize ?? 20} onChange={(e) => dispatch({ type: "UPDATE_META", field: "broadcastPlayerNameSize", value: parseInt(e.target.value) })} className="w-16 sm:w-20 accent-blue-600" />
                          <span className="w-5 text-right font-mono text-[11px] text-slate-500 shrink-0">{state.meta.broadcastPlayerNameSize ?? 20}</span>
                          <button
                            onClick={() => dispatch({ type: "UPDATE_META", field: "broadcastPlayerNameSize", value: 20 })}
                            className="px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded flex items-center gap-0.5 shrink-0 transition-colors"
                            title={language === "en" ? "Reset to default (20)" : language === "zh" ? "重置為默認 (20)" : "默認に戻す (20)"}
                          >
                            <RotateCcw size={9} />
                            <span>{language === "en" ? "Reset" : language === "zh" ? "重置為默認" : "デフォルト"}</span>
                          </button>
                        </div>
                     </div>

                     <div className="flex items-center justify-between gap-1.5">
                        <span className="text-slate-600 whitespace-nowrap min-w-[60px]">{language === "en" ? "Score Size" : language === "zh" ? "分數大小" : "スコアサイズ"}</span>
                        <div className="flex items-center gap-1 flex-1 justify-end">
                          <input type="range" min="16" max="72" value={state.meta.broadcastScoreSize ?? 30} onChange={(e) => dispatch({ type: "UPDATE_META", field: "broadcastScoreSize", value: parseInt(e.target.value) })} className="w-16 sm:w-20 accent-blue-600" />
                          <span className="w-5 text-right font-mono text-[11px] text-slate-500 shrink-0">{state.meta.broadcastScoreSize ?? 30}</span>
                          <button
                            onClick={() => dispatch({ type: "UPDATE_META", field: "broadcastScoreSize", value: 30 })}
                            className="px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded flex items-center gap-0.5 shrink-0 transition-colors"
                            title={language === "en" ? "Reset to default (30)" : language === "zh" ? "重置為默認 (30)" : "默認に戻す (30)"}
                          >
                            <RotateCcw size={9} />
                            <span>{language === "en" ? "Reset" : language === "zh" ? "重置為默認" : "デフォルト"}</span>
                          </button>
                        </div>
                     </div>

                     <div className="flex items-center justify-between gap-1.5">
                        <span className="text-slate-600 whitespace-nowrap min-w-[60px]">{language === "en" ? "Timer Size" : language === "zh" ? "計時器大小" : "タイマーサイズ"}</span>
                        <div className="flex items-center gap-1 flex-1 justify-end">
                          <input type="range" min="12" max="64" value={state.meta.broadcastTimerSize ?? 24} onChange={(e) => dispatch({ type: "UPDATE_META", field: "broadcastTimerSize", value: parseInt(e.target.value) })} className="w-16 sm:w-20 accent-blue-600" />
                          <span className="w-5 text-right font-mono text-[11px] text-slate-500 shrink-0">{state.meta.broadcastTimerSize ?? 24}</span>
                          <button
                            onClick={() => dispatch({ type: "UPDATE_META", field: "broadcastTimerSize", value: 24 })}
                            className="px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded flex items-center gap-0.5 shrink-0 transition-colors"
                            title={language === "en" ? "Reset to default (24)" : language === "zh" ? "重置為默認 (24)" : "默認に戻す (24)"}
                          >
                            <RotateCcw size={9} />
                            <span>{language === "en" ? "Reset" : language === "zh" ? "重置為默認" : "デフォルト"}</span>
                          </button>
                        </div>
                     </div>

                     <div className="flex items-center justify-between gap-1.5">
                        <span className="text-slate-600 whitespace-nowrap min-w-[60px]">{language === "en" ? "Inning Size" : language === "zh" ? "局數大小" : "イニングサイズ"}</span>
                        <div className="flex items-center gap-1 flex-1 justify-end">
                          <input type="range" min="12" max="64" value={state.meta.broadcastInningSize ?? 24} onChange={(e) => dispatch({ type: "UPDATE_META", field: "broadcastInningSize", value: parseInt(e.target.value) })} className="w-16 sm:w-20 accent-blue-600" />
                          <span className="w-5 text-right font-mono text-[11px] text-slate-500 shrink-0">{state.meta.broadcastInningSize ?? 24}</span>
                          <button
                            onClick={() => dispatch({ type: "UPDATE_META", field: "broadcastInningSize", value: 24 })}
                            className="px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded flex items-center gap-0.5 shrink-0 transition-colors"
                            title={language === "en" ? "Reset to default (24)" : language === "zh" ? "重置為默認 (24)" : "默認に戻す (24)"}
                          >
                            <RotateCcw size={9} />
                            <span>{language === "en" ? "Reset" : language === "zh" ? "重置為默認" : "デフォルト"}</span>
                          </button>
                        </div>
                     </div>
                     <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-200">
                        <span className="text-slate-600 whitespace-nowrap min-w-[60px]">{language === "en" ? "Player Number" : language === "zh" ? "球員背號顯示" : "背番号表示"}</span>
                        <select
                          value={state.meta.broadcastPlayerNumberStyle || "normal"}
                          onChange={(e) => dispatch({ type: "UPDATE_META", field: "broadcastPlayerNumberStyle", value: e.target.value })}
                          className="w-full max-w-[120px] bg-white border border-slate-300 text-slate-700 text-[11px] rounded px-1.5 py-0.5 outline-none focus:border-blue-500"
                        >
                          <option value="normal">{language === "en" ? "Show" : language === "zh" ? "正常顯示" : "通常"}</option>
                          <option value="gray">{language === "en" ? "Gray" : language === "zh" ? "灰色顯示" : "グレー"}</option>
                          <option value="hidden">{language === "en" ? "Hidden" : language === "zh" ? "不顯示" : "非表示"}</option>
                        </select>
                     </div>
                  </div>
                )}
             </div>
          </div>
        </div>
        </div>
        )}

        {activeTab === 'info' && (
          <div className="flex flex-col gap-6">
            {/* Bottom: Team & Lineup Config */}
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b pb-1">
                <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Team Configuration</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => dispatch({ type: 'SWAP_TEAMS' })}
                    className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold py-1 px-2 rounded shadow transition-colors"
                  >
                    <RefreshCw size={12} /> {language === 'en' ? 'Swap Teams' : language === 'zh' ? '主客隊交換' : '攻守交替'}
                  </button>
                  <button 
                    onClick={() => dispatch({ type: 'RESET_TEAM_SETTINGS' })}
                    className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold py-1 px-2 rounded shadow transition-colors"
                  >
                    <RotateCcw size={12} /> {language === 'en' ? 'Reset Teams' : language === 'zh' ? '重置隊伍設定' : 'チーム設定リセット'}
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {state.meta.swapSides ? (
                  <>
                    <TeamEditor key="home" teamKey="home" state={state} dispatch={dispatch} language={language as 'en' | 'zh' | 'ja'} />
                    <TeamEditor key="away" teamKey="away" state={state} dispatch={dispatch} language={language as 'en' | 'zh' | 'ja'} />
                  </>
                ) : (
                  <>
                    <TeamEditor key="away" teamKey="away" state={state} dispatch={dispatch} language={language as 'en' | 'zh' | 'ja'} />
                    <TeamEditor key="home" teamKey="home" state={state} dispatch={dispatch} language={language as 'en' | 'zh' | 'ja'} />
                  </>
                )}
              </div>
            </div>

            {/* Game Info Section */}
            <div className="space-y-3">
              <div className="mt-4">
                <h4 className="font-semibold text-gray-600 text-xs uppercase mb-2 flex items-center gap-2"><Tv size={14}/> {language === 'en' ? 'Game Info' : language === 'zh' ? 'Game Info 比賽資訊' : '試合情報'}</h4>
                <div className="flex flex-col gap-2">
                  {(state.meta.gameInfos || []).map((info, idx) => (
                    <div key={idx} className="flex items-center gap-1 bg-gray-100 rounded border p-1 w-full">
                      <input 
                        className="bg-transparent text-sm text-slate-900 flex-1 outline-none px-2 min-w-0" 
                        value={info}
                        onChange={(e) => {
                          const newInfos = [...(state.meta.gameInfos || [])];
                          newInfos[idx] = e.target.value;
                          updateMeta('gameInfos', newInfos);
                        }}
                        placeholder={language === 'en' ? 'e.g. Bottom 9th, 2 Outs' : language === 'zh' ? '例如：九局下, 2出局' : '例：9回裏, 2アウト'}
                      />
                      <button 
                        onClick={() => {
                          const newInfos = [...(state.meta.gameInfos || [])];
                          newInfos.splice(idx, 1);
                          updateMeta('gameInfos', newInfos);
                        }}
                        className="text-red-500 hover:text-red-700 p-1 shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => {
                      const newInfos = [...(state.meta.gameInfos || []), 'New Info'];
                      updateMeta('gameInfos', newInfos);
                    }}
                    className="flex items-center justify-center gap-1 text-sm bg-blue-50 text-blue-600 px-2 py-1.5 rounded border border-blue-200 hover:bg-blue-100 border-dashed"
                  >
                    <Plus size={14} /> Add Info
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
