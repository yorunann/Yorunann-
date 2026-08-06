import re

with open('App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Make language sync on change
text = text.replace(
    'onChange={(e) => setLanguage(e.target.value as \'en\' | \'zh\' | \'ja\')}',
    'onChange={(e) => {\n                const newLang = e.target.value as \'en\' | \'zh\' | \'ja\';\n                setLanguage(newLang);\n                if (channelRef.current) channelRef.current.postMessage({ type: \'SYNC_STATE\', state, language: newLang });\n                if (displayWindowOpenedRef.current) displayWindowOpenedRef.current.postMessage({ type: \'SYNC_STATE\', state, language: newLang }, \'*\');\n              }}'
)

with open('App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

