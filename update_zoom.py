import re
with open('App.tsx', 'r') as f:
    text = f.read()

target = """          <div 
            className={`flex-none p-4 bg-slate-950 flex flex-col items-center justify-center overflow-y-auto overscroll-contain overflow-x-hidden border-r border-slate-700 relative w-[var(--left-width)]`}
            style={{ '--left-width': isDisplayMode ? '100%' : `calc(${100 - controlPanelWidth}% - 4px)` } as React.CSSProperties}
          >"""

replacement = """          <div 
            className={`flex-none p-4 bg-slate-950 flex flex-col items-center justify-center overflow-y-auto overscroll-contain overflow-x-hidden border-r border-slate-700 relative w-[var(--left-width)]`}
            style={{ 
              '--left-width': isDisplayMode ? '100%' : `calc(${100 - controlPanelWidth}% - 4px)`,
              ...(isDisplayMode ? { zoom: '200%' } : {})
            } as React.CSSProperties}
          >"""

if target in text:
    text = text.replace(target, replacement)
    text = text.replace("2026.8.7 ver.", "2026.8.7 ver.")
    with open('App.tsx', 'w') as f:
        f.write(text)
    print("Success")
else:
    print("Target not found")
