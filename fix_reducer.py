import re

with open('reducer.ts', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(
    '''    case 'SWAP_TEAMS':
      return {
        ...state,
        homeTeam: state.awayTeam,
        awayTeam: state.homeTeam,
        isTop: !state.isTop
      };''',
    '''    case 'SWAP_TEAMS':
      return {
        ...state,
        homeTeam: state.awayTeam,
        awayTeam: state.homeTeam,
        isTop: !state.isTop,
        meta: { ...state.meta, settingsVersion: (state.meta.settingsVersion || 0) + 1 }
      };'''
)

with open('reducer.ts', 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated reducer.ts")
