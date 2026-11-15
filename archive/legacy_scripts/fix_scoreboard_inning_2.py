import re
with open('components/ScoreboardDisplay.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = '''                                <button className="p-2 bg-white/10 hover:bg-white/20 rounded text-green-400" onClick={(e) => { e.stopPropagation(); dispatch({type: 'SET_INNING', value: state.inning + 1}) }}><Plus size={20}/></button>
                                <button className="p-2 bg-white/10 hover:bg-white/20 rounded text-red-400" onClick={(e) => { e.stopPropagation(); dispatch({type: 'SET_INNING', value: Math.max(1, state.inning - 1)}) }}><Minus size={20}/></button>'''

replacement = '''                                <button className="p-2 bg-white/10 hover:bg-white/20 rounded text-green-400" onClick={(e) => { e.stopPropagation(); dispatch({type: 'NEXT_INNING'}) }}><Plus size={20}/></button>
                                <button className="p-2 bg-white/10 hover:bg-white/20 rounded text-red-400" onClick={(e) => { e.stopPropagation(); dispatch({type: 'PREVIOUS_HALF_INNING'}) }}><Minus size={20}/></button>'''

text = text.replace(target, replacement)

with open('components/ScoreboardDisplay.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
