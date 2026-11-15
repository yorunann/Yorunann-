const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

code = code.replace(
  /<div className="flex items-center space-x-2">\s*<MonitorPlay className="text-yellow-400" \/>\s*<h1 className="text-white font-bold text-xl hidden md:block">Pro Baseball Scoreboard<\/h1>\s*<h1 className="text-white font-bold text-xl md:hidden">PBS<\/h1>/,
  `<div className="flex items-center space-x-2">
            <div 
              className="flex items-center space-x-2 cursor-pointer select-none"
              onDoubleClick={toggleFullscreen}
              title="Double click to toggle fullscreen"
            >
              <MonitorPlay className="text-yellow-400" />
              <h1 className="text-white font-bold text-xl hidden md:block">Pro Baseball Scoreboard</h1>
              <h1 className="text-white font-bold text-xl md:hidden">PBS</h1>
            </div>`
);

code = code.replace(/v26\.9\.5\.0/g, 'v26.9.5.1');

fs.writeFileSync('App.tsx', code);
