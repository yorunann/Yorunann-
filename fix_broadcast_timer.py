import re
with open('components/ScoreboardDisplay.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

bad_away = '''                      {!isAwayBatter && state.showTimer && (showBroadcastTimer || state.isAdjustmentMode) && (
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
                      )}
                      {isAwayBatter && (showBroadcastPitchCount || state.isAdjustmentMode) && (
                        <div 
                          className={`font-display text-lg shrink-0 ${state.isAdjustmentMode ? 'cursor-pointer' : ''} text-slate-300 font-bold ${!showBroadcastPitchCount ? 'opacity-30' : ''}`}
                          onClick={(e) => {
                            if (state.isAdjustmentMode) {
                              e.stopPropagation();
                              dispatch({ type: 'UPDATE_META', field: 'broadcastShowPitchCount', value: !showBroadcastPitchCount });
                            }
                          }}
                          title={state.isAdjustmentMode ? "Toggle pitch count in broadcast mode" : undefined}
                        >
                          P:{'stat' in homePlayer ? homePlayer.stat.replace('P: ', '') : '0'}
                        </div>
                      )}
                      {!isAwayBatter && (showBroadcastPitchCount || state.isAdjustmentMode) && (
                        <div 
                          className={`font-display text-lg shrink-0 ${state.isAdjustmentMode ? 'cursor-pointer' : ''} text-slate-300 font-bold ${!showBroadcastPitchCount ? 'opacity-30' : ''}`}
                          onClick={(e) => {
                            if (state.isAdjustmentMode) {
                              e.stopPropagation();
                              dispatch({ type: 'UPDATE_META', field: 'broadcastShowPitchCount', value: !showBroadcastPitchCount });
                            }
                          }}
                          title={state.isAdjustmentMode ? "Toggle pitch count in broadcast mode" : undefined}
                        >
                          P:{'stat' in awayPlayer ? awayPlayer.stat.replace('P: ', '') : '0'}
                        </div>
                      )}'''

correct_away = '''                      {isAwayBatter && state.showTimer && (showBroadcastTimer || state.isAdjustmentMode) && (
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
                      )}
                      {!isAwayBatter && (showBroadcastPitchCount || state.isAdjustmentMode) && (
                        <div 
                          className={`font-display text-lg shrink-0 ${state.isAdjustmentMode ? 'cursor-pointer' : ''} text-slate-300 font-bold ${!showBroadcastPitchCount ? 'opacity-30' : ''}`}
                          onClick={(e) => {
                            if (state.isAdjustmentMode) {
                              e.stopPropagation();
                              dispatch({ type: 'UPDATE_META', field: 'broadcastShowPitchCount', value: !showBroadcastPitchCount });
                            }
                          }}
                          title={state.isAdjustmentMode ? "Toggle pitch count in broadcast mode" : undefined}
                        >
                          P:{'stat' in awayPlayer ? awayPlayer.stat.replace('P: ', '') : '0'}
                        </div>
                      )}'''

text = text.replace(bad_away, correct_away)

with open('components/ScoreboardDisplay.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

