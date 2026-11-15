import re
with open('App.tsx', 'r') as f:
    text = f.read()

# Remove displayZoom state
text = text.replace("const [displayZoom, setDisplayZoom] = useState(1);\n  ", "")

# Revert fullscreen button to what it was
old_fullscreen = """              {isDisplayMode && (
                <div className="absolute top-4 right-4 flex items-center space-x-2 z-50 opacity-30 hover:opacity-100 transition-opacity">
                  <div className="flex bg-slate-800/50 rounded-md overflow-hidden">
                    <button
                      onClick={() => setDisplayZoom(z => Math.max(0.2, z - 0.1))}
                      className="p-2 hover:bg-slate-700/80 text-white transition-colors"
                      title="Zoom Out"
                    >
                      <Minus size={20} />
                    </button>
                    <div className="flex items-center justify-center px-2 text-white text-xs font-mono select-none min-w-[3rem]">
                      {Math.round(displayZoom * 100)}%
                    </div>
                    <button
                      onClick={() => setDisplayZoom(z => Math.min(3, z + 0.1))}
                      className="p-2 hover:bg-slate-700/80 text-white transition-colors"
                      title="Zoom In"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  <button 
                    onClick={toggleFullscreen}
                    className="p-2 bg-slate-800/50 hover:bg-slate-700/80 text-white rounded-md transition-colors"
                    title="Toggle Fullscreen"
                  >
                    <Maximize size={24} />
                  </button>
                </div>
              )}"""

new_fullscreen = """              {isDisplayMode && (
                <button 
                  onClick={toggleFullscreen}
                  className="absolute top-4 right-4 p-2 bg-slate-800/50 hover:bg-slate-700/80 text-white rounded-md transition-colors z-50 opacity-30 hover:opacity-100"
                  title="Toggle Fullscreen"
                >
                  <Maximize size={24} />
                </button>
              )}"""

text = text.replace(old_fullscreen, new_fullscreen)

# Revert the transform zoom
old_container = """              <div className="w-full max-w-full aspect-video flex items-center justify-center overflow-hidden">
                <div 
                  className="w-full origin-center h-full flex justify-center items-center"
                  style={{ transform: `scale(${isDisplayMode ? displayZoom : 1})` }}
                >
                  <div className="w-full transform scale-90 xl:scale-100 origin-center h-full">
                  <ScoreboardDisplay ref={displayRef} state={localDisplayMode ? { ...state, displayMode: localDisplayMode } : state} dispatch={handleDispatch} language={language} />
                </div>
                </div>
              </div>"""

new_container = """              <div className="w-full max-w-full aspect-video flex items-center justify-center">
                <div className="w-full transform scale-90 xl:scale-100 origin-center h-full">
                  <ScoreboardDisplay ref={displayRef} state={localDisplayMode ? { ...state, displayMode: localDisplayMode } : state} dispatch={handleDispatch} language={language} />
                </div>
              </div>"""

text = text.replace(old_container, new_container)

text = text.replace("26.7.28.2 ver.", "2026.8.7 ver.")
text = text.replace("26.7.28.1 ver.", "2026.8.7 ver.")
text = text.replace("26.7.28 ver.", "2026.8.7 ver.")

with open('App.tsx', 'w') as f:
    f.write(text)

