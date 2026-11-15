import re

with open('App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace version
text = text.replace('26.7.20 ver.', '26.7.21 ver.')

# Sync language
text = text.replace(
    'const handleSyncState = (newState: GameState) => {',
    'const handleSyncState = (newState: GameState, newLanguage?: "en" | "zh" | "ja") => {'
)
text = text.replace(
    "dispatch({ type: 'REPLACE_STATE', state: newState });",
    "dispatch({ type: 'REPLACE_STATE', state: newState });\n      if (newLanguage) setLanguage(newLanguage);"
)

text = text.replace(
    'if (event.data.type === \'SYNC_STATE\') {\n        handleSyncState(event.data.state);\n      }',
    'if (event.data.type === \'SYNC_STATE\') {\n        handleSyncState(event.data.state, event.data.language);\n      }'
)

text = text.replace(
    'channel.postMessage({ type: \'SYNC_STATE\', state: currentState });',
    'channel.postMessage({ type: \'SYNC_STATE\', state: currentState, language });'
)

text = text.replace(
    'channelRef.current.postMessage({ type: \'SYNC_STATE\', state });',
    'channelRef.current.postMessage({ type: \'SYNC_STATE\', state, language });'
)

with open('App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated App.tsx")
