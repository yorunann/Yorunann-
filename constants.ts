import { GameState, Player } from './types';

const generateId = () => Math.random().toString(36).substr(2, 9);

const defaultLineup = (prefix: string): Player[] => [
  { id: generateId(), name: `${prefix} #1`, number: '01', stat: '.300', position: 'SS' },
  { id: generateId(), name: `${prefix} #2`, number: '02', stat: '.280', position: '2B' },
  { id: generateId(), name: `${prefix} #3`, number: '03', stat: '.310', position: 'CF' },
  { id: generateId(), name: `${prefix} #4`, number: '04', stat: '.290', position: '1B' },
  { id: generateId(), name: `${prefix} #5`, number: '05', stat: '.250', position: 'RF' },
  { id: generateId(), name: `${prefix} #6`, number: '06', stat: '.240', position: '3B' },
  { id: generateId(), name: `${prefix} #7`, number: '07', stat: '.220', position: 'LF' },
  { id: generateId(), name: `${prefix} #8`, number: '08', stat: '.210', position: 'C' },
  { id: generateId(), name: `${prefix} #9`, number: '09', stat: '.200', position: 'DH' },
];

const defaultBench = (prefix: string): Player[] => [
  { id: generateId(), name: `${prefix} Bench 1`, number: '10', stat: '.200', position: 'OF' },
  { id: generateId(), name: `${prefix} Bench 2`, number: '11', stat: '.210', position: 'IF' },
  { id: generateId(), name: `${prefix} Bench 3`, number: '12', stat: '.190', position: 'C' },
];

export const INITIAL_STATE: GameState = {
  awayTeam: {
    name: 'AWAY',
    fullName: 'AWAY TEAM',
    score: 0,
    hits: 0,
    errors: 0,
    inningScores: Array(9).fill(null),
    color: '#1e40af', // Blue
    baseColor: '#facc15', // Yellow
    lineup: defaultLineup('AWAY'),
    bench: defaultBench('AWAY'),
    currentBatterIndex: 0,
    pitcher: {
      id: generateId(),
      name: 'Away P',
      number: '99',
      stat: 'P: 0',
    },
  },
  homeTeam: {
    name: 'HOME',
    fullName: 'HOME TEAM',
    score: 0,
    hits: 0,
    errors: 0,
    inningScores: Array(9).fill(null),
    color: '#b91c1c', // Red
    baseColor: '#facc15', // Yellow
    lineup: defaultLineup('HOME'),
    bench: defaultBench('HOME'),
    currentBatterIndex: 0,
    pitcher: {
      id: generateId(),
      name: 'Home P',
      number: '1',
      stat: 'P: 0',
    },
  },
  inning: 1,
  isTop: true,
  balls: 0,
  strikes: 0,
  outs: 0,
  bases: [false, false, false], // No runners
  pitcher: {
    id: 'p1',
    name: 'Zhu',
    number: '98',
    stat: 'P: 8',
  },
  currentPitch: {
    type: 'SWEEPER',
    speed: '140',
    unit: 'Km/h',
    spinRate: '1789 RPM',
  },
  timer: 20,
  initialTimer: 20,
  isTimerRunning: false,
  displayMode: 'default',
  animation: null,
  showPlayerStat: true,
  showBatterInfo: true,
  showPitcherInfo: true,
  showPitchInfo: true,
  showCount: true,
  showTimer: true,
  strikeoutAnimationTrigger: 0,
  meta: {
    leagueName: 'FPBL 25th',
    date: '8/3',
    gameId: 'G265',
    broadcaster: 'Astra & co.',
    gameInfos: ['FPBL 25th', 'G265', '8/3'],
    broadcastMarginX: 20,
    broadcastMarginY: 20,
  }
};