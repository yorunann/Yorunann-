import re

with open('components/ScoreboardDisplay.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Away Player Row resizer
away_resizer_old = '''                  {/* Resizer */}
                  {state.isAdjustmentMode && (
                    <div 
                      className="absolute left-0 right-0 bottom-[-8px] h-4 cursor-ns-resize z-50 hover:bg-blue-500/50"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const startY = e.clientY;
                        const startHeight = state.meta.broadcastPlayerRowHeight ?? 50;
                        const onMove = (moveEvent: MouseEvent) => {
                          const newHeight = Math.max(30, startHeight + (moveEvent.clientY - startY) / (state.meta.broadcastScale ?? 1));
                          dispatch({ type: 'UPDATE_META', field: 'broadcastPlayerRowHeight', value: newHeight });
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

away_resizer_new = '''                  {/* Top Resizer */}
                  {state.isAdjustmentMode && (
                    <div 
                      className="absolute left-0 right-0 top-[-8px] h-4 cursor-ns-resize z-50 hover:bg-blue-500/50"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const startY = e.clientY;
                        const startHeight = state.meta.broadcastPlayerRowHeight ?? 50;
                        const startMarginY = state.meta.broadcastMarginY ?? 20;
                        const scale = state.meta.broadcastScale ?? 1;
                        const onMove = (moveEvent: MouseEvent) => {
                          const deltaY = moveEvent.clientY - startY;
                          const deltaH = -deltaY / scale;
                          const newHeight = Math.max(30, startHeight + deltaH);
                          const actualDeltaH = newHeight - startHeight;
                          dispatch({ type: 'UPDATE_META', field: 'broadcastPlayerRowHeight', value: newHeight });
                          dispatch({ type: 'UPDATE_META', field: 'broadcastMarginY', value: startMarginY - actualDeltaH * scale });
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

text = text.replace(away_resizer_old, away_resizer_new)

# Home Player Row resizer
home_resizer_old = '''                  {/* Row Resizer */}
                  {state.isAdjustmentMode && (
                    <div 
                      className="absolute left-0 right-0 top-[-8px] h-4 cursor-ns-resize z-50 hover:bg-blue-500/50"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const startY = e.clientY;
                        const startHeight = state.meta.broadcastPlayerRowHeight ?? 50;
                        const onMove = (moveEvent: MouseEvent) => {
                          // The top resizer on a bottom element: dragging UP (negative delta) means increasing height
                          const newHeight = Math.max(30, startHeight - (moveEvent.clientY - startY) / (state.meta.broadcastScale ?? 1));
                          dispatch({ type: 'UPDATE_META', field: 'broadcastPlayerRowHeight', value: newHeight });
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

home_resizer_new = '''                  {/* Bottom Resizer */}
                  {state.isAdjustmentMode && (
                    <div 
                      className="absolute left-0 right-0 bottom-[-8px] h-4 cursor-ns-resize z-50 hover:bg-blue-500/50"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const startY = e.clientY;
                        const startHeight = state.meta.broadcastPlayerRowHeight ?? 50;
                        const startMarginY = state.meta.broadcastMarginY ?? 20;
                        const scale = state.meta.broadcastScale ?? 1;
                        const onMove = (moveEvent: MouseEvent) => {
                          const deltaY = moveEvent.clientY - startY;
                          const deltaH = deltaY / scale;
                          const newHeight = Math.max(30, startHeight + deltaH);
                          const actualDeltaH = newHeight - startHeight;
                          dispatch({ type: 'UPDATE_META', field: 'broadcastPlayerRowHeight', value: newHeight });
                          dispatch({ type: 'UPDATE_META', field: 'broadcastMarginY', value: startMarginY - actualDeltaH * scale });
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

text = text.replace(home_resizer_old, home_resizer_new)

with open('components/ScoreboardDisplay.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

