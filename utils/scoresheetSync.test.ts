import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { GameState, Team } from '../types.ts';
import {
  applyScoresheetSnapshot,
  extractScoresheetGameId,
  isBatterInLineup,
  type ScoresheetGame,
  type ScoresheetMember,
} from './scoresheetSync.ts';

// constants.ts has extensionless value imports that node --test cannot resolve, so build a minimal state here
const makeTeam = (prefix: string): Team => ({
  name: prefix,
  fullName: `${prefix} TEAM`,
  score: 0,
  hits: 0,
  errors: 0,
  inningScores: Array(9).fill(null),
  color: '#123456',
  lineup: [{ id: `${prefix}-1`, name: `${prefix} #1`, number: '01', stat: '.300' }],
  bench: [{ id: `${prefix}-b`, name: `${prefix} Bench`, number: '10', stat: '.200' }],
  currentBatterIndex: 0,
  pitcher: { id: `${prefix}-p`, name: `${prefix} P`, number: '99', stat: '0' },
});

const INITIAL_STATE: GameState = {
  awayTeam: makeTeam('AWAY'),
  homeTeam: makeTeam('HOME'),
  inning: 1,
  isTop: true,
  balls: 0,
  strikes: 0,
  outs: 0,
  bases: [false, false, false],
  pitcher: { id: 'p', name: 'P', number: '1', stat: '0' },
  currentPitch: { type: '', speed: '', unit: 'km/h', spinRate: '' },
  timer: 0,
  isTimerRunning: false,
  displayMode: 'default',
  animation: null,
  showPlayerStat: true,
  showBatterInfo: true,
  showPitcherInfo: true,
  showPitchInfo: true,
  showCount: true,
  showTimer: true,
  meta: { leagueName: 'L', date: '', gameId: '', broadcaster: '' },
  initialTimer: 0,
};

// Same shape as a real game (Nov 2026) with names replaced.
// In game_member, is_first=0 is the visiting team and 1 is the home team. batting[].team_id may be a child team ID
const members: ScoresheetMember[] = [
  { player_id: 11, name: 'A1', order_number: 1, position: 3, is_first: 0 },
  { player_id: 12, name: 'A2', order_number: 2, position: 1, is_first: 0 },
  { player_id: 21, name: 'H1', order_number: 1, position: 2, is_first: 1 },
  { player_id: 23, name: 'H3', order_number: 3, position: 3, is_first: 1 },
  { player_id: 22, name: 'H2', order_number: 2, position: 1, is_first: 1 },
];

const liveGame: ScoresheetGame = {
  game_id: '432ebaa4-ff2b-4a78-8e5f-5dc469f65f15',
  first_team: 566,
  last_team: 722,
  first_team_name: 'Away<br>Team',
  last_team_name: 'Home Team',
  first_run: 0,
  last_run: 11,
  top_1st: 0,
  bottom_1st: 5,
  top_2nd: 0,
  bottom_2nd: 6,
  top_3rd: null,
  bottom_3rd: null,
  current_inning: 2,
  isTop: 0,
  current_out: 1,
  ball: 2,
  strike: 1,
  is1st: 2790,
  is2nd: 0,
  is3rd: 1,
  batter_name: 'H3',
  pitcher_name: 'A2',
  locked: 0,
  batting: [
    { player_id: 11, team_id: 566, hit: 1, at_bats: 2, rbi: 0, run: 0, four_ball: 0 },
    { player_id: 21, team_id: 722, hit: 2, at_bats: 2, rbi: 1, run: 1, four_ball: 0 },
    { player_id: 23, team_id: 719, hit: 1, at_bats: 1, rbi: 2, run: 0, four_ball: 1 },
    { player_id: 99, team_id: 566, hit: 1, at_bats: 1, rbi: 0, run: 0, four_ball: 0 },
  ],
  pitching: [
    { name: 'A2', is_first: 0, pitch_count: 34 },
    { name: 'H2', is_first: 1, pitch_count: 20 },
  ],
};

test('maps visiting team to away and home team to home, with names and scores', () => {
  const next = applyScoresheetSnapshot(INITIAL_STATE, { game: liveGame, members });
  assert.equal(next.awayTeam.fullName, 'AwayTeam');
  assert.equal(next.awayTeam.name, 'AwayTeam');
  assert.equal(next.homeTeam.fullName, 'Home Team');
  assert.equal(next.awayTeam.score, 0);
  assert.equal(next.homeTeam.score, 11);
});

test('keeps unplayed innings as null and preserves the existing column count', () => {
  const next = applyScoresheetSnapshot(INITIAL_STATE, { game: liveGame, members });
  assert.deepEqual(next.awayTeam.inningScores, [0, 0, null, null, null, null, null, null, null]);
  assert.deepEqual(next.homeTeam.inningScores, [5, 6, null, null, null, null, null, null, null]);
});

test('adds columns for extra innings beyond the current length', () => {
  const game = { ...liveGame, top_10th: 1, current_inning: 10, isTop: 1 };
  const next = applyScoresheetSnapshot(INITIAL_STATE, { game, members });
  assert.equal(next.awayTeam.inningScores.length, 10);
  assert.equal(next.awayTeam.inningScores[9], 1);
});

test('applies inning, half, outs, count and runners (a player ID counts as occupied)', () => {
  const next = applyScoresheetSnapshot(INITIAL_STATE, { game: liveGame, members });
  assert.equal(next.inning, 2);
  assert.equal(next.isTop, false);
  assert.equal(next.outs, 1);
  assert.equal(next.balls, 2);
  assert.equal(next.strikes, 1);
  assert.deepEqual(next.bases, [true, false, true]);
});

test('clamps count and outs to displayable ranges', () => {
  const game = { ...liveGame, ball: 4, strike: 3, current_out: 3 };
  const next = applyScoresheetSnapshot(INITIAL_STATE, { game, members });
  assert.equal(next.balls, 3);
  assert.equal(next.strikes, 2);
  assert.equal(next.outs, 3);
});

test('orders lineup by order_number with stable ss-<player_id> IDs', () => {
  const next = applyScoresheetSnapshot(INITIAL_STATE, { game: liveGame, members });
  assert.deepEqual(next.awayTeam.lineup.map((p) => p.id), ['ss-11', 'ss-12']);
  assert.deepEqual(next.homeTeam.lineup.map((p) => p.name), ['H1', 'H2', 'H3']);
  assert.deepEqual(next.homeTeam.bench, []);
});

test('points the batting team currentBatterIndex at the current batter', () => {
  const next = applyScoresheetSnapshot(INITIAL_STATE, { game: liveGame, members });
  assert.equal(next.homeTeam.currentBatterIndex, 2);
});

test('assigns batting stats by player_id and sums hits per team', () => {
  const next = applyScoresheetSnapshot(INITIAL_STATE, { game: liveGame, members });
  const h3 = next.homeTeam.lineup.find((p) => p.id === 'ss-23');
  assert.equal(h3?.stat, '1-1');
  assert.equal(h3?.rbi, 2);
  assert.equal(h3?.walks, 1);
  // 23 has team_id=719 but members say home; 99 is not a member, so team_id decides away
  assert.equal(next.homeTeam.hits, 3);
  assert.equal(next.awayTeam.hits, 2);
});

test('applies the fielding pitcher and pitch count, and syncs the top-level pitcher', () => {
  const next = applyScoresheetSnapshot(INITIAL_STATE, { game: liveGame, members });
  assert.equal(next.awayTeam.pitcher.id, 'ss-12');
  assert.equal(next.awayTeam.pitcher.name, 'A2');
  assert.equal(next.awayTeam.pitcher.pitchCount, 34);
  assert.equal(next.pitcher.name, 'A2');
});

test('leaves lineups untouched when members are missing', () => {
  const next = applyScoresheetSnapshot(INITIAL_STATE, { game: liveGame, members: null });
  assert.equal(next.homeTeam.lineup, INITIAL_STATE.homeTeam.lineup);
  assert.equal(next.homeTeam.score, 11);
});

test('keeps defaults before the game starts (live fields are null)', () => {
  const notStarted: ScoresheetGame = {
    game_id: 'd0361986-c9d6-4a29-898f-f2b5d77a5acb',
    first_team: 1,
    last_team: 2,
    first_team_name: 'A',
    last_team_name: 'B',
    first_run: 0,
    last_run: 0,
    current_inning: null,
    isTop: null,
    current_out: null,
    ball: null,
    strike: null,
    is1st: null,
    is2nd: null,
    is3rd: null,
    batter_name: null,
    pitcher_name: null,
    locked: 0,
  };
  const next = applyScoresheetSnapshot(INITIAL_STATE, { game: notStarted, members: [] });
  assert.equal(next.inning, 1);
  assert.equal(next.isTop, true);
  assert.equal(next.outs, 0);
  assert.deepEqual(next.bases, [false, false, false]);
  assert.deepEqual(next.awayTeam.inningScores, Array(9).fill(null));
});

test('does not overwrite display settings or timer', () => {
  const state = { ...INITIAL_STATE, displayMode: 'broadcast' as const, timer: 42 };
  const next = applyScoresheetSnapshot(state, { game: liveGame, members });
  assert.equal(next.displayMode, 'broadcast');
  assert.equal(next.timer, 42);
  assert.equal(next.meta, state.meta);
  assert.equal(next.awayTeam.color, state.awayTeam.color);
});

test('does not mutate the original state', () => {
  const snapshot = JSON.stringify(INITIAL_STATE);
  applyScoresheetSnapshot(INITIAL_STATE, { game: liveGame, members });
  assert.equal(JSON.stringify(INITIAL_STATE), snapshot);
});

test('isBatterInLineup reports whether the batter is in the batting lineup', () => {
  const next = applyScoresheetSnapshot(INITIAL_STATE, { game: liveGame, members });
  assert.equal(isBatterInLineup(next, liveGame), true);
  assert.equal(isBatterInLineup(next, { ...liveGame, batter_name: 'Pinch Hitter' }), false);
  assert.equal(isBatterInLineup(next, { ...liveGame, batter_name: null }), true);
});

test('extractScoresheetGameId extracts a UUID from a bare ID or a URL', () => {
  const id = '432ebaa4-ff2b-4a78-8e5f-5dc469f65f15';
  assert.equal(extractScoresheetGameId(id), id);
  assert.equal(extractScoresheetGameId(`https://cap-scorebook.com/game/${id}?x=1`), id);
  assert.equal(extractScoresheetGameId(' 432EBAA4-FF2B-4A78-8E5F-5DC469F65F15 '), id);
  assert.equal(extractScoresheetGameId('12345'), null);
});
