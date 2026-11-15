with open('components/ScoreboardControls.tsx', 'r') as f:
    code = f.read()

target = '''             <input 
              className="w-full border-2 border-slate-300 p-1.5 rounded text-xs text-black bg-white box-border min-w-0" 
              value={draft.fullName}
              onChange={(e) => updateDraft('fullName', e.target.value)}
              placeholder="Team Full Name"
            />'''

if target in code:
    code = code.replace(target, '')
    print("Removed fullName input")
else:
    print("Could not find fullName input")

with open('components/ScoreboardControls.tsx', 'w') as f:
    f.write(code)
