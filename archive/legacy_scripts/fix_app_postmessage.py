import re

with open('App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(
    'handleSyncState(event.data.state);',
    'handleSyncState(event.data.state, event.data.language);'
)

text = text.replace(
    '(event.source as Window).postMessage({ type: \'SYNC_STATE\', state: stateRef.current }, \'*\');',
    '(event.source as Window).postMessage({ type: \'SYNC_STATE\', state: stateRef.current, language }, \'*\');'
)

text = text.replace(
    'channel.postMessage({ type: \'SYNC_STATE\', state: stateRef.current });',
    'channel.postMessage({ type: \'SYNC_STATE\', state: stateRef.current, language });'
)

text = text.replace(
    'window.opener.postMessage({ type: \'SYNC_STATE\', state }, \'*\');',
    'window.opener.postMessage({ type: \'SYNC_STATE\', state, language }, \'*\');'
)

text = text.replace(
    'displayWindowOpenedRef.current.postMessage({ type: \'SYNC_STATE\', state }, \'*\');',
    'displayWindowOpenedRef.current.postMessage({ type: \'SYNC_STATE\', state, language }, \'*\');'
)

text = text.replace(
    '(win as Window).postMessage({ type: \'SYNC_STATE\', state }, \'*\');',
    '(win as Window).postMessage({ type: \'SYNC_STATE\', state, language }, \'*\');'
)

with open('App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

