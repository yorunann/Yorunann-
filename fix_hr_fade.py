import re

with open('types.ts', 'r', encoding='utf-8') as f:
    text = f.read()
if "isLocked?: boolean" not in text:
    text = text.replace("bubbleKey?: number;", "bubbleKey?: number;\n  isLocked?: boolean;")
    if "| { type: 'LOCK_HR_ANIMATION' }" not in text:
        text = text.replace("| { type: 'TRIGGER_HR_BUBBLE' }", "| { type: 'TRIGGER_HR_BUBBLE' }\n  | { type: 'LOCK_HR_ANIMATION' }")
    with open('types.ts', 'w', encoding='utf-8') as f:
        f.write(text)

with open('reducer.ts', 'r', encoding='utf-8') as f:
    text = f.read()
if "case 'LOCK_HR_ANIMATION':" not in text:
    text = text.replace("case 'TRIGGER_HR_BUBBLE':", "case 'LOCK_HR_ANIMATION':\n      if (state.animation) {\n        return { ...state, animation: { ...state.animation, isLocked: true } };\n      }\n      return state;\n\n    case 'TRIGGER_HR_BUBBLE':")
    with open('reducer.ts', 'w', encoding='utf-8') as f:
        f.write(text)

with open('components/ScoreboardControls.tsx', 'r', encoding='utf-8') as f:
    text = f.read()
if "LOCK_HR_ANIMATION" not in text:
    text = text.replace("setHrState('locked');\n        if (hrTimeoutRef.current) clearTimeout(hrTimeoutRef.current);", "setHrState('locked');\n        dispatch({ type: 'LOCK_HR_ANIMATION' });\n        if (hrTimeoutRef.current) clearTimeout(hrTimeoutRef.current);")
    with open('components/ScoreboardControls.tsx', 'w', encoding='utf-8') as f:
        f.write(text)

with open('components/ScoreboardDisplay.tsx', 'r', encoding='utf-8') as f:
    text = f.read()
# Replace fadeOut inline styles for both broadcast and local modes
text = text.replace("style={{ animation: 'fadeOut 0.5s ease-in-out 4.5s forwards' }}", "style={{ animation: state.animation.isLocked ? 'none' : 'fadeOut 0.5s ease-in-out 4.5s forwards' }}")
with open('components/ScoreboardDisplay.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
