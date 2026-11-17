import React, { useState, useEffect, useMemo } from 'react';
import { ActionType, GameState, Player, RunnerDestination, RunnerMovement, RunnerOutcomeInput } from '../types';
import { X, Check, RotateCcw, AlertTriangle, ArrowRight } from 'lucide-react';

export const formatRunnerMovement = (
  m: RunnerMovement,
  lang: 'en' | 'zh' | 'ja' = 'zh'
): string => {
  const numPart = m.playerNumber ? ` (#${m.playerNumber})` : '';
  if (lang === 'en') {
    const fromLabel =
      m.fromBase === 1 ? '1B Runner' : m.fromBase === 2 ? '2B Runner' : m.fromBase === 3 ? '3B Runner' : 'Batter';
    const toLabel =
      m.toBase === 4
        ? 'scored'
        : m.toBase === 'out'
          ? 'out on base'
          : m.toBase === 3
            ? m.fromBase === 3 ? 'held at 3B' : 'to 3B'
            : m.toBase === 2
              ? m.fromBase === 2 ? 'held at 2B' : 'to 2B'
              : m.fromBase === 1 ? 'held at 1B' : 'to 1B';
    return `${fromLabel} ${m.playerName}${numPart} ${toLabel}`;
  }

  if (lang === 'ja') {
    const fromLabel =
      m.fromBase === 1 ? '一塁走者' : m.fromBase === 2 ? '二塁走者' : m.fromBase === 3 ? '三塁走者' : '打者';
    const toLabel =
      m.toBase === 4
        ? '生還'
        : m.toBase === 'out'
          ? 'アウト'
          : m.toBase === 3
            ? m.fromBase === 3 ? '三塁残留' : '三塁へ'
            : m.toBase === 2
              ? m.fromBase === 2 ? '二塁残留' : '二塁へ'
              : m.fromBase === 1 ? '一塁残留' : '一塁へ';
    return `${fromLabel} ${m.playerName}${numPart} ${toLabel}`;
  }

  const fromLabel =
    m.fromBase === 1 ? '一壘跑者' : m.fromBase === 2 ? '二壘跑者' : m.fromBase === 3 ? '三壘跑者' : '打者';
  const toLabel =
    m.toBase === 4
      ? '回本壘得分'
      : m.toBase === 'out'
        ? '出局'
        : m.toBase === 3
          ? m.fromBase === 3 ? '留在三壘' : '上三壘'
          : m.toBase === 2
            ? m.fromBase === 2 ? '留在二壘' : '上二壘'
            : m.fromBase === 1 ? '留在一壘' : '上一壘';
  return `${fromLabel} ${m.playerName}${numPart} ${toLabel}`;
};

export const needsRunnerPrompt = (action: ActionType, state: GameState): boolean => {
  if (!state.meta?.originalBaseballMode) return false;
  if ('runnerOutcomes' in action && action.runnerOutcomes) return false;

  const hasRunners = state.bases[0] || state.bases[1] || state.bases[2];
  if (!hasRunners) return false;

  switch (action.type) {
    case 'SINGLE':
    case 'DOUBLE':
    case 'TRIPLE':
    case 'FIELDERS_CHOICE':
    case 'WILD_PITCH':
      return true;
    case 'SAC_FLY':
    case 'SAC_BUNT':
    case 'DOUBLE_PLAY':
      return state.outs < 2;
    case 'BATTER_OUT': {
      const outType = action.outType || '';
      if (outType === '三振' || outType.includes('三振') || outType === 'SO' || outType === 'K') {
        return false;
      }
      return state.outs < 2;
    }
    case 'WALK': {
      const walkType = action.walkType || '四壞';
      // Walks / HBP / IBB never prompt; only Errors & Dropped 3rd Strikes prompt when runners are on base
      return walkType === '失誤' || walkType === '不死三振' || walkType === 'K+WP' || walkType === 'K+PB';
    }
    default:
      return false;
  }
};

interface RunnerSlot {
  fromBase: 1 | 2 | 3;
  playerId?: string;
  playerName: string;
  playerNumber?: string;
}

interface RunnerResolutionModalProps {
  action: ActionType | null;
  state: GameState;
  language?: 'en' | 'zh' | 'ja';
  onConfirm: (resolvedAction: ActionType) => void;
  onCancel: () => void;
}

const findPlayerInTeam = (
  lineup: Player[],
  bench: Player[],
  id?: string | null
): Player | undefined => {
  if (!id) return undefined;
  return (
    lineup.find(p => p.id === id) ||
    bench.find(p => p.id === id) ||
    lineup.flatMap(p => p.previousPlayers || []).find(pp => pp.id === id)
  );
};

const getBatterDestination = (action: ActionType): 1 | 2 | 3 | 'out' => {
  switch (action.type) {
    case 'SINGLE':
    case 'WALK':
    case 'FIELDERS_CHOICE':
      return 1;
    case 'DOUBLE':
      return 2;
    case 'TRIPLE':
      return 3;
    default:
      return 'out';
  }
};

const getDefaultDestinations = (
  action: ActionType,
  bases: [boolean, boolean, boolean]
): Partial<Record<1 | 2 | 3, RunnerDestination>> => {
  switch (action.type) {
    case 'SINGLE':
    case 'SAC_BUNT':
    case 'WILD_PITCH':
      return { 1: 2, 2: 3, 3: 4 };
    case 'DOUBLE':
      return { 1: 3, 2: 4, 3: 4 };
    case 'TRIPLE':
      return { 1: 4, 2: 4, 3: 4 };
    case 'SAC_FLY':
      return { 1: 1, 2: 2, 3: 4 };
    case 'DOUBLE_PLAY':
    case 'FIELDERS_CHOICE': {
      const outBase = bases[0] ? 1 : bases[1] ? 2 : bases[2] ? 3 : null;
      return {
        1: outBase === 1 ? 'out' : (action.type === 'FIELDERS_CHOICE' ? 2 : 1),
        2: outBase === 2 ? 'out' : 2,
        3: outBase === 3 ? 'out' : 3,
      };
    }
    case 'WALK':
      return {
        1: bases[0] ? 2 : 1,
        2: bases[0] && bases[1] ? 3 : 2,
        3: bases[0] && bases[1] && bases[2] ? 4 : 3,
      };
    default:
      return { 1: 1, 2: 2, 3: 3 };
  }
};

const getPlayLabel = (action: ActionType, lang: 'en' | 'zh' | 'ja'): string => {
  switch (action.type) {
    case 'SINGLE':
      return lang === 'en' ? 'Single (1B)' : lang === 'ja' ? '単打 (1B)' : '一壘安打';
    case 'DOUBLE':
      return lang === 'en' ? 'Double (2B)' : lang === 'ja' ? '二塁打 (2B)' : '二壘安打';
    case 'TRIPLE':
      return lang === 'en' ? 'Triple (3B)' : lang === 'ja' ? '三塁打 (3B)' : '三壘安打';
    case 'SAC_FLY':
      return lang === 'en' ? 'Sacrifice Fly' : lang === 'ja' ? '犠牲フライ' : '高飛犧牲打';
    case 'SAC_BUNT':
      return lang === 'en' ? 'Sacrifice Bunt' : lang === 'ja' ? '犠牲バント' : '犧牲短打';
    case 'DOUBLE_PLAY':
      return lang === 'en' ? 'Double Play' : lang === 'ja' ? '併殺打' : '雙殺打';
    case 'FIELDERS_CHOICE':
      return lang === 'en' ? "Fielder's Choice" : lang === 'ja' ? '野手選択' : '野手選擇';
    case 'BATTER_OUT':
      return action.outType || (lang === 'en' ? 'Batter Out' : '打者出局');
    case 'WALK':
      return action.walkType || '上壘';
    case 'WILD_PITCH':
      return action.subType === 'BK'
        ? '投手犯規 (BK)'
        : action.subType === 'PB'
          ? '捕逸 (PB)'
          : '暴投 (WP)';
    default:
      return 'Play';
  }
};

export const RunnerResolutionModal: React.FC<RunnerResolutionModalProps> = ({
  action,
  state,
  language = 'zh',
  onConfirm,
  onCancel,
}) => {
  const battingTeam = state.isTop ? state.awayTeam : state.homeTeam;
  const batter = battingTeam.lineup[battingTeam.currentBatterIndex];

  const runnerSlots = useMemo<RunnerSlot[]>(() => {
    if (!action) return [];
    const rawIds = state.baseRunners || [null, null, null];
    const usedIds = new Set<string>(rawIds.filter((id): id is string => Boolean(id)));
    const slots: RunnerSlot[] = [];

    // Order lead runner first: 3B -> 2B -> 1B
    for (const baseIdx of [2, 1, 0] as const) {
      if (!state.bases[baseIdx]) continue;
      let runnerId = rawIds[baseIdx];
      let player = findPlayerInTeam(battingTeam.lineup, battingTeam.bench, runnerId);

      if (!player) {
        const count = battingTeam.lineup.length;
        for (let offset = 1; offset < count; offset++) {
          const candidateIdx = (battingTeam.currentBatterIndex - offset + count) % count;
          const candidate = battingTeam.lineup[candidateIdx];
          if (candidate && !usedIds.has(candidate.id)) {
            player = candidate;
            runnerId = candidate.id;
            usedIds.add(candidate.id);
            break;
          }
        }
      }

      slots.push({
        fromBase: (baseIdx + 1) as 1 | 2 | 3,
        playerId: runnerId || undefined,
        playerName: player?.name || (language === 'zh' ? '壘上跑者' : 'Runner'),
        playerNumber: player?.number || '',
      });
    }
    return slots;
  }, [action, state.bases, state.baseRunners, battingTeam.lineup, battingTeam.bench, battingTeam.currentBatterIndex, language]);

  const batterDest = action ? getBatterDestination(action) : 'out';
  const defaultMap = useMemo(
    () => (action ? getDefaultDestinations(action, state.bases) : {}),
    [action, state.bases]
  );

  const [destinations, setDestinations] = useState<Partial<Record<1 | 2 | 3, RunnerDestination>>>({});
  const [creditRbi, setCreditRbi] = useState<boolean>(true);

  useEffect(() => {
    if (!action) return;
    setDestinations(defaultMap);
    const isNoRbiByDefault =
      action.type === 'WILD_PITCH' ||
      action.type === 'DOUBLE_PLAY' ||
      (action.type === 'WALK' &&
        (action.walkType === '失誤' ||
          action.walkType === '不死三振' ||
          action.walkType === 'K+WP' ||
          action.walkType === 'K+PB'));
    setCreditRbi(!isNoRbiByDefault);
  }, [action, defaultMap]);

  const { runsScored, runnerOuts, collisionBase } = useMemo(() => {
    let runs = 0;
    let outs = 0;
    const baseCount: Record<number, number> = {};
    if (batterDest === 1 || batterDest === 2 || batterDest === 3) {
      baseCount[batterDest] = 1;
    }

    for (const slot of runnerSlots) {
      const dest = destinations[slot.fromBase] ?? slot.fromBase;
      if (dest === 4) {
        runs += 1;
      } else if (dest === 'out') {
        outs += 1;
      } else {
        baseCount[dest] = (baseCount[dest] || 0) + 1;
      }
    }

    const collision = ([1, 2, 3] as const).find(b => (baseCount[b] || 0) > 1) || null;
    return { runsScored: runs, runnerOuts: outs, collisionBase: collision };
  }, [runnerSlots, destinations, batterDest]);

  const batterOutAdded =
    action &&
    (action.type === 'BATTER_OUT' ||
      action.type === 'SAC_FLY' ||
      action.type === 'SAC_BUNT' ||
      action.type === 'DOUBLE_PLAY')
      ? 1
      : 0;
  const totalNewOuts = state.outs + batterOutAdded + runnerOuts;
  const willEndInning = totalNewOuts >= 3;

  const handleConfirm = () => {
    if (!action || collisionBase !== null) return;
    const runnerOutcomes: RunnerOutcomeInput[] = runnerSlots.map(slot => ({
      fromBase: slot.fromBase,
      playerId: slot.playerId,
      toBase: destinations[slot.fromBase] ?? slot.fromBase,
    }));

    if (action.type === 'WILD_PITCH') {
      onConfirm({ ...action, runnerOutcomes });
      return;
    }

    const rbiOverride = runsScored > 0 ? (creditRbi ? runsScored : 0) : 0;
    onConfirm({
      ...(action as any),
      runnerOutcomes,
      rbiOverride,
    });
  };

  useEffect(() => {
    if (!action) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Enter' && collisionBase === null) {
        e.preventDefault();
        handleConfirm();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  if (!action) return null;

  const baseName = (b: 1 | 2 | 3) =>
    language === 'en' ? `${b}B` : language === 'ja' ? `${b === 1 ? '一' : b === 2 ? '二' : '三'}塁` : `${b === 1 ? '一' : b === 2 ? '二' : '三'}壘`;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div
        className="bg-slate-900 border-2 border-amber-500/60 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black">
                {language === 'en' ? 'Original Baseball Mode' : language === 'ja' ? 'リアル野球モード' : '原始棒球模式'}
              </span>
              <span className="text-sm sm:text-base font-black text-white truncate">
                {getPlayLabel(action, language)}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
              {language === 'en'
                ? `Batter: ${batter?.name || 'Batter'} ${batter?.number ? `#${batter.number}` : ''} → ${batterDest === 'out' ? 'Out' : baseName(batterDest)}`
                : `打者：${batter?.name || '打者'} ${batter?.number ? `#${batter.number}` : ''} → ${batterDest === 'out' ? '出局' : `上${baseName(batterDest)}`}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="取消 (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Runners List */}
        <div className="p-4 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              {language === 'en'
                ? 'Select where each base runner went:'
                : '請確認目前壘上每位跑者的去向：'}
            </span>
            <button
              type="button"
              onClick={() => setDestinations(defaultMap)}
              className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 cursor-pointer"
            >
              <RotateCcw size={11} />
              <span>{language === 'en' ? 'Reset Default' : '套用預設'}</span>
            </button>
          </div>

          {runnerSlots.map(slot => {
            const currentDest = destinations[slot.fromBase] ?? slot.fromBase;
            const options: { value: RunnerDestination; label: string; disabled?: boolean; tone: 'stay' | 'advance' | 'score' | 'out' }[] = [];

            if (slot.fromBase <= 1) {
              options.push({
                value: 1,
                label: language === 'en' ? 'Stay 1B' : '留在一壘',
                disabled: batterDest === 1,
                tone: 'stay',
              });
            }
            if (slot.fromBase <= 2) {
              options.push({
                value: 2,
                label: slot.fromBase === 2 ? (language === 'en' ? 'Stay 2B' : '留在二壘') : (language === 'en' ? 'To 2B' : '上二壘'),
                disabled: batterDest === 2,
                tone: slot.fromBase === 2 ? 'stay' : 'advance',
              });
            }
            if (slot.fromBase <= 3) {
              options.push({
                value: 3,
                label: slot.fromBase === 3 ? (language === 'en' ? 'Stay 3B' : '留在三壘') : (language === 'en' ? 'To 3B' : '上三壘'),
                disabled: batterDest === 3,
                tone: slot.fromBase === 3 ? 'stay' : 'advance',
              });
            }
            options.push({
              value: 4,
              label: language === 'en' ? 'Scored' : '回本壘得分',
              tone: 'score',
            });
            options.push({
              value: 'out',
              label: language === 'en' ? 'Out' : '出局',
              tone: 'out',
            });

            return (
              <div
                key={slot.fromBase}
                className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black shrink-0">
                      {baseName(slot.fromBase)}跑者
                    </span>
                    <span className="font-bold text-white text-sm truncate">
                      {slot.playerName}
                    </span>
                    {slot.playerNumber && (
                      <span className="text-xs font-mono text-slate-400 shrink-0">
                        #{slot.playerNumber}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 shrink-0">
                    <ArrowRight size={12} className="text-amber-400" />
                    <span className={
                      currentDest === 4
                        ? 'text-emerald-400'
                        : currentDest === 'out'
                          ? 'text-rose-400'
                          : 'text-sky-300'
                    }>
                      {options.find(o => o.value === currentDest)?.label}
                    </span>
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {options.map(opt => {
                    const isSelected = currentDest === opt.value;
                    let style = 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700';
                    if (opt.disabled) {
                      style = 'bg-slate-900/40 text-slate-600 border-slate-800/60 cursor-not-allowed opacity-45';
                    } else if (isSelected) {
                      if (opt.tone === 'score') {
                        style = 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-950/60 ring-2 ring-emerald-400/30';
                      } else if (opt.tone === 'out') {
                        style = 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-950/60 ring-2 ring-rose-400/30';
                      } else if (opt.tone === 'advance') {
                        style = 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-950/60 ring-2 ring-blue-400/30';
                      } else {
                        style = 'bg-slate-600 text-white border-slate-400 shadow-sm';
                      }
                    }

                    return (
                      <button
                        key={String(opt.value)}
                        type="button"
                        disabled={opt.disabled}
                        onClick={() =>
                          setDestinations(prev => ({ ...prev, [slot.fromBase]: opt.value }))
                        }
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer active:scale-95 ${style}`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {collisionBase !== null && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/60 text-rose-200 text-xs font-bold">
              <AlertTriangle size={16} className="text-rose-400 shrink-0" />
              <span>
                {language === 'en'
                  ? `Multiple runners/batter cannot occupy ${baseName(collisionBase)} at the same time.`
                  : `不能有兩位球員同時停留在${baseName(collisionBase)}，請調整跑者去向。`}
              </span>
            </div>
          )}

          {/* Live Summary & RBI option */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`font-bold ${runsScored > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                {language === 'en' ? `Runs: +${runsScored}` : `得分：+${runsScored}`}
              </span>
              <span className={`font-bold ${willEndInning ? 'text-amber-300' : 'text-slate-300'}`}>
                {willEndInning
                  ? (language === 'en' ? '3 Outs → Next Half Inning' : '達成 3 出局 → 自動換局')
                  : (language === 'en' ? `Outs: ${totalNewOuts}` : `出局數：${totalNewOuts} 出局`)}
              </span>
            </div>

            {runsScored > 0 && action.type !== 'WILD_PITCH' && (
              <label className="flex items-center gap-1.5 text-slate-200 font-bold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={creditRbi}
                  onChange={e => setCreditRbi(e.target.checked)}
                  className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                />
                <span>
                  {language === 'en' ? `Credit ${runsScored} RBI` : `計入打者打點 (+${runsScored} RBI)`}
                </span>
              </label>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            {language === 'en' ? 'Cancel' : '取消'}
          </button>
          <button
            type="button"
            disabled={collisionBase !== null}
            onClick={handleConfirm}
            className={`px-5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
              collisionBase !== null
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/50 cursor-pointer active:scale-95'
            }`}
          >
            <Check size={15} />
            <span>{language === 'en' ? 'Confirm Play' : '確認記錄 (Enter)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
