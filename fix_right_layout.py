import re

with open('components/ScoreboardDisplay.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

right_col_old = '''              {/* Diamond (Top Half) */}
              <div className="flex-1 flex items-center justify-center w-full">
                 <div className="transform scale-[0.55] origin-center">'''

right_col_new = '''              {/* Diamond (Top Half) */}
              <div 
                className="flex items-center justify-center w-full shrink-0"
                style={{ height: `${(showAwayPlayer ? awayPlayerHeight : 0) + teamRowHeight}px` }}
              >
                 <div className="transform scale-[0.55] origin-center">'''
text = text.replace(right_col_old, right_col_new)

right_col_mid_old = '''                 </div>
              </div>
              {/* Count (Bottom Half) */}
              <div className="flex-1 flex flex-col justify-center items-center gap-1 w-full px-2">
                  <div className="flex flex-col gap-1">'''

right_col_mid_new = '''                 </div>
              </div>

              <div style={{ height: '3px' }} className="w-full shrink-0" />

              {/* Count (Bottom Half) */}
              <div 
                className="flex flex-col justify-center items-center gap-1 w-full px-2 shrink-0"
                style={{ height: `${teamRowHeight + (showHomePlayer ? 3 + homePlayerHeight : 0)}px` }}
              >
                  <div className="flex flex-col gap-1">'''
text = text.replace(right_col_mid_old, right_col_mid_new)

with open('components/ScoreboardDisplay.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

