import re
with open('components/ScoreboardControls.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

old_endHr = '''  const endHr = (immediate: boolean = false) => {
    if (hrTimeoutRef.current) clearTimeout(hrTimeoutRef.current);
    if (hrBubbleIntervalRef.current) clearInterval(hrBubbleIntervalRef.current);'''

new_endHr = '''  const endHr = (immediate: boolean = false) => {
    if (hrLockTimeoutRef.current) {
        clearTimeout(hrLockTimeoutRef.current);
        hrLockTimeoutRef.current = null;
    }
    if (hrTimeoutRef.current) clearTimeout(hrTimeoutRef.current);
    if (hrBubbleIntervalRef.current) clearInterval(hrBubbleIntervalRef.current);'''
    
text = text.replace(old_endHr, new_endHr)

with open('components/ScoreboardControls.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
