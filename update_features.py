import re

# types.ts
with open('types.ts', 'r', encoding='utf-8') as f:
    text = f.read()
text = text.replace('showCount: boolean;', 'showCount: boolean;\n  showTimer: boolean;')
text = text.replace("'showCount' }", "'showCount' | 'showTimer' }")
text = text.replace("'showCount'; value: boolean }", "'showCount' | 'showTimer'; value: boolean }")
with open('types.ts', 'w', encoding='utf-8') as f:
    f.write(text)

# constants.ts
with open('constants.ts', 'r', encoding='utf-8') as f:
    text = f.read()
text = text.replace('showCount: true,', 'showCount: true,\n  showTimer: true,')
with open('constants.ts', 'w', encoding='utf-8') as f:
    f.write(text)

# reducer.ts
with open('reducer.ts', 'r', encoding='utf-8') as f:
    text = f.read()
text = text.replace('showCount: action.state.showCount ?? INITIAL_STATE.showCount,', 'showCount: action.state.showCount ?? INITIAL_STATE.showCount,\n          showTimer: action.state.showTimer ?? INITIAL_STATE.showTimer,')
with open('reducer.ts', 'w', encoding='utf-8') as f:
    f.write(text)

print("types, constants, reducer updated")
