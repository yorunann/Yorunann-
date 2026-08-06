import re
with open('reducer.ts', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('export function reducer(state: GameState, action: ActionType): GameState {', 'function baseReducer(state: GameState, action: ActionType): GameState {')

wrapper = '''export function reducer(state: GameState, action: ActionType): GameState {
  let nextState = baseReducer(state, action);

  const pitchIncrementActions: ActionType['type'][] = [
    'INCREMENT_BALL',
    'INCREMENT_STRIKE',
    'BATTER_OUT',
    'SINGLE',
    'DOUBLE',
    'TRIPLE',
    'HOME_RUN'
  ];

  if (pitchIncrementActions.includes(action.type)) {
    const pitchingTeamKey = state.isTop ? 'homeTeam' : 'awayTeam';
    nextState = {
      ...nextState,
      [pitchingTeamKey]: {
        ...nextState[pitchingTeamKey],
        pitcher: {
          ...nextState[pitchingTeamKey].pitcher,
          stat: incrementPitchStat(nextState[pitchingTeamKey].pitcher.stat)
        }
      }
    };
  }

  return nextState;
}

function baseReducer(state: GameState, action: ActionType): GameState {'''

text = text.replace('function baseReducer(state: GameState, action: ActionType): GameState {', wrapper)

with open('reducer.ts', 'w', encoding='utf-8') as f:
    f.write(text)
