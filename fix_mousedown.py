import re
with open('components/ScoreboardControls.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

old_code = '''  const handleHrMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (hrState === 'locked') {
       endHr();
       return;
    }
    if (hrState === 'playing') {
       return;
    }'''

new_code = '''  const handleHrMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (hrState === 'locked') {
       endHr();
       return;
    }
    if (hrState === 'playing') {
       hrLockTimeoutRef.current = setTimeout(() => {
           setHrState('locked');
           dispatch({ type: 'LOCK_HR_ANIMATION' });
           if (hrTimeoutRef.current) clearTimeout(hrTimeoutRef.current);
           hrBubbleIntervalRef.current = setInterval(() => {
               dispatch({ type: 'TRIGGER_HR_BUBBLE' });
           }, 3000);
       }, 500);
       return;
    }'''

if old_code in text:
    text = text.replace(old_code, new_code)
    with open('components/ScoreboardControls.tsx', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Replaced successfully")
else:
    print("Old code not found")
