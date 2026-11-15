import re

with open('components/ScoreboardDisplay.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = '''                      onClick={(e) => handleScoreClick(e, 'away')}
                    >
                      <AnimatedScore score={state.awayTeam.score} color="#facc15" sizeClass="text-3xl" disableScale={true} />'''

replacement = '''                      onClick={(e) => handleScoreClick(e, 'away')}
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
                      )}
                      <AnimatedScore score={state.awayTeam.score} color="#facc15" sizeClass="text-3xl" disableScale={true} />'''

if target in text:
    text = text.replace(target, replacement)
else:
    print("Not found")

with open('components/ScoreboardDisplay.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
