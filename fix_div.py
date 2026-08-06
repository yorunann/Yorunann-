import re
with open('App.tsx', 'r') as f:
    text = f.read()

target = """                  <ScoreboardDisplay ref={displayRef} state={localDisplayMode ? { ...state, displayMode: localDisplayMode } : state} dispatch={handleDispatch} language={language} />
                </div>
              </div>
          </div>"""

replacement = """                  <ScoreboardDisplay ref={displayRef} state={localDisplayMode ? { ...state, displayMode: localDisplayMode } : state} dispatch={handleDispatch} language={language} />
                </div>
                </div>
              </div>
          </div>"""

if target in text:
    text = text.replace(target, replacement)
    with open('App.tsx', 'w') as f:
        f.write(text)
    print("Success")
else:
    print("Failed")
