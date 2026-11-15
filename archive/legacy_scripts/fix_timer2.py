import re

with open('components/ScoreboardDisplay.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace away player timer logic
old_away_timer = '''                      {!isAwayBatter && showBroadcastTimer && (
                        <div 
                          className={`font-display text-2xl shrink-0 cursor-pointer ${state.timer <= 8 && state.isTimerRunning ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}
                          onClick={(e) => {
                            if (state.isAdjustmentMode) {
                              e.stopPropagation();
                              dispatch({ type: 'UPDATE_META', field: 'broadcastShowTimer', value: false });
                            }
                          }}
                          title={state.isAdjustmentMode ? "Hide timer in broadcast mode" : undefined}
                        >
                          {state.timer}
                        </div>
                      )}'''

new_away_timer = '''                      {!isAwayBatter && state.showTimer && (showBroadcastTimer || state.isAdjustmentMode) && (
                        <div 
                          className={`font-display text-2xl shrink-0 ${state.isAdjustmentMode ? 'cursor-pointer' : ''} ${state.timer <= 8 && state.isTimerRunning && showBroadcastTimer ? 'text-red-500 animate-pulse' : 'text-yellow-400'} ${!showBroadcastTimer ? 'opacity-30' : ''}`}
                          onClick={(e) => {
                            if (state.isAdjustmentMode) {
                              e.stopPropagation();
                              dispatch({ type: 'UPDATE_META', field: 'broadcastShowTimer', value: !showBroadcastTimer });
                            }
                          }}
                          title={state.isAdjustmentMode ? "Toggle timer in broadcast mode" : undefined}
                        >
                          {state.timer}
                        </div>
                      )}'''
text = text.replace(old_away_timer, new_away_timer)

# Replace home player timer logic
old_home_timer = '''                      {!isHomeBatter && showBroadcastTimer && (
                        <div 
                          className={`font-display text-2xl shrink-0 cursor-pointer ${state.timer <= 8 && state.isTimerRunning ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}
                          onClick={(e) => {
                            if (state.isAdjustmentMode) {
                              e.stopPropagation();
                              dispatch({ type: 'UPDATE_META', field: 'broadcastShowTimer', value: false });
                            }
                          }}
                          title={state.isAdjustmentMode ? "Hide timer in broadcast mode" : undefined}
                        >
                          {state.timer}
                        </div>
                      )}'''

new_home_timer = '''                      {!isHomeBatter && state.showTimer && (showBroadcastTimer || state.isAdjustmentMode) && (
                        <div 
                          className={`font-display text-2xl shrink-0 ${state.isAdjustmentMode ? 'cursor-pointer' : ''} ${state.timer <= 8 && state.isTimerRunning && showBroadcastTimer ? 'text-red-500 animate-pulse' : 'text-yellow-400'} ${!showBroadcastTimer ? 'opacity-30' : ''}`}
                          onClick={(e) => {
                            if (state.isAdjustmentMode) {
                              e.stopPropagation();
                              dispatch({ type: 'UPDATE_META', field: 'broadcastShowTimer', value: !showBroadcastTimer });
                            }
                          }}
                          title={state.isAdjustmentMode ? "Toggle timer in broadcast mode" : undefined}
                        >
                          {state.timer}
                        </div>
                      )}'''
text = text.replace(old_home_timer, new_home_timer)

with open('components/ScoreboardDisplay.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
