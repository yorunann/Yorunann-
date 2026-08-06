import { useEffect, useRef } from 'react';
import { ActionType, GameState } from '../types';

export type ShortcutAction = 
  | 'INCREMENT_BALL'
  | 'INCREMENT_STRIKE'
  | 'INCREMENT_OUT'
  | 'TOGGLE_BASE_1'
  | 'TOGGLE_BASE_2'
  | 'TOGGLE_BASE_3'
  | 'INCREMENT_PITCH_COUNT'
  | 'DECREMENT_PITCH_COUNT'
  | 'NEXT_BATTER'
  | 'PREVIOUS_BATTER'
  | 'TOGGLE_TIMER'
  | 'NEXT_HALF_INNING'
  | 'PREVIOUS_HALF_INNING'
  | 'NEXT_FULL_INNING'
  | 'PREVIOUS_FULL_INNING'
  | 'ADD_AWAY_SCORE'
  | 'ADD_HOME_SCORE'
  | 'HOME_RUN'
  | 'RESET_COUNT'
  | 'SINGLE'
  | 'DOUBLE'
  | 'TRIPLE'
  | 'RESET_SCORE'
  | 'TOGGLE_DISPLAY_MODE'
  | 'TOGGLE_LINEUP_MODE'
  | 'TOGGLE_RHE_MODE';

export type ShortcutMap = Record<ShortcutAction, string>;

export const DEFAULT_SHORTCUTS: ShortcutMap = {
  INCREMENT_BALL: '1',
  INCREMENT_STRIKE: '2',
  INCREMENT_OUT: '3',
  TOGGLE_BASE_1: '6',
  TOGGLE_BASE_2: '8',
  TOGGLE_BASE_3: '4',
  INCREMENT_PITCH_COUNT: 'z',
  DECREMENT_PITCH_COUNT: 'x',
  NEXT_BATTER: 'a',
  PREVIOUS_BATTER: 's',
  TOGGLE_TIMER: ' ',
  NEXT_HALF_INNING: 'ArrowDown',
  PREVIOUS_HALF_INNING: 'ArrowUp',
  NEXT_FULL_INNING: 'ArrowRight',
  PREVIOUS_FULL_INNING: 'ArrowLeft',
  ADD_AWAY_SCORE: '[',
  ADD_HOME_SCORE: ']',
  HOME_RUN: 'Enter',
  RESET_COUNT: '0',
  SINGLE: 'q',
  DOUBLE: 'w',
  TRIPLE: 'e',
  RESET_SCORE: 'Backspace',
  TOGGLE_DISPLAY_MODE: 'l',
  TOGGLE_LINEUP_MODE: 'n',
  TOGGLE_RHE_MODE: 'm',
};

export const useShortcuts = (
  enabled: boolean,
  shortcuts: ShortcutMap,
  dispatch: (action: ActionType) => void,
  state: GameState
) => {
  const activeKeysRef = useRef<Record<string, { timer: NodeJS.Timeout, isLongPressed: boolean }>>({});
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      if (e.repeat) return; // Ignore continuous input

      // Hardcoded Ctrl+Z or Cmd+Z for Undo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
        return;
      }

      const key = e.key;
      const code = e.code;
      const keyId = code || key;

      const isMatch = (action: ShortcutAction) => {
        const boundKey = shortcuts[action];
        if (!boundKey) return false;
        return key.toLowerCase() === boundKey.toLowerCase() || code === boundKey;
      };

      // Prevent default scrolling for space and arrow keys if they are bound
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        const isBound = Object.values(shortcuts).includes(key) || Object.values(shortcuts).includes(code);
        if (isBound) {
          e.preventDefault();
        }
      }

      // Find matched action
      let matchedAction: ShortcutAction | null = null;
      for (const action of Object.keys(shortcuts) as ShortcutAction[]) {
        if (isMatch(action)) {
          matchedAction = action;
          break;
        }
      }

      if (!matchedAction) return;

      // Start long press timer
      const timer = setTimeout(() => {
        if (activeKeysRef.current[keyId]) {
          activeKeysRef.current[keyId].isLongPressed = true;
        }
        
        // Execute long press action
        switch (matchedAction) {
          case 'HOME_RUN': {
            const team = stateRef.current.isTop ? stateRef.current.awayTeam : stateRef.current.homeTeam;
            const batter = team.lineup[team.currentBatterIndex] || { name: 'Unknown' };
            const runnersOnBase = stateRef.current.bases.filter(Boolean).length;
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
            setTimeout(() => {
              dispatch({ type: 'SET_ANIMATION', animation: null });
            }, 5000);
            break;
          }
          case 'TOGGLE_BASE_1':
            dispatch({ type: 'SINGLE' });
            break;
          case 'TOGGLE_BASE_2':
            dispatch({ type: 'DOUBLE' });
            break;
          case 'TOGGLE_BASE_3':
            dispatch({ type: 'TRIPLE' });
            break;
          case 'INCREMENT_BALL':
            dispatch({ type: 'DECREMENT_BALL' });
            break;
          case 'INCREMENT_STRIKE':
            dispatch({ type: 'DECREMENT_STRIKE' });
            break;
          case 'INCREMENT_OUT':
            dispatch({ type: 'DECREMENT_OUT' });
            break;
          case 'TOGGLE_TIMER':
            dispatch({ type: 'RESET_TIMER' });
            break;
          case 'ADD_AWAY_SCORE':
            dispatch({ type: 'ADD_SCORE', team: 'away', amount: -1 });
            break;
          case 'ADD_HOME_SCORE':
            dispatch({ type: 'ADD_SCORE', team: 'home', amount: -1 });
            break;
          case 'RESET_SCORE':
            dispatch({ type: 'RESET_SCORE' });
            break;
          // For other keys, we might not have a specific undo, so do nothing on long press
        }
      }, ['HOME_RUN', 'RESET_SCORE'].includes(matchedAction as string) ? 1000 : 500);

      activeKeysRef.current[keyId] = { timer, isLongPressed: false };
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key;
      const code = e.code;
      const keyId = code || key;
      
      const keyState = activeKeysRef.current[keyId];

      if (keyState) {
        clearTimeout(keyState.timer);
        
        if (!keyState.isLongPressed) {
          // Find matched action again for short press
          let matchedAction: ShortcutAction | null = null;
          for (const action of Object.keys(shortcuts) as ShortcutAction[]) {
            const boundKey = shortcuts[action];
            if (boundKey && (key.toLowerCase() === boundKey.toLowerCase() || code === boundKey)) {
              matchedAction = action;
              break;
            }
          }

          if (matchedAction && matchedAction !== 'HOME_RUN') {
            // Execute short press action
            switch (matchedAction) {
              case 'INCREMENT_BALL': dispatch({ type: 'INCREMENT_BALL' }); break;
              case 'INCREMENT_STRIKE': dispatch({ type: 'INCREMENT_STRIKE' }); break;
              case 'INCREMENT_OUT': dispatch({ type: 'INCREMENT_OUT' }); break;
              case 'TOGGLE_BASE_1': dispatch({ type: 'TOGGLE_BASE', baseIndex: 0 }); break;
              case 'TOGGLE_BASE_2': dispatch({ type: 'TOGGLE_BASE', baseIndex: 1 }); break;
              case 'TOGGLE_BASE_3': dispatch({ type: 'TOGGLE_BASE', baseIndex: 2 }); break;
              case 'INCREMENT_PITCH_COUNT': dispatch({ type: 'INCREMENT_PLAYER_STAT', role: 'pitcher' }); break;
              case 'DECREMENT_PITCH_COUNT': dispatch({ type: 'DECREMENT_PLAYER_STAT', role: 'pitcher' }); break;
              case 'NEXT_BATTER': dispatch({ type: 'NEXT_BATTER' }); break;
              case 'PREVIOUS_BATTER': dispatch({ type: 'PREVIOUS_BATTER' }); break;
              case 'TOGGLE_TIMER': dispatch({ type: 'TOGGLE_TIMER' }); break;
              case 'NEXT_HALF_INNING': dispatch({ type: 'NEXT_INNING' }); break;
              case 'PREVIOUS_HALF_INNING': dispatch({ type: 'PREVIOUS_HALF_INNING' }); break;
              case 'NEXT_FULL_INNING': dispatch({ type: 'NEXT_FULL_INNING' }); break;
              case 'PREVIOUS_FULL_INNING': dispatch({ type: 'PREVIOUS_FULL_INNING' }); break;
              case 'ADD_AWAY_SCORE': dispatch({ type: 'ADD_SCORE', team: 'away', amount: 1 }); break;
              case 'ADD_HOME_SCORE': dispatch({ type: 'ADD_SCORE', team: 'home', amount: 1 }); break;
              case 'RESET_COUNT': dispatch({ type: 'RESET_COUNT' }); break;
              case 'SINGLE': dispatch({ type: 'SINGLE' }); break;
              case 'DOUBLE': dispatch({ type: 'DOUBLE' }); break;
              case 'TRIPLE': dispatch({ type: 'TRIPLE' }); break;
              case 'TOGGLE_DISPLAY_MODE': dispatch({ type: 'TOGGLE_DISPLAY_MODE' }); break;
              case 'TOGGLE_LINEUP_MODE': dispatch({ type: 'TOGGLE_LINEUP_MODE' }); break;
              case 'TOGGLE_RHE_MODE': dispatch({ type: 'TOGGLE_RHE_MODE' }); break;
            }
          }
        }
        
        delete activeKeysRef.current[keyId];
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [enabled, shortcuts, dispatch]);
};
