import re

# Update types.ts
with open('types.ts', 'r', encoding='utf-8') as f:
    types = f.read()

anim_old = '''export interface AnimationData {
  type: 'homerun' | '2-run-homer' | '3-run-homer' | 'grand-slam';
  playerName: string;
  teamName: string;
  teamColor: string;
}'''
anim_new = '''export interface AnimationData {
  type: 'homerun' | '2-run-homer' | '3-run-homer' | 'grand-slam';
  playerName: string;
  teamName: string;
  teamColor: string;
  bubbleKey?: number;
}'''
types = types.replace(anim_old, anim_new)

if "| { type: 'TRIGGER_HR_BUBBLE' }" not in types:
    types = types.replace("| { type: 'REPLACE_STATE'; state: GameState }", "| { type: 'REPLACE_STATE'; state: GameState }\n  | { type: 'TRIGGER_HR_BUBBLE' }")

with open('types.ts', 'w', encoding='utf-8') as f:
    f.write(types)

# Update reducer.ts
with open('reducer.ts', 'r', encoding='utf-8') as f:
    reducer = f.read()

if "case 'TRIGGER_HR_BUBBLE':" not in reducer:
    reducer = reducer.replace("case 'SET_ANIMATION':", "case 'TRIGGER_HR_BUBBLE':\n      if (state.animation) {\n        return { ...state, animation: { ...state.animation, bubbleKey: (state.animation.bubbleKey || 0) + 1 } };\n      }\n      return state;\n\n    case 'SET_ANIMATION':")

with open('reducer.ts', 'w', encoding='utf-8') as f:
    f.write(reducer)

