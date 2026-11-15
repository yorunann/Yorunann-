import re

with open('components/ScoreboardDisplay.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

count_old = '''              {/* Count (Bottom Half) */}
              <div 
                className="flex flex-col justify-center items-center gap-1 w-full px-2 shrink-0"
                style={{ 
                  height: `${Math.max(effectiveA, effectiveH) + teamRowHeight - pitchInfoHeight}px`,
                  paddingTop: `${pitchInfoHeight}px`
                }}
              >'''

count_new = '''              {/* Count (Bottom Half) */}
              <div 
                className="flex flex-col justify-center items-center gap-1 w-full px-2 shrink-0"
                style={{ 
                  height: `${teamRowHeight + effectiveH - pitchInfoHeight}px`,
                  paddingTop: `${pitchInfoHeight}px`
                }}
              >'''

text = text.replace(count_old, count_new)

with open('components/ScoreboardDisplay.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
