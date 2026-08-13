const fs = require('fs');
let content = fs.readFileSync('components/ScoreboardDisplay.tsx', 'utf8');

// The block to replace starts at `const renderLineupView = () => {` and ends at `return renderRHEView();` or something.
// Wait, I'll extract it, rebuild it, and inject.

const searchStart = '  const renderLineupView = () => {';
const searchEnd = '  const renderRHEView = () => {';

let before = content.substring(0, content.indexOf(searchStart));
let after = content.substring(content.indexOf(searchEnd));

const newBlock = `  const renderLineupView = () => {
    const awayBatter = state.awayTeam.lineup[state.awayTeam.currentBatterIndex] || { name: '---', number: '', stat: '---' };
    const homeBatter = state.homeTeam.lineup[state.homeTeam.currentBatterIndex] || { name: '---', number: '', stat: '---' };
    const awayPitcher = state.awayTeam.pitcher || { name: '---', number: '', stat: '---' };
    const homePitcher = state.homeTeam.pitcher || { name: '---', number: '', stat: '---' };

    const batter = state.isTop ? awayBatter : homeBatter;
    const pitcher = state.isTop ? homePitcher : awayPitcher;
    const activeBaseColor = state.isTop ? state.awayTeam.color : state.homeTeam.color;

    const maxInnings = Math.max(9, state.awayTeam.inningScores.length, state.homeTeam.inningScores.length);
    const inningsArray = Array.from({ length: maxInnings }, (_, i) => i + 1);
    const awayRuns = state.awayTeam.inningScores.reduce((sum, score) => sum + (score || 0), 0);
    const homeRuns = state.homeTeam.inningScores.reduce((sum, score) => sum + (score || 0), 0);

    return (
        <div className="w-full h-full bg-slate-900 border-2 border-slate-700 rounded-xl overflow-hidden shadow-2xl flex flex-col sm:flex-row font-display text-white">
            
            {/* Left: Away Lineup */}
            <div className="flex-1 sm:flex-none w-full sm:w-[20%] shrink-0 sm:h-full min-w-0 border-b-2 sm:border-b-0 sm:border-r-2 border-slate-700 order-2 sm:order-1">
                <LineupColumn team={state.awayTeam} isAway={true} state={state} dispatch={dispatch} />
            </div>

            {/* Center: Simplified Scoreboard */}
            <div className="flex-1 sm:flex-none w-full sm:w-[60%] shrink-0 sm:h-full flex flex-col bg-slate-800 min-w-0 border-x-0 sm:border-x-2 border-slate-900 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] order-1 sm:order-2">
                {/* Score Strip */}
                <div className="h-[72px] sm:h-[88px] lg:h-[104px] bg-slate-950 flex border-b-2 border-slate-600 shrink-0">
                    {/* Away Score */}
                    <div 
                        className="flex-1 flex items-center justify-center text-5xl lg:text-7xl font-bold relative overflow-hidden cursor-pointer hover:bg-white/5 transition-colors" 
                        style={{ color: state.awayTeam.color }}
                        onMouseDown={() => handleScoreMouseDown('away')}
                        onMouseUp={handleScoreMouseUp}
                        onMouseLeave={handleScoreMouseLeave}
                        onTouchStart={() => handleScoreMouseDown('away')}
                        onTouchEnd={handleScoreMouseUp}
                        onClick={(e) => handleScoreClick(e, 'away')}
                    >
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-20"></div>
                         <div className="z-10"><AnimatedScore score={state.awayTeam.score} color={state.awayTeam.color} sizeClass="text-3xl lg:text-4xl" /></div>
                         {showScoreControlsAway && (
                            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 flex gap-2 bg-slate-900/95 p-2 rounded border-2 border-slate-500 shadow-2xl z-50 animate-in fade-in zoom-in duration-200">
                                <button className="p-2 bg-white/10 hover:bg-white/20 rounded text-green-400" onClick={(e) => { e.stopPropagation(); dispatch({type: 'ADD_SCORE', team: 'away', amount: 1})}}><Plus size={20}/></button>
                                <button className="p-2 bg-white/10 hover:bg-white/20 rounded text-red-400" onClick={(e) => { e.stopPropagation(); dispatch({type: 'ADD_SCORE', team: 'away', amount: -1})}}><Minus size={20}/></button>
                            </div>
                         )}
                    </div>
                    {/* Inning */}
                    <div 
                        className="w-24 bg-slate-900 flex flex-col items-center justify-center border-x-2 border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors relative"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowInningControls(true);
                            setShowScoreControlsHome(false);
                            setShowScoreControlsAway(false);
                            dispatch({type: 'NEXT_INNING'});
                        }}
                    >
                        <div className="flex flex-col gap-1.5 mb-1">
                            <div className={\`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent \${state.isTop ? 'border-b-[8px] border-b-yellow-400' : 'border-b-[8px] border-b-slate-700'}\`}></div>
                            <div className={\`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent \${!state.isTop ? 'border-t-[8px] border-t-yellow-400' : 'border-t-[8px] border-t-slate-700'}\`}></div>
                         </div>
                        <span className="text-3xl font-bold text-slate-200">{state.inning}</span>
                        {showInningControls && (
                            <div className="absolute top-full mt-2 flex gap-2 bg-slate-900/95 p-2 rounded border-2 border-slate-500 shadow-2xl z-50 animate-in fade-in zoom-in duration-200">
                                <button className="p-2 bg-white/10 hover:bg-white/20 rounded text-green-400" onClick={(e) => { e.stopPropagation(); dispatch({type: 'NEXT_INNING'}) }}><Plus size={20}/></button>
                                <button className="p-2 bg-white/10 hover:bg-white/20 rounded text-red-400" onClick={(e) => { e.stopPropagation(); dispatch({type: 'PREVIOUS_HALF_INNING'}) }}><Minus size={20}/></button>
                            </div>
                        )}
                    </div>
                    {/* Home Score */}
                    <div 
                        className="flex-1 flex items-center justify-center text-5xl lg:text-7xl font-bold relative overflow-hidden cursor-pointer hover:bg-white/5 transition-colors" 
                        style={{ color: state.homeTeam.color }}
                        onMouseDown={() => handleScoreMouseDown('home')}
                        onMouseUp={handleScoreMouseUp}
                        onMouseLeave={handleScoreMouseLeave}
                        onTouchStart={() => handleScoreMouseDown('home')}
                        onTouchEnd={handleScoreMouseUp}
                        onClick={(e) => handleScoreClick(e, 'home')}
                    >
                        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-white/5 to-transparent opacity-20"></div>
                        <div className="z-10"><AnimatedScore score={state.homeTeam.score} color={state.homeTeam.color} sizeClass="text-3xl lg:text-4xl" /></div>
                         {showScoreControlsHome && (
                            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 flex gap-2 bg-slate-900/95 p-2 rounded border-2 border-slate-500 shadow-2xl z-50 animate-in fade-in zoom-in duration-200">
                                <button className="p-2 bg-white/10 hover:bg-white/20 rounded text-green-400" onClick={(e) => { e.stopPropagation(); dispatch({type: 'ADD_SCORE', team: 'home', amount: 1})}}><Plus size={20}/></button>
                                <button className="p-2 bg-white/10 hover:bg-white/20 rounded text-red-400" onClick={(e) => { e.stopPropagation(); dispatch({type: 'ADD_SCORE', team: 'home', amount: -1})}}><Minus size={20}/></button>
                            </div>
                         )}
                    </div>
                </div>

                {/* Top: Timer */}
                <div className="h-10 lg:h-12 border-b-2 border-slate-600 flex items-center justify-center px-3 bg-slate-800/80 shrink-0">
                   {state.showTimer && (<div 
                      className={\`flex items-center space-x-1 px-4 py-1 rounded border-2 cursor-pointer select-none active:scale-95 transition-all \${state.timer <= 8 && state.isTimerRunning ? 'bg-red-900/80 border-red-500 animate-pulse' : 'bg-black/40 border-slate-600/50'}\`}
                      onMouseDown={handleTimerMouseDown}
                      onMouseUp={handleTimerMouseUp}
                      onMouseLeave={handleTimerMouseUp}
                      onTouchStart={handleTimerMouseDown}
                      onTouchEnd={handleTimerMouseUp}
                      onClick={handleTimerClick}
                   >
                        <Timer size={16} className={state.isTimerRunning ? "text-green-400 animate-spin" : "text-slate-400"} />
                        <span className={\`text-2xl lg:text-3xl font-display font-bold w-[40px] lg:w-[60px] text-center \${state.timer <= 8 ? 'text-white' : 'text-yellow-400'}\`}>
                          {state.timer}
                        </span>
                   </div>)}
                </div>

                {/* AT BAT & PITCHING */}
                <div className="flex h-16 sm:h-20 bg-slate-900 border-b-2 border-slate-700 shrink-0 text-white">
                    <div className="flex-1 flex justify-between items-center px-4 border-r-2 border-slate-700 min-w-0">
                        <div className="flex flex-col min-w-0 mr-2">
                            <span className="font-bold tracking-widest text-white/50 text-[10px] sm:text-xs">AT BAT</span>
                            <div className="flex items-baseline gap-2 truncate">
                                <span className="text-xl sm:text-2xl font-bold truncate">{batter.name}</span>
                                {batter.number && <span className="text-sm text-slate-400">#{batter.number}</span>}
                            </div>
                        </div>
                        {(state.showPlayerStat ?? true) && (
                            <span className="text-2xl sm:text-3xl font-display text-yellow-500 shrink-0">{batter.stat}</span>
                        )}
                    </div>
                    <div className="flex-1 flex justify-between items-center px-4 min-w-0">
                        <div className="flex flex-col min-w-0 mr-2">
                            <span className="font-bold tracking-widest text-white/50 text-[10px] sm:text-xs">PITCHING</span>
                            <div className="flex items-baseline gap-2 truncate">
                                <span className="text-xl sm:text-2xl font-bold truncate">{pitcher.name}</span>
                                {pitcher.number && <span className="text-sm text-slate-400">#{pitcher.number}</span>}
                            </div>
                        </div>
                        {(state.showCount ?? true) && (
                            <span className="text-2xl sm:text-3xl font-display text-yellow-500 shrink-0">{pitcher.stat}</span>
                        )}
                    </div>
                </div>

                {/* Middle: Bases & Counts */}
                <div className="flex-1 flex flex-row items-center justify-center w-full relative min-h-0">
                    <div className="w-1/2 flex justify-end shrink-0 pr-4 sm:pr-8 border-r border-slate-700/50">
                       <Diamond 
                          bases={state.bases} 
                          onToggle={(idx) => dispatch({type: 'TOGGLE_BASE', baseIndex: idx})}
                          className="scale-[0.85] lg:scale-100" 
                          activeColor={activeBaseColor}
                       />
                    </div>
                    <div className="w-1/2 flex justify-start shrink-0 pl-4 sm:pl-8">
                        <div className="flex flex-col space-y-2 lg:space-y-4 items-start">
                            {/* Balls */}
                            <div className="flex items-center gap-3 sm:gap-4 cursor-pointer group" onClick={handleBallClick}>
                                <span className="text-2xl lg:text-4xl font-bold text-slate-500 group-hover:text-white transition-colors w-6 lg:w-8 text-center">B</span>
                                <div className="flex space-x-2 sm:space-x-3">
                                    {[0, 1, 2].map(i => (
                                        <AnimatedIndicator 
                                            key={i}
                                            active={i < state.balls} 
                                            colorClass="bg-led-green" 
                                            shadowClass="shadow-[0_0_20px_#00ff41]" 
                                            baseClass="w-5 h-5 lg:w-8 lg:h-8 rounded-full border-2"
                                        />
                                    ))}
                                </div>
                            </div>
                            {/* Strikes */}
                            <div className="flex items-center gap-3 sm:gap-4 cursor-pointer group" onClick={handleStrikeClick}>
                                <span className="text-2xl lg:text-4xl font-bold text-slate-500 group-hover:text-white transition-colors w-6 lg:w-8 text-center">S</span>
                                <div className="flex space-x-2 sm:space-x-3">
                                    {[0, 1].map(i => (
                                        <AnimatedIndicator 
                                            key={i}
                                            active={i < state.strikes} 
                                            colorClass="bg-led-yellow" 
                                            shadowClass="shadow-[0_0_20px_#ffcc00]" 
                                            baseClass="w-5 h-5 lg:w-8 lg:h-8 rounded-full border-2"
                                        />
                                    ))}
                                </div>
                            </div>
                            {/* Outs */}
                            <div className="flex items-center gap-3 sm:gap-4 cursor-pointer group" onClick={handleOutClick}>
                                <span className="text-2xl lg:text-4xl font-bold text-slate-500 group-hover:text-white transition-colors w-6 lg:w-8 text-center">O</span>
                                <div className="flex space-x-2 sm:space-x-3">
                                    {[0, 1].map(i => (
                                        <AnimatedIndicator 
                                            key={i}
                                            active={i < state.outs} 
                                            colorClass="bg-led-red" 
                                            shadowClass="shadow-[0_0_20px_#ff3b30]" 
                                            baseClass="w-5 h-5 lg:w-8 lg:h-8 rounded-full border-2"
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom: 9-inning Linescore and RHE */}
                <div className="bg-slate-950 border-t-2 border-slate-700 shrink-0 overflow-x-auto p-2 lg:p-4 text-white">
                    <table className="w-full text-center font-display border-collapse text-xs lg:text-sm">
                        <thead>
                            <tr className="text-slate-500 border-b border-slate-800">
                                <th className="text-left font-normal py-1 pl-2 w-16">TEAM</th>
                                {inningsArray.map(i => (
                                    <th key={i} className={\`font-normal w-6 lg:w-8 py-1 \${i === state.inning ? 'text-yellow-400 font-bold' : ''}\`}>{i}</th>
                                ))}
                                <th className="font-normal w-8 lg:w-10 py-1 ml-2 text-white/50">R</th>
                                <th className="font-normal w-8 lg:w-10 py-1 text-white/50">H</th>
                                <th className="font-normal w-8 lg:w-10 py-1 text-white/50">E</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-slate-800/50">
                                <td className="text-left py-1 pl-2 font-bold truncate max-w-[60px] lg:max-w-[80px]" style={{ color: state.awayTeam.color }}>{state.awayTeam.name}</td>
                                {inningsArray.map(i => (
                                    <td key={\`away-\${i}\`} className="py-1">
                                        {state.awayTeam.inningScores[i - 1] !== undefined ? state.awayTeam.inningScores[i - 1] : (i === state.inning && state.isTop ? '0' : '-')}
                                    </td>
                                ))}
                                <td className="font-bold text-yellow-400 py-1">{awayRuns}</td>
                                <td className="py-1">{state.awayTeam.hits}</td>
                                <td className="py-1">{state.awayTeam.errors}</td>
                            </tr>
                            <tr>
                                <td className="text-left py-1 pl-2 font-bold truncate max-w-[60px] lg:max-w-[80px]" style={{ color: state.homeTeam.color }}>{state.homeTeam.name}</td>
                                {inningsArray.map(i => (
                                    <td key={\`home-\${i}\`} className="py-1">
                                        {state.homeTeam.inningScores[i - 1] !== undefined ? state.homeTeam.inningScores[i - 1] : (i === state.inning && !state.isTop ? '0' : '-')}
                                    </td>
                                ))}
                                <td className="font-bold text-yellow-400 py-1">{homeRuns}</td>
                                <td className="py-1">{state.homeTeam.hits}</td>
                                <td className="py-1">{state.homeTeam.errors}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Right: Home Lineup */}
            <div className="flex-1 sm:flex-none w-full sm:w-[20%] shrink-0 sm:h-full min-w-0 border-t-2 sm:border-t-0 sm:border-l-2 border-slate-700 order-3">
                <LineupColumn team={state.homeTeam} isAway={false} state={state} dispatch={dispatch} />
            </div>

        </div>
    )
  };
`;

fs.writeFileSync('components/ScoreboardDisplay.tsx', before + newBlock + after);
