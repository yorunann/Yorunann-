import re
with open('components/ScoreboardDisplay.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = '''                        <button className="p-1 hover:bg-white/20 rounded" onClick={(e) => { e.stopPropagation(); dispatch({type: 'SET_INNING', value: state.inning + 1}) }}><Plus size={16}/></button>
                        <button className="p-1 hover:bg-white/20 rounded" onClick={(e) => { e.stopPropagation(); dispatch({type: 'SET_INNING', value: Math.max(1, state.inning - 1)}) }}><Minus size={16}/></button>'''

replacement = '''                        <button className="p-1 hover:bg-white/20 rounded" onClick={(e) => { e.stopPropagation(); dispatch({type: 'NEXT_INNING'}) }}><Plus size={16}/></button>
                        <button className="p-1 hover:bg-white/20 rounded" onClick={(e) => { e.stopPropagation(); dispatch({type: 'PREVIOUS_HALF_INNING'}) }}><Minus size={16}/></button>'''

text = text.replace(target, replacement)

with open('components/ScoreboardDisplay.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
