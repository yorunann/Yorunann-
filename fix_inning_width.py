import re

with open('components/ScoreboardDisplay.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

old_inning = '''                {/* Inning */}
                <div className="w-[3.5rem] p-2 flex flex-col items-center justify-center gap-2 shrink-0">
                  <div className={`w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[12px] ${state.isTop ? 'border-b-yellow-400' : 'border-b-slate-600'}`} />
                  <div className="text-2xl font-black font-display">{state.inning}</div>
                  <div className={`w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] ${!state.isTop ? 'border-t-yellow-400' : 'border-t-slate-600'}`} />
                </div>'''

new_inning = '''                {/* Inning */}
                <div 
                  className="p-2 flex flex-col items-center justify-center gap-2 shrink-0 relative"
                  style={{ width: `${state.meta.broadcastInningWidth ?? 56}px` }}
                >
                  {state.isAdjustmentMode && (
                    <div 
                      className="absolute left-[-8px] top-0 bottom-0 w-4 cursor-ew-resize z-50 hover:bg-blue-500/50"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const startX = e.clientX;
                        const startWidth = state.meta.broadcastInningWidth ?? 56;
                        const scale = state.meta.broadcastScale ?? 1;
                        const onMove = (moveEvent: MouseEvent) => {
                          const deltaX = moveEvent.clientX - startX;
                          const deltaW = -deltaX / scale;
                          const newWidth = Math.max(30, startWidth + deltaW);
                          dispatch({ type: 'UPDATE_META', field: 'broadcastInningWidth', value: newWidth });
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
                  <div className={`w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[12px] ${state.isTop ? 'border-b-yellow-400' : 'border-b-slate-600'}`} />
                  <div className="text-2xl font-black font-display">{state.inning}</div>
                  <div className={`w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] ${!state.isTop ? 'border-t-yellow-400' : 'border-t-slate-600'}`} />
                </div>'''

text = text.replace(old_inning, new_inning)

with open('components/ScoreboardDisplay.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
