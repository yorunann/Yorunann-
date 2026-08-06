import re
with open('types.ts', 'r', encoding='utf-8') as f:
    text = f.read()

if "isExiting?: boolean;" not in text:
    text = text.replace("isLocked?: boolean;", "isLocked?: boolean;\n  isExiting?: boolean;")
if "| { type: 'EXIT_HR_ANIMATION' }" not in text:
    text = text.replace("| { type: 'LOCK_HR_ANIMATION' }", "| { type: 'LOCK_HR_ANIMATION' }\n  | { type: 'EXIT_HR_ANIMATION' }")

with open('types.ts', 'w', encoding='utf-8') as f:
    f.write(text)

with open('reducer.ts', 'r', encoding='utf-8') as f:
    text = f.read()

if "case 'EXIT_HR_ANIMATION':" not in text:
    text = text.replace("case 'LOCK_HR_ANIMATION':", "case 'EXIT_HR_ANIMATION':\n      if (state.animation) {\n        return { ...state, animation: { ...state.animation, isLocked: false, isExiting: true } };\n      }\n      return state;\n\n    case 'LOCK_HR_ANIMATION':")

with open('reducer.ts', 'w', encoding='utf-8') as f:
    f.write(text)
