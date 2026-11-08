import type { GameState, Player, Team } from '../types.ts';

/**
 * Maps a scoresheet (cap-scorebook) game onto Yorunann's GameState. Read-only.
 *
 * - Sources: GET /game/:game_id (game info with live fields) and GET /game_member/:game_id (lineups)
 * - Visiting team (bats first) = away (bats in the top half), home team = home
 * - In game_member / pitching, is_first means "0 = visiting team player, 1 = home team player"
 * - Live fields (current_inning etc.) are written when the scorer confirms a plate appearance.
 *   Batter name and count belong to the last confirmed plate appearance, not to each pitch
 */

const INNING_KEYS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th'] as const;
type InningKey = (typeof INNING_KEYS)[number];

type NullableNumber = number | null | undefined;

export type ScoresheetBatting = {
  player_id: number;
  team_id: number;
  hit?: number | null;
  at_bats?: number | null;
  rbi?: number | null;
  run?: number | null;
  four_ball?: number | null;
};

export type ScoresheetPitching = {
  name: string;
  is_first: number;
  pitch_count?: number | null;
};

export type ScoresheetGame = {
  game_id: string;
  first_team: number;
  last_team: number;
  first_team_name: string;
  last_team_name: string;
  first_run: NullableNumber;
  last_run: NullableNumber;
  current_inning: NullableNumber;
  isTop: NullableNumber;
  current_out: NullableNumber;
  ball: NullableNumber;
  strike: NullableNumber;
  is1st: NullableNumber;
  is2nd: NullableNumber;
  is3rd: NullableNumber;
  batter_name: string | null | undefined;
  pitcher_name: string | null | undefined;
  locked: NullableNumber;
  batting?: ScoresheetBatting[];
  pitching?: ScoresheetPitching[];
} & Partial<Record<`top_${InningKey}` | `bottom_${InningKey}`, NullableNumber>>;

export type ScoresheetMember = {
  player_id: number;
  name: string;
  order_number: number;
  position?: number | null;
  is_first: number;
};

export type ScoresheetSnapshot = {
  game: ScoresheetGame;
  /** null = not fetched yet; lineups are left untouched */
  members: ScoresheetMember[] | null;
};

type Side = 'away' | 'home';

const MAX_BALLS = 3;
const MAX_STRIKES = 2;
const MAX_OUTS = 3;
const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

const toNumber = (value: NullableNumber, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

/** scoresheet team names may contain <br> for line breaks */
const cleanTeamName = (name: string): string => name.replace(/<br\s*\/?>/gi, '').trim();

const memberSide = (member: { is_first: number }): Side => (Number(member.is_first) === 1 ? 'home' : 'away');

const playerId = (scoresheetPlayerId: number): string => `ss-${scoresheetPlayerId}`;

/** Extracts the game ID (UUID) from user input: a bare ID or a game page URL */
export const extractScoresheetGameId = (input: string): string | null => {
  const match = input.trim().match(UUID_PATTERN);
  return match ? match[0].toLowerCase() : null;
};

const inningScoresFor = (game: ScoresheetGame, prefix: 'top' | 'bottom', current: (number | null)[]): (number | null)[] => {
  const values = INNING_KEYS.map((key) => {
    const value = game[`${prefix}_${key}`];
    return typeof value === 'number' ? value : null;
  });
  const lastPlayed = values.reduce<number>((last, value, idx) => (value === null ? last : idx + 1), 0);
  const length = Math.max(current.length, lastPlayed);
  return Array.from({ length }, (_, idx) => values[idx] ?? null);
};

const sideOfPlayer = (game: ScoresheetGame, members: ScoresheetMember[] | null) => {
  const sideByPlayer = new Map<number, Side>((members ?? []).map((m) => [m.player_id, memberSide(m)]));
  return (batting: ScoresheetBatting): Side =>
    sideByPlayer.get(batting.player_id) ?? (batting.team_id === game.first_team ? 'away' : 'home');
};

const teamHits = (game: ScoresheetGame, members: ScoresheetMember[] | null, side: Side): number => {
  const sideOf = sideOfPlayer(game, members);
  return (game.batting ?? [])
    .filter((b) => sideOf(b) === side)
    .reduce((sum, b) => sum + toNumber(b.hit, 0), 0);
};

const battingStats = (batting: ScoresheetBatting | undefined): Partial<Player> => {
  if (!batting) return { stat: '0-0', hits: 0, rbi: 0, runs: 0, walks: 0 };
  const hits = toNumber(batting.hit, 0);
  return {
    stat: `${hits}-${toNumber(batting.at_bats, 0)}`,
    hits,
    rbi: toNumber(batting.rbi, 0),
    runs: toNumber(batting.run, 0),
    walks: toNumber(batting.four_ball, 0),
  };
};

const buildLineup = (game: ScoresheetGame, members: ScoresheetMember[], side: Side): Player[] => {
  const battingById = new Map((game.batting ?? []).map((b) => [b.player_id, b]));
  return members
    .filter((m) => memberSide(m) === side)
    .slice()
    .sort((a, b) => a.order_number - b.order_number)
    .map((m) => ({
      id: playerId(m.player_id),
      name: m.name,
      number: '',
      ...battingStats(battingById.get(m.player_id)),
    }) as Player);
};

const buildPitcher = (game: ScoresheetGame, members: ScoresheetMember[] | null, side: Side, current: Player): Player => {
  const name = game.pitcher_name;
  if (!name) return current;
  const member = (members ?? []).find((m) => memberSide(m) === side && m.name === name);
  const pitching = (game.pitching ?? []).find((p) => p.name === name);
  const pitchCount = toNumber(pitching?.pitch_count, 0);
  return {
    ...current,
    id: member ? playerId(member.player_id) : `ss-name-${name}`,
    name,
    number: '',
    stat: String(pitchCount),
    pitchCount,
  };
};

const applyTeam = (
  team: Team,
  game: ScoresheetGame,
  members: ScoresheetMember[] | null,
  side: Side,
  live: { isTop: boolean; started: boolean },
): Team => {
  const isAway = side === 'away';
  const name = cleanTeamName(isAway ? game.first_team_name : game.last_team_name);
  const isBatting = live.started && live.isTop === isAway;
  const isFielding = live.started && !isBatting;
  const lineup = members ? buildLineup(game, members, side) : team.lineup;
  const batterIndex = isBatting && game.batter_name ? lineup.findIndex((p) => p.name === game.batter_name) : -1;

  return {
    ...team,
    name,
    fullName: name,
    score: toNumber(isAway ? game.first_run : game.last_run, 0),
    hits: teamHits(game, members, side),
    inningScores: inningScoresFor(game, isAway ? 'top' : 'bottom', team.inningScores),
    lineup,
    bench: members ? [] : team.bench,
    currentBatterIndex: batterIndex >= 0 ? batterIndex : Math.min(team.currentBatterIndex, Math.max(lineup.length - 1, 0)),
    pitcher: isFielding ? buildPitcher(game, members, side, team.pitcher) : team.pitcher,
  };
};

/** Overwrites only the fields scoresheet provides. Display settings, timer, colors and logos are kept */
export const applyScoresheetSnapshot = (state: GameState, snapshot: ScoresheetSnapshot): GameState => {
  const { game, members } = snapshot;
  const started = typeof game.current_inning === 'number' && game.current_inning > 0;
  const isTop = started ? Number(game.isTop) === 1 : state.isTop;
  const live = { isTop, started };
  const awayTeam = applyTeam(state.awayTeam, game, members, 'away', live);
  const homeTeam = applyTeam(state.homeTeam, game, members, 'home', live);

  if (!started) {
    return { ...state, awayTeam, homeTeam };
  }

  const fieldingTeam = isTop ? homeTeam : awayTeam;
  return {
    ...state,
    awayTeam,
    homeTeam,
    inning: toNumber(game.current_inning, state.inning),
    isTop,
    outs: clamp(toNumber(game.current_out, 0), 0, MAX_OUTS),
    balls: clamp(toNumber(game.ball, 0), 0, MAX_BALLS),
    strikes: clamp(toNumber(game.strike, 0), 0, MAX_STRIKES),
    // Base fields may hold the runner's player ID, so any non-zero value means occupied
    bases: [Boolean(Number(game.is1st)), Boolean(Number(game.is2nd)), Boolean(Number(game.is3rd))],
    baseRunners: undefined,
    pitcher: fieldingTeam.pitcher,
  };
};

/** Whether the batter is in the batting team's lineup. If not (e.g. pinch hitter), members should be refetched */
export const isBatterInLineup = (state: GameState, game: ScoresheetGame): boolean => {
  if (!game.batter_name) return true;
  const battingTeam = Number(game.isTop) === 1 ? state.awayTeam : state.homeTeam;
  return battingTeam.lineup.some((p) => p.name === game.batter_name);
};
