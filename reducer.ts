import { GameState, ActionType, Player, Team } from './types';
import { INITIAL_STATE } from './constants';

const generateId = () => Math.random().toString(36).substr(2, 9);

const incrementPitchStat = (stat: string): string => {
  const match = stat.match(/P:\s*(\d+)/i);
  if (match) {
    const count = parseInt(match[1]);
    return `P: ${count + 1}`;
  }
  const count = parseInt(stat);
  if (!isNaN(count)) return (count + 1).toString();
  return stat;
};

const decrementPitchStat = (stat: string): string => {
  const match = stat.match(/P:\s*(\d+)/i);
  if (match) {
    const count = parseInt(match[1]);
    return `P: ${Math.max(0, count - 1)}`;
  }
  const count = parseInt(stat);
  if (!isNaN(count)) return Math.max(0, count - 1).toString();
  return stat;
};

const updateInningScore = (team: Team, inning: number, amount: number): (number | null)[] => {
  const newScores = [...team.inningScores];
  const index = inning - 1;
  if (index >= 0) {
    // Ensure the array is long enough
    while (newScores.length <= index) {
      newScores.push(null);
    }
    const currentScore = newScores[index] || 0;
    newScores[index] = currentScore + amount;
  }
  return newScores;
};

export function reducer(state: GameState, action: ActionType): GameState {
  let nextState = baseReducer(state, action);

  const pitchIncrementActions: ActionType['type'][] = [
    'INCREMENT_BALL',
    'INCREMENT_STRIKE',
    'BATTER_OUT',
    'SINGLE',
    'DOUBLE',
    'TRIPLE',
    'HOME_RUN'
  ];

  if (pitchIncrementActions.includes(action.type)) {
    const pitchingTeamKey = state.isTop ? 'homeTeam' : 'awayTeam';
    nextState = {
      ...nextState,
      [pitchingTeamKey]: {
        ...nextState[pitchingTeamKey],
        pitcher: {
          ...nextState[pitchingTeamKey].pitcher,
          stat: incrementPitchStat(nextState[pitchingTeamKey].pitcher.stat)
        }
      }
    };
  }

  return nextState;
}

function baseReducer(state: GameState, action: ActionType): GameState {
  switch (action.type) {
    case 'INCREMENT_BALL': {
      if (state.balls >= 3) {
        // Walk (Base on Balls)
        const teamKey = state.isTop ? 'awayTeam' : 'homeTeam';
        const teamObj = state[teamKey];
        const nextIndex = teamObj.lineup.length > 0 ? (teamObj.currentBatterIndex + 1) % teamObj.lineup.length : teamObj.currentBatterIndex;
        
        let newBases = [...state.bases] as [boolean, boolean, boolean];
        let runsScored = 0;
        
        if (newBases[0]) {
          if (newBases[1]) {
            if (newBases[2]) {
              runsScored = 1;
            } else {
              newBases[2] = true;
            }
          } else {
            newBases[1] = true;
          }
        } else {
          newBases[0] = true;
        }

        return {
          ...state,
          balls: 0,
          strikes: 0,
          bases: newBases,
          [teamKey]: {
            ...teamObj,
            score: teamObj.score + runsScored,
            currentBatterIndex: nextIndex,
            inningScores: runsScored > 0 ? updateInningScore(teamObj, state.inning, runsScored) : teamObj.inningScores
          }
        };
      }
      return { 
        ...state, 
        balls: state.balls + 1,
      };
    }
      
    case 'DECREMENT_BALL':
      return {
        ...state,
        balls: Math.max(0, state.balls - 1),
      };
    
    case 'INCREMENT_STRIKE': {
      const isStrikeout = state.strikes >= 2;
      
      if (!isStrikeout) {
        return { 
          ...state, 
          strikes: state.strikes + 1,
        };
      }

      // It's a strikeout
      const isThirdOut = state.outs >= 2;
      
      const nextAwayIndex = state.isTop 
        ? (state.awayTeam.currentBatterIndex + 1) % Math.max(1, state.awayTeam.lineup.length) 
        : state.awayTeam.currentBatterIndex;
        
      const nextHomeIndex = !state.isTop 
        ? (state.homeTeam.currentBatterIndex + 1) % Math.max(1, state.homeTeam.lineup.length) 
        : state.homeTeam.currentBatterIndex;

      return { 
        ...state, 
        strikes: 0,
        balls: 0,
        outs: isThirdOut ? 0 : state.outs + 1,
        bases: isThirdOut ? [false, false, false] : state.bases,
        strikeoutAnimationTrigger: (state.strikeoutAnimationTrigger || 0) + 1,
        awayTeam: {
          ...state.awayTeam,
          currentBatterIndex: nextAwayIndex
        },
        homeTeam: {
          ...state.homeTeam,
          currentBatterIndex: nextHomeIndex
        }
      };
    }
      
    case 'DECREMENT_STRIKE':
      return {
        ...state,
        strikes: Math.max(0, state.strikes - 1),
      };
    
    case 'INCREMENT_OUT':
      if (state.outs >= 2) {
        return { 
          ...state, 
          outs: 0, 
          balls: 0, 
          strikes: 0, 
          bases: [false, false, false],
        };
      }
      return { 
        ...state, 
        outs: state.outs + 1,
      };
      
    case 'DECREMENT_OUT':
      return {
        ...state,
        outs: Math.max(0, state.outs - 1),
      };
    
    case 'RESET_COUNT':
      return { ...state, balls: 0, strikes: 0 };

    case 'TOGGLE_BASE':
      const newBases = [...state.bases] as [boolean, boolean, boolean];
      newBases[action.baseIndex] = !newBases[action.baseIndex];
      return { ...state, bases: newBases };

    case 'ADD_SCORE':
      if (action.team === 'home') {
        return { 
          ...state, 
          homeTeam: { 
            ...state.homeTeam, 
            score: Math.max(0, state.homeTeam.score + action.amount),
            inningScores: updateInningScore(state.homeTeam, state.inning, action.amount)
          } 
        };
      } else {
        return { 
          ...state, 
          awayTeam: { 
            ...state.awayTeam, 
            score: Math.max(0, state.awayTeam.score + action.amount),
            inningScores: updateInningScore(state.awayTeam, state.inning, action.amount)
          } 
        };
      }

    case 'RESET_SCORE':
      return {
        ...state,
        awayTeam: { ...state.awayTeam, score: 0 },
        homeTeam: { ...state.homeTeam, score: 0 }
      };

    case 'RESET_GAME':
      return {
        ...state,
        balls: 0,
        strikes: 0,
        outs: 0,
        bases: [false, false, false],
        inning: 1,
        isTop: true,
        timer: state.initialTimer,
        isTimerRunning: false,
        awayTeam: {
          ...state.awayTeam,
          score: 0,
          hits: 0,
          errors: 0,
          inningScores: Array(9).fill(null),
          currentBatterIndex: 0,
        },
        homeTeam: {
          ...state.homeTeam,
          score: 0,
          hits: 0,
          errors: 0,
          inningScores: Array(9).fill(null),
          currentBatterIndex: 0,
        }
      };

    case 'RESET_TEAM': {
      const targetTeam = action.team === 'home' ? 'homeTeam' : 'awayTeam';
      return {
        ...state,
        meta: {
          ...state.meta,
          settingsVersion: (state.meta.settingsVersion || 0) + 1
        },
        [targetTeam]: {
          ...state[targetTeam],
          lineup: INITIAL_STATE[targetTeam].lineup,
          bench: INITIAL_STATE[targetTeam].bench,
          name: INITIAL_STATE[targetTeam].name,
          fullName: INITIAL_STATE[targetTeam].fullName,
          color: INITIAL_STATE[targetTeam].color,
          baseColor: INITIAL_STATE[targetTeam].baseColor,
          logoUrl: INITIAL_STATE[targetTeam].logoUrl,
          pitcher: INITIAL_STATE[targetTeam].pitcher,
        }
      };
    }

    case 'RESET_TEAM_SETTINGS':
      return {
        ...state,
        meta: {
          ...state.meta,
          settingsVersion: (state.meta.settingsVersion || 0) + 1
        },
        awayTeam: {
          ...state.awayTeam,
          lineup: INITIAL_STATE.awayTeam.lineup,
          bench: INITIAL_STATE.awayTeam.bench,
          name: INITIAL_STATE.awayTeam.name,
          fullName: INITIAL_STATE.awayTeam.fullName,
          color: INITIAL_STATE.awayTeam.color,
          baseColor: INITIAL_STATE.awayTeam.baseColor,
          logoUrl: INITIAL_STATE.awayTeam.logoUrl,
          pitcher: INITIAL_STATE.awayTeam.pitcher,
        },
        homeTeam: {
          ...state.homeTeam,
          lineup: INITIAL_STATE.homeTeam.lineup,
          bench: INITIAL_STATE.homeTeam.bench,
          name: INITIAL_STATE.homeTeam.name,
          fullName: INITIAL_STATE.homeTeam.fullName,
          color: INITIAL_STATE.homeTeam.color,
          baseColor: INITIAL_STATE.homeTeam.baseColor,
          logoUrl: INITIAL_STATE.homeTeam.logoUrl,
          pitcher: INITIAL_STATE.homeTeam.pitcher,
        }
      };

    case 'SWAP_TEAMS':
      return {
        ...state,
        homeTeam: state.awayTeam,
        awayTeam: state.homeTeam,
        isTop: !state.isTop,
        meta: { ...state.meta, settingsVersion: (state.meta.settingsVersion || 0) + 1 }
      };

    case 'WALK': {
      const teamKey = state.isTop ? 'awayTeam' : 'homeTeam';
      const teamObj = state[teamKey];
      const nextIndex = teamObj.lineup.length > 0 ? (teamObj.currentBatterIndex + 1) % teamObj.lineup.length : teamObj.currentBatterIndex;
      
      let newBases = [...state.bases] as [boolean, boolean, boolean];
      let runsScored = 0;
      
      if (newBases[0]) {
        if (newBases[1]) {
          if (newBases[2]) {
            runsScored = 1;
          } else {
            newBases[2] = true;
          }
        } else {
          newBases[1] = true;
        }
      } else {
        newBases[0] = true;
      }

      return {
        ...state,
        balls: 0,
        strikes: 0,
        bases: newBases,
        [teamKey]: {
          ...teamObj,
          score: teamObj.score + runsScored,
          currentBatterIndex: nextIndex,
          inningScores: runsScored > 0 ? updateInningScore(teamObj, state.inning, runsScored) : teamObj.inningScores
        }
      };
    }

    case 'BATTER_OUT': {
      const teamKey = state.isTop ? 'awayTeam' : 'homeTeam';
      const teamObj = state[teamKey];
      const nextIndex = teamObj.lineup.length > 0 ? (teamObj.currentBatterIndex + 1) % teamObj.lineup.length : teamObj.currentBatterIndex;
      
      const willResetInning = state.outs >= 2;

      return {
        ...state,
        [teamKey]: {
          ...teamObj,
          currentBatterIndex: nextIndex
        },
        outs: willResetInning ? 0 : state.outs + 1,
        balls: 0,
        strikes: 0,
        bases: willResetInning ? [false, false, false] : state.bases,
      };
    }

    case 'SINGLE': {
      const teamKey = state.isTop ? 'awayTeam' : 'homeTeam';
      const runsScored = state.bases[2] ? 1 : 0;
      const newBases1 = [true, state.bases[0], state.bases[1]] as [boolean, boolean, boolean];
      const teamObj1 = state[teamKey];
      const nextIndex1 = teamObj1.lineup.length > 0 ? (teamObj1.currentBatterIndex + 1) % teamObj1.lineup.length : teamObj1.currentBatterIndex;
      
      return {
        ...state,
        [teamKey]: { 
          ...teamObj1, 
          score: teamObj1.score + runsScored, 
          currentBatterIndex: nextIndex1,
          inningScores: runsScored > 0 ? updateInningScore(teamObj1, state.inning, runsScored) : teamObj1.inningScores
        },
        bases: newBases1,
        balls: 0,
        strikes: 0,
      };
    }

    case 'DOUBLE': {
      const teamKey = state.isTop ? 'awayTeam' : 'homeTeam';
      const runsScored = (state.bases[1] ? 1 : 0) + (state.bases[2] ? 1 : 0);
      const newBases2 = [false, true, state.bases[0]] as [boolean, boolean, boolean];
      const teamObj2 = state[teamKey];
      const nextIndex2 = teamObj2.lineup.length > 0 ? (teamObj2.currentBatterIndex + 1) % teamObj2.lineup.length : teamObj2.currentBatterIndex;
      
      return {
        ...state,
        [teamKey]: { 
          ...teamObj2, 
          score: teamObj2.score + runsScored, 
          currentBatterIndex: nextIndex2,
          inningScores: runsScored > 0 ? updateInningScore(teamObj2, state.inning, runsScored) : teamObj2.inningScores
        },
        bases: newBases2,
        balls: 0,
        strikes: 0,
      };
    }

    case 'TRIPLE': {
      const teamKey = state.isTop ? 'awayTeam' : 'homeTeam';
      const runsScored = (state.bases[0] ? 1 : 0) + (state.bases[1] ? 1 : 0) + (state.bases[2] ? 1 : 0);
      const newBases3 = [false, false, true] as [boolean, boolean, boolean];
      const teamObj3 = state[teamKey];
      const nextIndex3 = teamObj3.lineup.length > 0 ? (teamObj3.currentBatterIndex + 1) % teamObj3.lineup.length : teamObj3.currentBatterIndex;
      
      return {
        ...state,
        [teamKey]: { 
          ...teamObj3, 
          score: teamObj3.score + runsScored, 
          currentBatterIndex: nextIndex3,
          inningScores: runsScored > 0 ? updateInningScore(teamObj3, state.inning, runsScored) : teamObj3.inningScores
        },
        bases: newBases3,
        balls: 0,
        strikes: 0,
      };
    }

    case 'HOME_RUN': {
      const runnersOnBase = state.bases.filter(Boolean).length;
      const runsScored = runnersOnBase + 1;
      const teamKey = state.isTop ? 'awayTeam' : 'homeTeam';
      const teamObj = state[teamKey];
      const nextIndex = teamObj.lineup.length > 0 ? (teamObj.currentBatterIndex + 1) % teamObj.lineup.length : teamObj.currentBatterIndex;
      
      return {
        ...state,
        [teamKey]: { 
          ...teamObj, 
          score: teamObj.score + runsScored, 
          currentBatterIndex: nextIndex,
          inningScores: updateInningScore(teamObj, state.inning, runsScored)
        },
        bases: [false, false, false],
        balls: 0,
        strikes: 0,
      };
    }

    case 'WILD_PITCH': {
      const teamKey = state.isTop ? 'awayTeam' : 'homeTeam';
      const teamObj = state[teamKey];
      
      let newBases = [...state.bases] as [boolean, boolean, boolean];
      let runsScored = 0;
      
      if (newBases[2]) {
        runsScored = 1;
        newBases[2] = false;
      }
      if (newBases[1]) {
        newBases[2] = true;
        newBases[1] = false;
      }
      if (newBases[0]) {
        newBases[1] = true;
        newBases[0] = false;
      }

      if (runsScored > 0) {
        return {
          ...state,
          bases: newBases,
          [teamKey]: {
            ...teamObj,
            score: teamObj.score + runsScored,
            inningScores: updateInningScore(teamObj, state.inning, runsScored)
          }
        };
      }
      
      return {
        ...state,
        bases: newBases
      };
    }

    case 'EXIT_HR_ANIMATION':
      if (state.animation) {
        return { ...state, animation: { ...state.animation, isLocked: false, isExiting: true } };
      }
      return state;

    case 'LOCK_HR_ANIMATION':
      if (state.animation) {
        return { ...state, animation: { ...state.animation, isLocked: true } };
      }
      return state;

    case 'TRIGGER_HR_BUBBLE':
      if (state.animation) {
        return { ...state, animation: { ...state.animation, bubbleKey: (state.animation.bubbleKey || 0) + 1 } };
      }
      return state;

    case 'SET_ANIMATION':
      return { ...state, animation: action.animation };

    case 'NEXT_INNING': {
      const currentTeamKey = state.isTop ? 'awayTeam' : 'homeTeam';
      const currentTeamObj = state[currentTeamKey];
      const currentInningIdx = state.inning - 1;
      
      const newInningScores = [...currentTeamObj.inningScores];
      if (newInningScores[currentInningIdx] === null || newInningScores[currentInningIdx] === undefined) {
         newInningScores[currentInningIdx] = 0;
      }
      
      return { 
        ...state, 
        [currentTeamKey]: {
          ...currentTeamObj,
          inningScores: newInningScores
        },
        isTop: !state.isTop, 
        inning: state.isTop ? state.inning : state.inning + 1,
        balls: 0, strikes: 0, outs: 0, bases: [false, false, false],
        isTimerRunning: false,
        timer: state.initialTimer || 20
      };
    }

    case 'PREVIOUS_HALF_INNING':
      return {
        ...state,
        isTop: !state.isTop,
        inning: !state.isTop ? state.inning : Math.max(1, state.inning - 1),
      };

    case 'NEXT_FULL_INNING':
      return {
        ...state,
        inning: state.inning + 1,
      };

    case 'PREVIOUS_FULL_INNING':
      return {
        ...state,
        inning: Math.max(1, state.inning - 1),
      };

    case 'SET_INNING':
       return { ...state, inning: action.value };

    case 'UPDATE_PLAYER': {
      const teamKey = action.team === 'home' ? 'homeTeam' : 'awayTeam';
      return { 
        ...state, 
        [teamKey]: { 
          ...state[teamKey], 
          [action.role]: { 
            ...state[teamKey][action.role as 'pitcher'], 
            [action.field]: action.value 
          } 
        } 
      };
    }

    case 'INCREMENT_PLAYER_STAT':
      if (action.role === 'pitcher') {
        const pitchingTeam = state.isTop ? 'homeTeam' : 'awayTeam';
        return { 
          ...state, 
          [pitchingTeam]: { 
            ...state[pitchingTeam], 
            pitcher: { 
              ...state[pitchingTeam].pitcher, 
              stat: incrementPitchStat(state[pitchingTeam].pitcher.stat) 
            } 
          } 
        };
      }
      return state;

    case 'DECREMENT_PLAYER_STAT':
      if (action.role === 'pitcher') {
        const pitchingTeam = state.isTop ? 'homeTeam' : 'awayTeam';
        return { 
          ...state, 
          [pitchingTeam]: { 
            ...state[pitchingTeam], 
            pitcher: { 
              ...state[pitchingTeam].pitcher, 
              stat: decrementPitchStat(state[pitchingTeam].pitcher.stat) 
            } 
          } 
        };
      }
      return state;

    case 'UPDATE_TEAM':
      const teamKey = action.team === 'home' ? 'homeTeam' : 'awayTeam';
      return { ...state, [teamKey]: { ...state[teamKey], [action.field]: action.value } };

    case 'APPLY_TEAM_CONFIG': {
      const teamKey = action.team === 'home' ? 'homeTeam' : 'awayTeam';
      const newConfig = { ...action.config };
      if (newConfig.lineup.length > 0 && newConfig.currentBatterIndex >= newConfig.lineup.length) {
        newConfig.currentBatterIndex = newConfig.lineup.length - 1;
      }
      return { ...state, [teamKey]: { ...state[teamKey], ...newConfig } };
    }

    case 'UPDATE_PITCH':
      return { ...state, currentPitch: { ...state.currentPitch, [action.field]: action.value } };
    
    case 'UPDATE_META':
      return { ...state, meta: { ...state.meta, [action.field]: action.value } };

    case 'SET_TIMER':
      return { ...state, timer: action.value, initialTimer: action.value };
    
    case 'TOGGLE_TIMER':
      return { ...state, isTimerRunning: !state.isTimerRunning };
      
    case 'RESET_TIMER':
      return { ...state, timer: state.initialTimer, isTimerRunning: false };
    
    case 'DECREMENT_TIMER':
      return { ...state, timer: Math.max(0, state.timer - 1) };

    case 'TOGGLE_VISIBILITY':
      return { ...state, [action.field]: !state[action.field] };

    case 'SET_VISIBILITY':
      return { ...state, [action.field]: action.value };

    case 'NEXT_BATTER': {
      const isTop = state.isTop;
      const tKey = isTop ? 'awayTeam' : 'homeTeam';
      const teamObj = state[tKey];
      if (teamObj.lineup.length === 0) return state;

      const nextIndex = (teamObj.currentBatterIndex + 1) % teamObj.lineup.length;

      return {
        ...state,
        [tKey]: { ...teamObj, currentBatterIndex: nextIndex }
      };
    }

    case 'PREVIOUS_BATTER': {
      const isTop = state.isTop;
      const tKey = isTop ? 'awayTeam' : 'homeTeam';
      const teamObj = state[tKey];
      if (teamObj.lineup.length === 0) return state;

      const prevIndex = (teamObj.currentBatterIndex - 1 + teamObj.lineup.length) % teamObj.lineup.length;

      return {
        ...state,
        [tKey]: { ...teamObj, currentBatterIndex: prevIndex }
      };
    }

    case 'SET_BATTER': {
      const tKey = action.team === 'home' ? 'homeTeam' : 'awayTeam';
      const teamObj = state[tKey];
      if (!teamObj.lineup[action.index]) return state;

      return {
        ...state,
        [tKey]: { ...teamObj, currentBatterIndex: action.index }
      };
    }

    case 'ADD_PLAYER_TO_LINEUP': {
      const tKey = action.team === 'home' ? 'homeTeam' : 'awayTeam';
      const newPlayer: Player = { id: generateId(), name: 'NAME', number: '00', stat: '.000', position: 'DH' };
      return {
        ...state,
        [tKey]: { ...state[tKey], lineup: [...state[tKey].lineup, newPlayer] }
      };
    }

    case 'UPDATE_LINEUP_PLAYER': {
      const tKey = action.team === 'home' ? 'homeTeam' : 'awayTeam';
      const newLineup = [...state[tKey].lineup];
      if (newLineup[action.index]) {
        newLineup[action.index] = { ...newLineup[action.index], [action.field]: action.value };
      }
      return {
        ...state,
        [tKey]: { ...state[tKey], lineup: newLineup }
      };
    }

    case 'REMOVE_PLAYER_FROM_LINEUP': {
      const tKey = action.team === 'home' ? 'homeTeam' : 'awayTeam';
      const newLineup = state[tKey].lineup.filter((_, i) => i !== action.index);
      return {
        ...state,
        [tKey]: { ...state[tKey], lineup: newLineup }
      };
    }

    case 'MOVE_TO_BENCH': {
      const tKey = action.team === 'home' ? 'homeTeam' : 'awayTeam';
      const player = state[tKey].lineup[action.index];
      if (!player) return state;
      const newLineup = state[tKey].lineup.filter((_, i) => i !== action.index);
      const newBench = [...state[tKey].bench, player];
      return {
        ...state,
        [tKey]: { ...state[tKey], lineup: newLineup, bench: newBench }
      };
    }

    case 'MOVE_TO_LINEUP': {
      const tKey = action.team === 'home' ? 'homeTeam' : 'awayTeam';
      const player = state[tKey].bench[action.index];
      if (!player) return state;
      const newBench = state[tKey].bench.filter((_, i) => i !== action.index);
      const newLineup = [...state[tKey].lineup, player];
      return {
        ...state,
        [tKey]: { ...state[tKey], lineup: newLineup, bench: newBench }
      };
    }

    case 'REORDER_LINEUP': {
      const tKey = action.team === 'home' ? 'homeTeam' : 'awayTeam';
      const newLineup = [...state[tKey].lineup];
      const [removed] = newLineup.splice(action.startIndex, 1);
      newLineup.splice(action.endIndex, 0, removed);
      return {
        ...state,
        [tKey]: { ...state[tKey], lineup: newLineup }
      };
    }

    case 'REORDER_BENCH': {
      const tKey = action.team === 'home' ? 'homeTeam' : 'awayTeam';
      const newBench = [...state[tKey].bench];
      const [removed] = newBench.splice(action.startIndex, 1);
      newBench.splice(action.endIndex, 0, removed);
      return {
        ...state,
        [tKey]: { ...state[tKey], bench: newBench }
      };
    }

    case 'SET_DISPLAY_MODE':
      return { ...state, displayMode: action.mode };
      
    case 'TOGGLE_DISPLAY_MODE': {
      const modes: ('default' | 'lineup' | 'rhe' | 'broadcast')[] = ['default', 'lineup', 'rhe', 'broadcast'];
      const currentIndex = modes.indexOf(state.displayMode);
      const nextMode = modes[(currentIndex + 1) % modes.length];
      return { ...state, displayMode: nextMode };
    }

    case 'TOGGLE_LINEUP_MODE':
      return { ...state, displayMode: state.displayMode === 'lineup' ? 'default' : 'lineup' };
      
    case 'TOGGLE_RHE_MODE':
      return { ...state, displayMode: state.displayMode === 'rhe' ? 'default' : 'rhe' };
      
    case 'TOGGLE_BROADCAST_MODE':
      return { ...state, displayMode: state.displayMode === 'broadcast' ? 'default' : 'broadcast' };
      
    case 'TOGGLE_ADJUSTMENT_MODE':
      return { ...state, isAdjustmentMode: !state.isAdjustmentMode };
      
    case 'FULL_RESET':
      return JSON.parse(JSON.stringify(INITIAL_STATE));
      
    case 'REPLACE_STATE':
      if (action.state) {
        return {
          ...INITIAL_STATE,
          ...action.state,
          pitcher: action.state.pitcher ?? INITIAL_STATE.pitcher,
          currentPitch: action.state.currentPitch ?? INITIAL_STATE.currentPitch,
          timer: action.state.timer ?? INITIAL_STATE.timer,
          initialTimer: action.state.initialTimer ?? INITIAL_STATE.initialTimer,
          isTimerRunning: action.state.isTimerRunning ?? INITIAL_STATE.isTimerRunning,
          showCount: action.state.showCount ?? INITIAL_STATE.showCount,
          showTimer: action.state.showTimer ?? INITIAL_STATE.showTimer,
          showBatterInfo: action.state.showBatterInfo ?? INITIAL_STATE.showBatterInfo,
          showPitcherInfo: action.state.showPitcherInfo ?? INITIAL_STATE.showPitcherInfo,
          showPitchInfo: action.state.showPitchInfo ?? INITIAL_STATE.showPitchInfo,
          showPlayerStat: action.state.showPlayerStat ?? INITIAL_STATE.showPlayerStat,
          displayMode: action.state.displayMode ?? state.displayMode,
          animation: action.state.animation ?? INITIAL_STATE.animation,
          meta: {
            ...INITIAL_STATE.meta,
            ...(action.state.meta || {})
          }
        };
      }
      return state;

    default:
      return state;
  }
}
