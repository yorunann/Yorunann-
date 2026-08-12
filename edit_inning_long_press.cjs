const fs = require('fs');

let content = fs.readFileSync('components/ScoreboardDisplay.tsx', 'utf8');

// 1. Add states and refs
const insertTarget = '  const [showKAnimation, setShowKAnimation] = useState(false);';
const newStates = `  const [showUmpireControls, setShowUmpireControls] = useState(false);
  const umpireTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignoreUmpireClickRef = useRef(false);

  const handleInningMouseDown = () => {
    ignoreUmpireClickRef.current = false;
    umpireTimerRef.current = setTimeout(() => {
        setShowUmpireControls(true);
        setShowInningControls(false);
        ignoreUmpireClickRef.current = true;
    }, 600);
  };

  const handleInningMouseUp = () => {
    if (umpireTimerRef.current) clearTimeout(umpireTimerRef.current);
  };

  const handleInningClick = (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      if (ignoreUmpireClickRef.current) return;
      if (showUmpireControls) {
          setShowUmpireControls(false);
          return;
      }
      setShowInningControls(!showInningControls);
      setShowScoreControlsHome(false);
      setShowScoreControlsAway(false);
      if (!showInningControls) {
          dispatch({type: 'NEXT_INNING'});
      }
  };
`;
content = content.replace(insertTarget, insertTarget + '\n' + newStates);

// 2. Modify the click handler in default mode
const oldInningDiv = `<div 
                  className="relative flex items-center space-x-3 cursor-pointer hover:bg-slate-700/50 px-2 py-1 rounded transition-colors group" 
                  onClick={(e) => {
                      e.stopPropagation();
                      setShowInningControls(true);
                      setShowScoreControlsHome(false);
                      setShowScoreControlsAway(false);
                      dispatch({type: 'NEXT_INNING'});
                  }}
               >`;

const newInningDiv = `<div 
                  className="relative flex items-center space-x-3 cursor-pointer hover:bg-slate-700/50 px-2 py-1 rounded transition-colors group" 
                  onMouseDown={handleInningMouseDown}
                  onMouseUp={handleInningMouseUp}
                  onMouseLeave={handleInningMouseUp}
                  onTouchStart={handleInningMouseDown}
                  onTouchEnd={handleInningMouseUp}
                  onClick={handleInningClick}
               >`;

content = content.replace(oldInningDiv, newInningDiv);

// 3. Add the UmpireControls popup inside the inning div
const oldPopup = `                    <div className="absolute top-1/2 left-full ml-2 transform -translate-y-1/2 flex flex-col gap-1 bg-slate-900 p-1 rounded border-2 border-slate-600 shadow-xl z-50">
                        <button className="p-1 hover:bg-white/20 rounded" onClick={(e) => { e.stopPropagation(); dispatch({type: 'NEXT_INNING'}) }}><Plus size={16}/></button>
                        <button className="p-1 hover:bg-white/20 rounded" onClick={(e) => { e.stopPropagation(); dispatch({type: 'PREVIOUS_HALF_INNING'}) }}><Minus size={16}/></button>
                    </div>
                 )}
               </div>`;

const newPopup = `                    <div className="absolute top-1/2 left-full ml-2 transform -translate-y-1/2 flex flex-col gap-1 bg-slate-900 p-1 rounded border-2 border-slate-600 shadow-xl z-50">
                        <button className="p-1 hover:bg-white/20 rounded" onClick={(e) => { e.stopPropagation(); dispatch({type: 'NEXT_INNING'}) }}><Plus size={16}/></button>
                        <button className="p-1 hover:bg-white/20 rounded" onClick={(e) => { e.stopPropagation(); dispatch({type: 'PREVIOUS_HALF_INNING'}) }}><Minus size={16}/></button>
                    </div>
                 )}
                 {showUmpireControls && (
                    <div className="absolute top-full left-0 mt-2 grid grid-cols-2 gap-2 bg-slate-900 p-3 rounded-lg border-2 border-slate-600 shadow-2xl z-50 w-64 animate-in zoom-in-95 duration-200">
                        <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-2 rounded shadow text-sm" onClick={(e) => { e.stopPropagation(); dispatch({type: 'BATTER_OUT'}); setShowUmpireControls(false); }}>OUT</button>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded shadow text-sm" onClick={(e) => { e.stopPropagation(); dispatch({type: 'SINGLE'}); setShowUmpireControls(false); }}>1B</button>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded shadow text-sm" onClick={(e) => { e.stopPropagation(); dispatch({type: 'DOUBLE'}); setShowUmpireControls(false); }}>2B</button>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded shadow text-sm" onClick={(e) => { e.stopPropagation(); dispatch({type: 'TRIPLE'}); setShowUmpireControls(false); }}>3B</button>
                        <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-2 rounded shadow text-sm" onClick={(e) => { e.stopPropagation(); dispatch({type: 'WALK'}); setShowUmpireControls(false); }}>BB</button>
                        <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-2 rounded shadow text-sm" onClick={(e) => { e.stopPropagation(); dispatch({type: 'HOME_RUN'}); setShowUmpireControls(false); }}>HR</button>
                        <button className="col-span-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-2 rounded shadow text-sm flex justify-center items-center gap-1 mt-1" onClick={(e) => { e.stopPropagation(); dispatch({type: 'UNDO'}); setShowUmpireControls(false); }}><RotateCcw size={14}/> Undo</button>
                    </div>
                 )}
               </div>`;

content = content.replace(oldPopup, newPopup);

fs.writeFileSync('components/ScoreboardDisplay.tsx', content);
console.log("Done");
