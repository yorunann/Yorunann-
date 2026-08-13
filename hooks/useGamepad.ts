import { useEffect, useRef, useState } from 'react';
import { ActionType, GameState } from '../types';

export const useGamepad = (
  enabled: boolean,
  dispatch: (action: ActionType) => void,
  state: GameState,
  onResetRequest: () => void,
  isResetConfirmOpen: boolean,
  onConfirmReset: () => void,
  onCancelReset: () => void
) => {
  const stateRef = useRef(state);
  const [isConnected, setIsConnected] = useState(false);
  
  // Keep track of button states to prevent continuous firing (debounce/edge detection)
  const prevButtonsRef = useRef<boolean[]>(new Array(20).fill(false));
  const buttonPressTimesRef = useRef<number[]>(new Array(20).fill(0));
  const lastActionTimeRef = useRef<number[]>(new Array(20).fill(0));
  const sticksDownRef = useRef(false);
  const sticksUpRef = useRef(false);
  
  // Keep track of isResetConfirmOpen in a ref to avoid stale closures in pollGamepad
  const isResetConfirmOpenRef = useRef(isResetConfirmOpen);
  useEffect(() => {
    isResetConfirmOpenRef.current = isResetConfirmOpen;
  }, [isResetConfirmOpen]);
  
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!enabled) return;

    let animationFrameId: number;

    const handleGamepadConnected = (e: GamepadEvent) => {
      console.log('Gamepad connected:', e.gamepad.id);
      setIsConnected(true);
    };

    const handleGamepadDisconnected = (e: GamepadEvent) => {
      console.log('Gamepad disconnected:', e.gamepad.id);
      setIsConnected(false);
    };

    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);

    const pollGamepad = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads[0]; // Use the first connected gamepad

      if (gp) {
        if (!isConnected) setIsConnected(true);

        const now = Date.now();
        const prevButtons = prevButtonsRef.current;
        const pressTimes = buttonPressTimesRef.current;

        gp.buttons.forEach((button, index) => {
          const isPressed = button.pressed;
          const wasPressed = prevButtons[index];
          const lastActionTime = lastActionTimeRef.current[index];
          const COOLDOWN = 200; // 200ms cooldown between same button actions

          if (isPressed && !wasPressed) {
            // Button just pressed
            pressTimes[index] = now;
          } else if (!isPressed && wasPressed) {
            // Button just released
            const pressDuration = now - pressTimes[index];
            const isLongPress = pressDuration >= 1000; // 1 second for long press

            // Handle short press actions
            if (!isLongPress && pressTimes[index] !== -1 && (now - lastActionTime > COOLDOWN)) {
              lastActionTimeRef.current[index] = now;
              if (isResetConfirmOpenRef.current) {
                // If reset modal is open, intercept specific buttons
                if (index === 0) { // Cross -> Confirm
                  onConfirmReset();
                } else if (index === 1) { // Circle -> Cancel
                  onCancelReset();
                }
                return; // Skip normal actions
              }

              switch (index) {
                case 3: // Triangle
                  dispatch({ type: 'INCREMENT_BALL' });
                  break;
                case 1: // Circle
                  dispatch({ type: 'INCREMENT_STRIKE' });
                  break;
                case 0: // Cross
                  dispatch({ type: 'INCREMENT_OUT' });
                  break;
                case 2: // Square
                  dispatch({ type: 'RESET_COUNT' });
                  break;
                case 15: // D-Pad Right
                  dispatch({ type: 'TOGGLE_BASE', baseIndex: 0 });
                  break;
                case 12: // D-Pad Up
                  dispatch({ type: 'TOGGLE_BASE', baseIndex: 1 });
                  break;
                case 14: // D-Pad Left
                  dispatch({ type: 'TOGGLE_BASE', baseIndex: 2 });
                  break;
                case 13: // D-Pad Down (Removed short press, moved to long press)
                  break;
                case 5: // R1
                  if (!stateRef.current.showPitcherInfo) {
                    dispatch({ type: 'SET_VISIBILITY', field: 'showPitcherInfo', value: true });
                  } else {
                    dispatch({ type: 'NEXT_BATTER' });
                  }
                  break;
                case 4: // L1
                  if (!stateRef.current.showBatterInfo) {
                    dispatch({ type: 'SET_VISIBILITY', field: 'showBatterInfo', value: true });
                    dispatch({ type: 'NEXT_BATTER' });
                  } else {
                    dispatch({ type: 'PREVIOUS_BATTER' });
                  }
                  break;
                case 7: // R2
                  dispatch({ type: 'ADD_SCORE', team: 'home', amount: 1 });
                  break;
                case 6: // L2
                  dispatch({ type: 'ADD_SCORE', team: 'away', amount: 1 });
                  break;
                case 9: // Options
                  dispatch({ type: 'TOGGLE_DISPLAY_MODE' });
                  break;
                case 8: // Share
                  dispatch({ type: 'TOGGLE_TIMER' });
                  break;
              }
            }
          } else if (isPressed && wasPressed) {
            // Button is being held down
            const pressDuration = now - pressTimes[index];
            
            // Handle long press actions (trigger once while holding)
            // We use a special value (-1) to indicate the long press has been handled
            if (pressDuration >= 1000 && pressTimes[index] !== -1) {
              if (isResetConfirmOpenRef.current) return; // Disable long press in modal

              switch (index) {
                case 0: // Cross (Long Press)
                  dispatch({ type: 'INCREMENT_OUT' });
                  dispatch({ type: 'NEXT_BATTER' });
                  dispatch({ type: 'RESET_COUNT' });
                  pressTimes[index] = -1;
                  break;
                case 4: // L1 (Long Press)
                  dispatch({ type: 'SET_VISIBILITY', field: 'showBatterInfo', value: false });
                  pressTimes[index] = -1;
                  break;
                case 5: // R1 (Long Press)
                  dispatch({ type: 'SET_VISIBILITY', field: 'showPitcherInfo', value: false });
                  pressTimes[index] = -1;
                  break;
                case 15: // D-Pad Right (Long Press)
                  dispatch({ type: 'SINGLE' });
                  pressTimes[index] = -1;
                  break;
                case 12: // D-Pad Up (Long Press)
                  dispatch({ type: 'DOUBLE' });
                  pressTimes[index] = -1;
                  break;
                case 14: // D-Pad Left (Long Press)
                  dispatch({ type: 'TRIPLE' });
                  pressTimes[index] = -1;
                  break;
                case 13: // D-Pad Down (Long Press)
                  // Clear bases: dispatch TOGGLE_BASE for any occupied base
                  if (stateRef.current.bases[0]) dispatch({ type: 'TOGGLE_BASE', baseIndex: 0 });
                  if (stateRef.current.bases[1]) dispatch({ type: 'TOGGLE_BASE', baseIndex: 1 });
                  if (stateRef.current.bases[2]) dispatch({ type: 'TOGGLE_BASE', baseIndex: 2 });
                  pressTimes[index] = -1;
                  break;
                case 8: // Share (Long Press)
                  dispatch({ type: 'UNDO' });
                  pressTimes[index] = -1;
                  break;
                case 9: // Options (Long Press)
                  onResetRequest();
                  pressTimes[index] = -1; // Mark as handled
                  break;
                case 17: // Touchpad (Long Press)
                  // Home Run Animation
                  const team = stateRef.current.isTop ? stateRef.current.awayTeam : stateRef.current.homeTeam;
                  const batter = team.lineup[team.currentBatterIndex];
                  const playerName = batter ? (batter.number ? `${batter.name} #${batter.number}` : batter.name) : 'Unknown';
                  const runnersOnBase = stateRef.current.bases.filter(Boolean).length;
                  let animationType: 'homerun' | '2-run-homer' | '3-run-homer' | 'grand-slam' = 'homerun';
                  if (runnersOnBase === 1) animationType = '2-run-homer';
                  else if (runnersOnBase === 2) animationType = '3-run-homer';
                  else if (runnersOnBase === 3) animationType = 'grand-slam';

                  dispatch({ 
                    type: 'SET_ANIMATION', 
                    animation: {
                      type: animationType,
                      playerName,
                      teamName: team.name,
                      teamColor: team.color
                    }
                  });
                  dispatch({ type: 'HOME_RUN' });
                  setTimeout(() => {
                    dispatch({ type: 'SET_ANIMATION', animation: null });
                  }, 5000);
                  
                  pressTimes[index] = -1; // Mark as handled
                  break;
              }
            }
          }

          prevButtons[index] = isPressed;
        });

        // Handle analog sticks for Next/Previous Inning
        // axes[1] is Left Stick Y, axes[3] is Right Stick Y
        // Positive values mean pushing down (towards the user)
        // Negative values mean pushing up (away from the user)
        if (gp.axes.length >= 4 && !isResetConfirmOpenRef.current) {
          const leftStickDown = gp.axes[1] > 0.8;
          const rightStickDown = gp.axes[3] > 0.8;
          const leftStickUp = gp.axes[1] < -0.8;
          const rightStickUp = gp.axes[3] < -0.8;
          
          if (leftStickDown && rightStickDown) {
            if (!sticksDownRef.current) {
              dispatch({ type: 'NEXT_INNING' });
              sticksDownRef.current = true;
            }
          } else {
            sticksDownRef.current = false;
          }

          if (leftStickUp && rightStickUp) {
            if (!sticksUpRef.current) {
              dispatch({ type: 'PREVIOUS_HALF_INNING' });
              sticksUpRef.current = true;
            }
          } else {
            sticksUpRef.current = false;
          }
        }
      } else {
        if (isConnected) setIsConnected(false);
      }

      animationFrameId = requestAnimationFrame(pollGamepad);
    };

    animationFrameId = requestAnimationFrame(pollGamepad);

    return () => {
      window.removeEventListener('gamepadconnected', handleGamepadConnected);
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);
      cancelAnimationFrame(animationFrameId);
    };
  }, [enabled, dispatch, onResetRequest, isConnected]);

  return isConnected;
};
