import re

with open('components/ScoreboardDisplay.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update pitchInfoHeight
old_pitch_info = "const pitchInfoHeight = (state.showCount || state.showTimer) ? 48 : 0;"
new_pitch_info = "const pitchInfoHeight = state.showCount ? 48 : 0;\n    const showBroadcastTimer = state.showTimer && (state.meta.broadcastShowTimer ?? true);"
text = text.replace(old_pitch_info, new_pitch_info)

# 2. Add Timer to Away Player Row
old_away_player = '''                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentAwayKey}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3 }}
                      className="flex-1 min-w-0 flex items-center h-full"
                    >
                      <AutoScalingText text={`${awayPlayer.name} ${('number' in awayPlayer && awayPlayer.number) ? '#' + awayPlayer.number : ''}`} className="leading-none" align="left" />
                    </motion.div>
                  </AnimatePresence>
                </div>'''

new_away_player = '''                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentAwayKey}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3 }}
                      className="flex-1 min-w-0 flex items-center h-full justify-between gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <AutoScalingText text={`${awayPlayer.name} ${('number' in awayPlayer && awayPlayer.number) ? '#' + awayPlayer.number : ''}`} className="leading-none" align="left" />
                      </div>
                      {!isAwayBatter && showBroadcastTimer && (
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
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>'''
text = text.replace(old_away_player, new_away_player)

# 3. Add Timer to Home Player Row
old_home_player = '''                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentHomeKey}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3 }}
                      className="flex-1 min-w-0 flex items-center h-full"
                    >
                      <AutoScalingText text={`${homePlayer.name} ${('number' in homePlayer && homePlayer.number) ? '#' + homePlayer.number : ''}`} className="leading-none" align="left" />
                    </motion.div>
                  </AnimatePresence>
                </div>'''

new_home_player = '''                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentHomeKey}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3 }}
                      className="flex-1 min-w-0 flex items-center h-full justify-between gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <AutoScalingText text={`${homePlayer.name} ${('number' in homePlayer && homePlayer.number) ? '#' + homePlayer.number : ''}`} className="leading-none" align="left" />
                      </div>
                      {!isHomeBatter && showBroadcastTimer && (
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
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>'''
text = text.replace(old_home_player, new_home_player)

# 4. Remove Timer from Bottom Row
old_bottom_row = '''          {/* Bottom Row: Pitch Count/Clock */}
            {(state.showCount || state.showTimer) && (
            <div className={`flex border-t-[3px] border-slate-700 w-full shrink-0`} style={{ height: '48px' }}>
              <div className="flex-1" />
              {state.showCount && (
              <div className={`w-[5rem] border-slate-700 p-2 flex items-center justify-center text-lg font-bold font-display text-slate-300 shrink-0 border-l-[3px]`}>
                {pitcher.stat || '0'}
              </div>
              )}
              {state.showTimer && (
              <div className={`w-[4.5rem] border-slate-700 p-2 flex items-center justify-center text-2xl font-bold font-display shrink-0 ${state.timer <= 8 && state.isTimerRunning ? 'text-red-500 animate-pulse' : 'text-yellow-400'} border-l-[3px]`}>
                {state.timer}
              </div>
              )}
            </div>
            )}'''

new_bottom_row = '''          {/* Bottom Row: Pitch Count */}
            {state.showCount && (
            <div className={`flex border-t-[3px] border-slate-700 w-full shrink-0`} style={{ height: '48px' }}>
              <div className="flex-1" />
              <div className={`w-[5rem] border-slate-700 p-2 flex items-center justify-center text-lg font-bold font-display text-slate-300 shrink-0 border-l-[3px]`}>
                {pitcher.stat || '0'}
              </div>
            </div>
            )}'''
text = text.replace(old_bottom_row, new_bottom_row)

with open('components/ScoreboardDisplay.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
