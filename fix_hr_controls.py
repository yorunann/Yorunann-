import re
with open('components/ScoreboardControls.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

old_state = "const [hrState, setHrState] = React.useState<'idle' | 'playing' | 'locked'>('idle');"
new_state = "const [hrState, setHrState] = React.useState<'idle' | 'playing' | 'locked' | 'exiting'>('idle');"
text = text.replace(old_state, new_state)

old_endHr = '''  const endHr = () => {
    setHrState('idle');
    if (hrTimeoutRef.current) clearTimeout(hrTimeoutRef.current);
    if (hrBubbleIntervalRef.current) clearInterval(hrBubbleIntervalRef.current);
    dispatch({ type: 'SET_ANIMATION', animation: null });
  };'''

new_endHr = '''  const endHr = (immediate: boolean = false) => {
    if (hrTimeoutRef.current) clearTimeout(hrTimeoutRef.current);
    if (hrBubbleIntervalRef.current) clearInterval(hrBubbleIntervalRef.current);
    if (immediate) {
        setHrState('idle');
        dispatch({ type: 'SET_ANIMATION', animation: null });
    } else {
        setHrState('exiting');
        dispatch({ type: 'EXIT_HR_ANIMATION' });
        hrTimeoutRef.current = setTimeout(() => {
            setHrState('idle');
            dispatch({ type: 'SET_ANIMATION', animation: null });
        }, 500);
    }
  };'''
text = text.replace(old_endHr, new_endHr)

old_mouseDown = '''  const handleHrMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (hrState === 'locked') {
       endHr();
       return;
    }
    if (hrState === 'playing') {'''

new_mouseDown = '''  const handleHrMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (hrState === 'locked') {
       endHr(false);
       return;
    }
    if (hrState === 'exiting') {
       return;
    }
    if (hrState === 'playing') {'''
text = text.replace(old_mouseDown, new_mouseDown)

old_doubleClick = '''  const handleHrDoubleClick = () => {
     endHr();
  };'''

new_doubleClick = '''  const handleHrDoubleClick = () => {
     endHr(true);
  };'''
text = text.replace(old_doubleClick, new_doubleClick)

with open('components/ScoreboardControls.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
