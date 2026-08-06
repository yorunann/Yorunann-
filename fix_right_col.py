import re

with open('components/ScoreboardDisplay.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix Right Column wrapper to not use justify-center (we want it to start from top)
wrapper_old = '''            {/* Right Column (Count & Diamond) */}
            <div 
              className="px-2 flex flex-col justify-center items-center shrink-0 relative h-full"'''
wrapper_new = '''            {/* Right Column (Count & Diamond) */}
            <div 
              className="px-2 flex flex-col items-center shrink-0 relative h-full"'''
text = text.replace(wrapper_old, wrapper_new)


# Replace Diamond container
diamond_old = '''              {/* Diamond (Top Half) */}
              <div 
                className="flex items-center justify-center w-full shrink-0"
                style={{ height: `${Math.max(effectiveA, effectiveH) + teamRowHeight}px` }}
              >
                 <div className="transform scale-[0.55] origin-center">'''

diamond_new = '''              {/* Diamond (Top Half) */}
              <div 
                className="flex items-center justify-center w-full shrink-0"
                style={{ height: `${Math.max(effectiveA, effectiveH) + teamRowHeight}px` }}
              >
                 <div className="transform scale-[0.55] origin-center">'''
# Ensure we don't duplicate replacement
# Actually, the Diamond container is already fine, let's leave it.

# Find the end of Diamond and start of Count
# The end of Diamond is:
#                   />
#                 </div>
#              </div>
#              
#              {/* Count (Bottom Half) */}
#              <div className="flex-1 flex flex-col justify-center items-center gap-1 w-full px-2">

mid_old = '''                   />
                 </div>
              </div>

              {/* Count (Bottom Half) */}
              <div className="flex-1 flex flex-col justify-center items-center gap-1 w-full px-2">'''

mid_new = '''                   />
                 </div>
              </div>

              {/* Divider to perfectly align with Left Column's middle border */}
              <div style={{ height: '3px' }} className="w-full shrink-0" />

              {/* Count (Bottom Half) */}
              <div 
                className="flex flex-col justify-center items-center gap-1 w-full px-2 shrink-0"
                style={{ 
                  height: `${Math.max(effectiveA, effectiveH) + teamRowHeight - pitchInfoHeight}px`,
                  paddingTop: `${pitchInfoHeight}px`
                }}
              >'''

if mid_old in text:
    text = text.replace(mid_old, mid_new)
else:
    print("Warning: mid_old not found!")

# Also remove bottomSpacerHeight just in case it's still there
text = text.replace('{bottomSpacerHeight > 0 && <div style={{ height: `${bottomSpacerHeight}px` }} className="shrink-0" />}', '')

with open('components/ScoreboardDisplay.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
