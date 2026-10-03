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

export const getPitcherCount = (p?: Partial<Player>): number => {
  if (!p) return 0;
  if (typeof p.pitchCount === 'number' && !isNaN(p.pitchCount)) return p.pitchCount;
  const num = parseInt((p.stat || '').replace(/[^0-9]/g, ''), 10);
  return isNaN(num) ? 0 : num;
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
    const curPitcher = nextState[pitchingTeamKey].pitcher;
    const nextCount = getPitcherCount(curPitcher) + 1;
    nextState = {
      ...nextState,
      [pitchingTeamKey]: {
        ...nextState[pitchingTeamKey],
        pitcher: {
          ...curPitcher,
          stat: nextCount.toString(),
          pitchCount: nextCount
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
        
        const newLineup = [...teamObj.lineup];
        if (newLineup[teamObj.currentBatterIndex]) {
          newLineup[teamObj.currentBatterIndex] = {
            ...newLineup[teamObj.currentBatterIndex],
            atBats: [...(newLineup[teamObj.currentBatterIndex].atBats || []), '四球']
          };
        }

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
            lineup: newLineup,
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
      
      const battingTeamKey = state.isTop ? 'awayTeam' : 'homeTeam';
      const curBatterIdx = state[battingTeamKey].currentBatterIndex;
      const updatedBattingLineup = [...state[battingTeamKey].lineup];
      if (updatedBattingLineup[curBatterIdx]) {
        updatedBattingLineup[curBatterIdx] = {
          ...updatedBattingLineup[curBatterIdx],
          atBats: [...(updatedBattingLineup[curBatterIdx].atBats || []), '三振']
        };
      }

      const nextAwayIndex = state.isTop 
        ? (state.awayTeam.currentBatterIndex + 1) % Math.max(1, state.awayTeam.lineup.length) 
        : state.awayTeam.currentBatterIndex;
        
      const nextHomeIndex = !state.isTop 
        ? (state.homeTeam.currentBatterIndex + 1) % Math.max(1, state.homeTeam.lineup.length) 
        : state.homeTeam.currentBatterIndex;

      const pitchingTeamKey = state.isTop ? 'homeTeam' : 'awayTeam';
      const curPitcher = state[pitchingTeamKey].pitcher;
      const updatedPitcher = curPitcher ? {
        ...curPitcher,
        strikeouts: (curPitcher.strikeouts || 0) + 1
      } : curPitcher;

      return { 
        ...state, 
        strikes: 0,
        balls: 0,
        outs: isThirdOut ? 0 : state.outs + 1,
        bases: isThirdOut ? [false, false, false] : state.bases,
        strikeoutAnimationTrigger: (state.strikeoutAnimationTrigger || 0) + 1,
        awayTeam: {
          ...state.awayTeam,
          lineup: state.isTop ? updatedBattingLineup : state.awayTeam.lineup,
          pitcher: !state.isTop ? (updatedPitcher || state.awayTeam.pitcher) : state.awayTeam.pitcher,
          currentBatterIndex: nextAwayIndex
        },
        homeTeam: {
          ...state.homeTeam,
          lineup: !state.isTop ? updatedBattingLineup : state.homeTeam.lineup,
          pitcher: state.isTop ? (updatedPitcher || state.homeTeam.pitcher) : state.homeTeam.pitcher,
          currentBatterIndex: nextHomeIndex
        }
      };
    }
      
    case 'DECREMENT_STRIKE':
      return {
        ...state,
        strikes: Math.max(0, state.strikes - 1),
      };

    case 'TRIGGER_K': {
      const pitchingTeamKey = state.isTop ? 'homeTeam' : 'awayTeam';
      const curPitcher = state[pitchingTeamKey].pitcher;
      const updatedPitcher = curPitcher ? {
        ...curPitcher,
        strikeouts: (curPitcher.strikeouts || 0) + 1
      } : curPitcher;
      return {
        ...state,
        strikeoutAnimationTrigger: (state.strikeoutAnimationTrigger || 0) + 1,
        [pitchingTeamKey]: {
          ...state[pitchingTeamKey],
          pitcher: updatedPitcher || state[pitchingTeamKey].pitcher
        }
      };
    }
    
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

    case 'ADD_HIT': {
      const teamKey = action.team === 'home' ? 'homeTeam' : 'awayTeam';
      const currentHits = state[teamKey].hits || 0;
      const amount = action.amount ?? 1;
      return {
        ...state,
        [teamKey]: {
          ...state[teamKey],
          hits: Math.max(0, currentHits + amount)
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
      const curIndex = teamObj.currentBatterIndex;
      const nextIndex = teamObj.lineup.length > 0 ? (curIndex + 1) % teamObj.lineup.length : curIndex;
      
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

      const newLineup = [...teamObj.lineup];
      if (newLineup[curIndex]) {
        newLineup[curIndex] = {
          ...newLineup[curIndex],
          atBats: [...(newLineup[curIndex].atBats || []), '四球']
        };
      }

      return {
        ...state,
        balls: 0,
        strikes: 0,
        bases: newBases,
        [teamKey]: {
          ...teamObj,
          score: teamObj.score + runsScored,
          lineup: newLineup,
          currentBatterIndex: nextIndex,
          inningScores: runsScored > 0 ? updateInningScore(teamObj, state.inning, runsScored) : teamObj.inningScores
        }
      };
    }

    case 'BATTER_OUT': {
      const teamKey = state.isTop ? 'awayTeam' : 'homeTeam';
      const teamObj = state[teamKey];
      const curIndex = teamObj.currentBatterIndex;
      const nextIndex = teamObj.lineup.length > 0 ? (curIndex + 1) % teamObj.lineup.length : curIndex;
      
      const willResetInning = state.outs >= 2;

      const newLineup = [...teamObj.lineup];
      if (newLineup[curIndex]) {
        newLineup[curIndex] = {
          ...newLineup[curIndex],
          atBats: [...(newLineup[curIndex].atBats || []), '出局']
        };
      }

      return {
        ...state,
        [teamKey]: {
          ...teamObj,
          lineup: newLineup,
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
      const curIndex1 = teamObj1.currentBatterIndex;
      const nextIndex1 = teamObj1.lineup.length > 0 ? (curIndex1 + 1) % teamObj1.lineup.length : curIndex1;
      
      const newLineup1 = [...teamObj1.lineup];
      if (newLineup1[curIndex1]) {
        newLineup1[curIndex1] = {
          ...newLineup1[curIndex1],
          atBats: [...(newLineup1[curIndex1].atBats || []), '一安']
        };
      }

      return {
        ...state,
        [teamKey]: { 
          ...teamObj1, 
          score: teamObj1.score + runsScored, 
          hits: teamObj1.hits + 1,
          lineup: newLineup1,
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
      const curIndex2 = teamObj2.currentBatterIndex;
      const nextIndex2 = teamObj2.lineup.length > 0 ? (curIndex2 + 1) % teamObj2.lineup.length : curIndex2;
      
      const newLineup2 = [...teamObj2.lineup];
      if (newLineup2[curIndex2]) {
        newLineup2[curIndex2] = {
          ...newLineup2[curIndex2],
          atBats: [...(newLineup2[curIndex2].atBats || []), '二安']
        };
      }

      return {
        ...state,
        [teamKey]: { 
          ...teamObj2, 
          score: teamObj2.score + runsScored, 
          hits: teamObj2.hits + 1,
          lineup: newLineup2,
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
      const curIndex3 = teamObj3.currentBatterIndex;
      const nextIndex3 = teamObj3.lineup.length > 0 ? (curIndex3 + 1) % teamObj3.lineup.length : curIndex3;
      
      const newLineup3 = [...teamObj3.lineup];
      if (newLineup3[curIndex3]) {
        newLineup3[curIndex3] = {
          ...newLineup3[curIndex3],
          atBats: [...(newLineup3[curIndex3].atBats || []), '三安']
        };
      }

      return {
        ...state,
        [teamKey]: { 
          ...teamObj3, 
          score: teamObj3.score + runsScored, 
          hits: teamObj3.hits + 1,
          lineup: newLineup3,
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
      const curIndex = teamObj.currentBatterIndex;
      const nextIndex = teamObj.lineup.length > 0 ? (curIndex + 1) % teamObj.lineup.length : curIndex;
      
      let animationType: 'homerun' | '2-run-homer' | '3-run-homer' | 'grand-slam' = 'homerun';
      if (runnersOnBase === 1) animationType = '2-run-homer';
      else if (runnersOnBase === 2) animationType = '3-run-homer';
      else if (runnersOnBase >= 3) animationType = 'grand-slam';

      const batter = teamObj.lineup[curIndex];
      const playerName = batter ? (batter.number ? `${batter.name} #${batter.number}` : batter.name) : (state.isTop ? '客隊打者' : '主隊打者');

      const newLineup = [...teamObj.lineup];
      if (newLineup[curIndex]) {
        newLineup[curIndex] = {
          ...newLineup[curIndex],
          atBats: [...(newLineup[curIndex].atBats || []), '全壘打']
        };
      }

      return {
        ...state,
        [teamKey]: { 
          ...teamObj, 
          score: teamObj.score + runsScored, 
          hits: teamObj.hits + 1,
          lineup: newLineup,
          currentBatterIndex: nextIndex,
          inningScores: updateInningScore(teamObj, state.inning, runsScored)
        },
        bases: [false, false, false],
        balls: 0,
        strikes: 0,
        animation: {
          type: animationType,
          playerName,
          teamName: teamObj.name || (state.isTop ? '客隊' : '主隊'),
          teamColor: teamObj.color || '#3b82f6',
          bubbleKey: Date.now()
        }
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

    case 'THREE_UP_THREE_DOWN': {
      const currentTeamKey = state.isTop ? 'awayTeam' : 'homeTeam';
      const currentTeamObj = state[currentTeamKey];
      const currentInningIdx = state.inning - 1;
      
      const newInningScores = [...currentTeamObj.inningScores];
      if (newInningScores[currentInningIdx] === null || newInningScores[currentInningIdx] === undefined) {
         newInningScores[currentInningIdx] = 0;
      }

      // Next batter advances by remaining outs to complete 3
      const remainingOuts = Math.max(1, 3 - state.outs);
      const nextIndex = currentTeamObj.lineup.length > 0 
        ? (currentTeamObj.currentBatterIndex + remainingOuts) % currentTeamObj.lineup.length
        : currentTeamObj.currentBatterIndex;
      
      return { 
        ...state, 
        [currentTeamKey]: {
          ...currentTeamObj,
          currentBatterIndex: nextIndex,
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
        const curPitcher = state[pitchingTeam].pitcher;
        const currentPitches = curPitcher?.pitchCount !== undefined
          ? curPitcher.pitchCount
          : parseInt(curPitcher?.stat?.replace(/[^0-9]/g, '') || '0', 10);
        return { 
          ...state, 
          [pitchingTeam]: { 
            ...state[pitchingTeam], 
            pitcher: { 
              ...curPitcher, 
              stat: incrementPitchStat(curPitcher.stat),
              pitchCount: currentPitches + 1
            } 
          } 
        };
      }
      return state;

    case 'DECREMENT_PLAYER_STAT':
      if (action.role === 'pitcher') {
        const pitchingTeam = state.isTop ? 'homeTeam' : 'awayTeam';
        const curPitcher = state[pitchingTeam].pitcher;
        const currentPitches = curPitcher?.pitchCount !== undefined
          ? curPitcher.pitchCount
          : parseInt(curPitcher?.stat?.replace(/[^0-9]/g, '') || '0', 10);
        return { 
          ...state, 
          [pitchingTeam]: { 
            ...state[pitchingTeam], 
            pitcher: { 
              ...curPitcher, 
              stat: decrementPitchStat(curPitcher.stat),
              pitchCount: Math.max(0, currentPitches - 1)
            } 
          } 
        };
      }
      return state;

    case 'UPDATE_TEAM': {
      const teamKey = action.team === 'home' ? 'homeTeam' : 'awayTeam';
      if ('data' in action && (action as any).data) {
        return { ...state, [teamKey]: { ...state[teamKey], ...(action as any).data } };
      }
      if (action.field) {
        return { ...state, [teamKey]: { ...state[teamKey], [action.field]: action.value } };
      }
      return state;
    }

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
        let val = action.value;
        if (action.field === 'position' && typeof val === 'string') {
          if (val.trim() === '代打' || val.trim().toLowerCase() === 'ph') val = 'PH';
          else if (val.trim() === '代跑' || val.trim().toLowerCase() === 'pr') val = 'PR';
        }
        newLineup[action.index] = { ...newLineup[action.index], [action.field]: val };
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
      const newLineup = [...state[tKey].lineup, { ...player, position: 'PH' }];
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

    case 'ADD_PLAYER_TO_BENCH': {
      const tKey = action.team === 'home' ? 'homeTeam' : 'awayTeam';
      const newPlayer: Player = {
        id: Math.random().toString(36).substring(2, 9),
        name: action.player?.name || `Bench ${state[tKey].bench.length + 1}`,
        number: action.player?.number || '00',
        stat: action.player?.stat || '.000',
        position: action.player?.position || 'BN'
      };
      return {
        ...state,
        [tKey]: {
          ...state[tKey],
          bench: [...state[tKey].bench, newPlayer]
        }
      };
    }

    case 'UPDATE_BENCH_PLAYER': {
      const tKey = action.team === 'home' ? 'homeTeam' : 'awayTeam';
      const newBench = [...state[tKey].bench];
      if (newBench[action.index]) {
        newBench[action.index] = { ...newBench[action.index], [action.field]: action.value };
      }
      return {
        ...state,
        [tKey]: { ...state[tKey], bench: newBench }
      };
    }

    case 'REMOVE_PLAYER_FROM_BENCH': {
      const tKey = action.team === 'home' ? 'homeTeam' : 'awayTeam';
      const newBench = state[tKey].bench.filter((_, i) => i !== action.index);
      return {
        ...state,
        [tKey]: { ...state[tKey], bench: newBench }
      };
    }

    case 'SWAP_LINEUP_BENCH': {
      const tKey = action.team === 'home' ? 'homeTeam' : 'awayTeam';
      const lineupPlayer = state[tKey].lineup[action.lineupIndex];
      const benchPlayer = state[tKey].bench[action.benchIndex];
      if (!lineupPlayer || !benchPlayer) return state;

      const newLineup = [...state[tKey].lineup];
      const newBench = [...state[tKey].bench];
      // 換代打的時候 守位要自動改成PH
      const substitutedPlayer: Player = { ...benchPlayer, position: 'PH' };
      newLineup[action.lineupIndex] = substitutedPlayer;
      newBench[action.benchIndex] = { ...lineupPlayer, position: 'BN' };

      return {
        ...state,
        [tKey]: { ...state[tKey], lineup: newLineup, bench: newBench }
      };
    }

    case 'SET_INNING_SCORE': {
      const tKey = action.team === 'home' ? 'homeTeam' : 'awayTeam';
      const newInningScores = [...state[tKey].inningScores];
      while (newInningScores.length <= action.inningIndex) {
        newInningScores.push(null);
      }
      newInningScores[action.inningIndex] = action.score;
      const totalScore = newInningScores.reduce<number>((sum, val) => sum + (val || 0), 0);
      return {
        ...state,
        [tKey]: {
          ...state[tKey],
          score: totalScore,
          inningScores: newInningScores
        }
      };
    }

    case 'RECORD_AT_BAT': {
      const teamKey = (action.team ? (action.team === 'home' ? 'homeTeam' : 'awayTeam') : (state.isTop ? 'awayTeam' : 'homeTeam'));
      const teamObj = state[teamKey];
      const pIdx = action.playerIndex !== undefined ? action.playerIndex : teamObj.currentBatterIndex;
      const newLineup = [...teamObj.lineup];
      if (newLineup[pIdx]) {
        const curPlayer = newLineup[pIdx];
        newLineup[pIdx] = {
          ...curPlayer,
          atBats: [...(curPlayer.atBats || []), action.result]
        };
      }
      return {
        ...state,
        [teamKey]: {
          ...teamObj,
          lineup: newLineup
        }
      };
    }

    case 'CLEAR_ALL_AT_BATS': {
      return {
        ...state,
        awayTeam: {
          ...state.awayTeam,
          lineup: state.awayTeam.lineup.map(p => ({ ...p, atBats: [] })),
          bench: state.awayTeam.bench.map(p => ({ ...p, atBats: [] }))
        },
        homeTeam: {
          ...state.homeTeam,
          lineup: state.homeTeam.lineup.map(p => ({ ...p, atBats: [] })),
          bench: state.homeTeam.bench.map(p => ({ ...p, atBats: [] }))
        }
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
