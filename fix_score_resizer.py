import re

with open('components/ScoreboardDisplay.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = '''                      style={{ width: `${state.meta.broadcastScoreWidth ?? 72}px` }}
                      onMouseDown={() => handleScoreMouseDown('away')}'''

replacement = '''                      style={{ width: `${state.meta.broadcastScoreWidth ?? 72}px` }}
                      onMouseDown={() => handleScoreMouseDown('away')}
>
                      {/* Score Width Resizer */}
                      {state.isAdjustmentMode && (
                        <div 
                          className="absolute left-[-8px] top-0 bottom-0 w-4 cursor-ew-resize z-50 hover:bg-blue-500/50"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            const startX = e.clientX;
                            const startWidth = state.meta.broadcastScoreWidth ?? 72;
                            const scale = state.meta.broadcastScale ?? 1;
                            const onMove = (moveEvent: MouseEvent) => {
                              const deltaX = moveEvent.clientX - startX;
                              const deltaW = -deltaX / scale;
                              const newWidth = Math.max(40, startWidth + deltaW);
                              dispatch({ type: 'UPDATE_META', field: 'broadcastScoreWidth', value: newWidth });
                            };
                            const onUp = () => {
                              window.removeEventListener('mousemove', onMove);
                              window.removeEventListener('mouseup', onUp);
                            };
                            window.addEventListener('mousemove', onMove);
                            window.addEventListener('mouseup', onUp);
                          }}
                        />
                      )}'''

# Wait, the original has a closing angle bracket in the previous line:
#                    <div 
#                      className={`border-slate-700 px-2 flex items-center justify-center text-3xl font-black font-display text-yellow-400 shrink-0 relative z-10 cursor-pointer hover:bg-white/10 transition-colors border-l-[3px] h-full`}
#                      style={{ width: `${state.meta.broadcastScoreWidth ?? 72}px` }}
#                      onMouseDown={() => handleScoreMouseDown('away')}
#                      onMouseUp={handleScoreMouseUp}
#                      onMouseLeave={handleScoreMouseLeave}
#                      onTouchStart={() => handleScoreMouseDown('away')}
#                      onTouchEnd={handleScoreMouseUp}
#                      onClick={(e) => handleScoreClick(e, 'away')}
#                    >
#                      <AnimatedScore score={state.awayTeam.score} color="#facc15" sizeClass="text-3xl" disableScale={true} />

