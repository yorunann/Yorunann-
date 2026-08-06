import re

with open('components/ScoreboardControls.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

old_start = '''export const ScoreboardControls: React.FC<ControlsProps> = ({ state, dispatch, language = 'zh' }) => {
  const [activeTab, setActiveTab] = useState<'controls' | 'info'>('controls');'''

new_start = '''export const ScoreboardControls: React.FC<ControlsProps> = ({ state, dispatch, language = 'zh' }) => {
  const [activeTab, setActiveTab] = useState<'controls' | 'info'>('controls');

  const [hrState, setHrState] = React.useState<'idle' | 'playing' | 'locked'>('idle');
  const hrTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const hrLockTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const hrBubbleIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
     if (!state.animation && hrState !== 'idle') {
         setHrState('idle');
         if (hrTimeoutRef.current) clearTimeout(hrTimeoutRef.current);
         if (hrBubbleIntervalRef.current) clearInterval(hrBubbleIntervalRef.current);
     }
  }, [state.animation, hrState]);

  const endHr = () => {
    setHrState('idle');
    if (hrTimeoutRef.current) clearTimeout(hrTimeoutRef.current);
    if (hrBubbleIntervalRef.current) clearInterval(hrBubbleIntervalRef.current);
    dispatch({ type: 'SET_ANIMATION', animation: null });
  };

  const handleHrMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (hrState === 'locked') {
       endHr();
       return;
    }
    if (hrState === 'playing') {
       return;
    }

    setHrState('playing');
    const team = state.isTop ? state.awayTeam : state.homeTeam;
    const batter = team.lineup[team.currentBatterIndex] || { name: 'Unknown' };
    const runnersOnBase = state.bases.filter(Boolean).length;
    let animationType: 'homerun' | '2-run-homer' | '3-run-homer' | 'grand-slam' = 'homerun';
    if (runnersOnBase === 1) animationType = '2-run-homer';
    else if (runnersOnBase === 2) animationType = '3-run-homer';
    else if (runnersOnBase === 3) animationType = 'grand-slam';
    
    dispatch({ 
      type: 'SET_ANIMATION', 
      animation: {
        type: animationType,
        playerName: batter.name,
        teamName: team.name,
        teamColor: team.color
      }
    });
    dispatch({ type: 'HOME_RUN' });

    hrLockTimeoutRef.current = setTimeout(() => {
        setHrState('locked');
        dispatch({ type: 'LOCK_HR_ANIMATION' });
        if (hrTimeoutRef.current) clearTimeout(hrTimeoutRef.current);
        hrBubbleIntervalRef.current = setInterval(() => {
            dispatch({ type: 'TRIGGER_HR_BUBBLE' });
        }, 3000);
    }, 500);

    hrTimeoutRef.current = setTimeout(() => {
        setHrState(prev => {
            if (prev === 'playing') {
                dispatch({ type: 'SET_ANIMATION', animation: null });
                return 'idle';
            }
            return prev;
        });
    }, 5000);
  };

  const handleHrMouseUp = () => {
    if (hrLockTimeoutRef.current) {
        clearTimeout(hrLockTimeoutRef.current);
        hrLockTimeoutRef.current = null;
    }
  };

  const handleHrDoubleClick = () => {
     endHr();
  };'''

if "const [hrState, setHrState] =" not in text:
    text = text.replace(old_start, new_start)

with open('components/ScoreboardControls.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
