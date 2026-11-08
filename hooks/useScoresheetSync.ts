import { useCallback, useEffect, useRef, useState } from 'react';
import type { ActionType, GameState } from '../types';
import {
  isBatterInLineup,
  type ScoresheetGame,
  type ScoresheetMember,
} from '../utils/scoresheetSync';

/**
 * Polls a scoresheet game and applies it to GameState (read-only, GET only).
 * Only the host console polls; display windows and OBS receive it through the existing sync.
 */

// Defaults to the Vite dev proxy. Override with VITE_SCORESHEET_API_BASE to use another relay
const API_BASE: string = import.meta.env.VITE_SCORESHEET_API_BASE || '/scoresheet-api';
// scoresheet caches /game/:id for 30s even during a game (cleared only when the game is finalized).
// Polling faster does not help; updates appear at most ~30s + this interval after the scorer confirms

const POLL_INTERVAL_MS = 15_000;
// Minimum interval for refetching members when the batter is not in the lineup (e.g. pinch hitter)
const MEMBER_REFRESH_MIN_INTERVAL_MS = 60_000;

export type ScoresheetSyncStatus = 'idle' | 'loading' | 'live' | 'final' | 'error';

export interface ScoresheetSyncState {
  status: ScoresheetSyncStatus;
  gameId: string | null;
  lastUpdatedAt: number | null;
  error: string | null;
}

interface Options {
  enabled: boolean;
  dispatch: (action: ActionType) => void;
  getState: () => GameState;
}

const fetchJson = async <T,>(path: string, signal: AbortSignal): Promise<T> => {
  const res = await fetch(`${API_BASE}${path}`, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(res.status === 404 ? 'NOT_FOUND' : `HTTP_${res.status}`);
  }
  return (await res.json()) as T;
};

const isScoresheetGame = (value: unknown): value is ScoresheetGame =>
  typeof value === 'object' && value !== null && typeof (value as ScoresheetGame).game_id === 'string';

const isMemberList = (value: unknown): value is ScoresheetMember[] =>
  Array.isArray(value) && value.every((m) => typeof m?.player_id === 'number' && typeof m?.name === 'string');

const INITIAL_SYNC_STATE: ScoresheetSyncState = { status: 'idle', gameId: null, lastUpdatedAt: null, error: null };

export function useScoresheetSync({ enabled, dispatch, getState }: Options) {
  const [syncState, setSyncState] = useState<ScoresheetSyncState>(INITIAL_SYNC_STATE);
  const [gameId, setGameId] = useState<string | null>(null);
  const membersRef = useRef<ScoresheetMember[] | null>(null);
  const membersFetchedAtRef = useRef(0);
  const lastPayloadRef = useRef<string | null>(null);

  const start = useCallback((id: string) => {
    membersRef.current = null;
    membersFetchedAtRef.current = 0;
    lastPayloadRef.current = null;
    setGameId(id);
  }, []);

  const stop = useCallback(() => setGameId(null), []);

  useEffect(() => {
    if (!enabled || !gameId) {
      setSyncState(INITIAL_SYNC_STATE);
      return;
    }

    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    setSyncState({ status: 'loading', gameId, lastUpdatedAt: null, error: null });

    const loadMembers = async (): Promise<void> => {
      const members = await fetchJson<unknown>(`/game_member/${gameId}`, controller.signal);
      if (!isMemberList(members)) throw new Error('INVALID_RESPONSE');
      membersRef.current = members;
      membersFetchedAtRef.current = Date.now();
    };

    const poll = async (): Promise<void> => {
      try {
        const game = await fetchJson<unknown>(`/game/${gameId}`, controller.signal);
        if (!isScoresheetGame(game)) throw new Error('INVALID_RESPONSE');

        const canRefreshMembers = Date.now() - membersFetchedAtRef.current >= MEMBER_REFRESH_MIN_INTERVAL_MS;
        if (!membersRef.current || (canRefreshMembers && !isBatterInLineup(getState(), game))) {
          await loadMembers();
        }

        const snapshot = { game, members: membersRef.current };
        const payload = JSON.stringify(snapshot);
        if (payload !== lastPayloadRef.current) {
          lastPayloadRef.current = payload;
          dispatch({ type: 'APPLY_SCORESHEET_SNAPSHOT', snapshot });
        }

        const isFinal = Number(game.locked) === 1;
        setSyncState({ status: isFinal ? 'final' : 'live', gameId, lastUpdatedAt: Date.now(), error: null });
        if (!isFinal) timer = setTimeout(poll, POLL_INTERVAL_MS);
      } catch (error) {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : 'UNKNOWN';
        setSyncState((prev) => ({ ...prev, status: 'error', error: message }));
        // Keep polling through transient errors; stop if the game does not exist
        if (message !== 'NOT_FOUND') timer = setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    poll();
    return () => {
      controller.abort();
      if (timer) clearTimeout(timer);
    };
  }, [enabled, gameId, dispatch, getState]);

  return { syncState, start, stop };
}
