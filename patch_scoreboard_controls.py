import re

with open('components/ScoreboardControls.tsx', 'r') as f:
    code = f.read()

target = '''      <LineupImportModal 
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        language={language}
        onImport={(importedPlayers) => {
          const newDraft = { ...draft, lineup: [...draft.lineup, ...importedPlayers] };
          setDraft(newDraft);
          dispatch({ type: 'APPLY_TEAM_CONFIG', team: teamKey, config: newDraft });
        }}
      />'''

replacement = '''      <LineupImportModal 
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        language={language}
        currentPlayers={draft.lineup}
        onImport={(importedPlayers, mode) => {
          let newDraft;
          if (mode === 'replace') {
            newDraft = { ...draft, lineup: importedPlayers };
          } else {
            newDraft = { ...draft, lineup: [...draft.lineup, ...importedPlayers] };
          }
          setDraft(newDraft);
          dispatch({ type: 'APPLY_TEAM_CONFIG', team: teamKey, config: newDraft });
        }}
      />'''

if target in code:
    code = code.replace(target, replacement)
    print("Replaced!")
else:
    print("WARNING: target not found in ScoreboardControls.tsx")

with open('components/ScoreboardControls.tsx', 'w') as f:
    f.write(code)

