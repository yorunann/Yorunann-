import re
with open('components/ScoreboardControls.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Left column
target_left = '''              <div className="grid grid-cols-1 gap-2 h-max">
              <div className="flex">'''
repl_left = '''              <div className="flex flex-col gap-2 h-full">
              <div className="flex flex-1 min-h-[44px]">'''
text = text.replace(target_left, repl_left)

target_left2 = '''              <div className="flex">
                <button 
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-2 rounded-l shadow flex-1 flex flex-col items-center justify-center transition-transform active:scale-95"'''
repl_left2 = '''              <div className="flex flex-1 min-h-[44px]">
                <button 
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-2 rounded-l shadow flex-1 flex flex-col items-center justify-center transition-transform active:scale-95"'''
text = text.replace(target_left2, repl_left2)

target_left3 = '''              <div className="flex">
                <button 
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-2 rounded-l shadow flex-1 flex flex-col items-center justify-center transition-transform active:scale-95"'''
repl_left3 = '''              <div className="flex flex-1 min-h-[44px]">
                <button 
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-2 rounded-l shadow flex-1 flex flex-col items-center justify-center transition-transform active:scale-95"'''
text = text.replace(target_left3, repl_left3)

target_reset = '''              <button 
                className="w-full bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 rounded shadow transition-transform active:scale-95 text-lg"'''
repl_reset = '''              <button 
                className="w-full flex-1 min-h-[44px] bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 rounded shadow transition-transform active:scale-95 text-lg"'''
text = text.replace(target_reset, repl_reset)


# Right column
target_right = '''            <div className="flex flex-col gap-0 h-max">
              <div className="flex flex-col gap-1.5">
                <button 
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded shadow transition-transform active:scale-95 text-xs text-center mb-1"'''
repl_right = '''            <div className="flex flex-col gap-2 h-full">
                <button 
                  className="w-full flex-1 min-h-[36px] bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded shadow transition-transform active:scale-95 text-xs text-center mb-1"'''
text = text.replace(target_right, repl_right)

target_1b = '''                <button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded shadow transition-transform active:scale-95 text-xs text-center"
                  onClick={() => dispatch({ type: 'SINGLE' })}
                >'''
repl_1b = '''                <button 
                  className="w-full flex-1 min-h-[36px] bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded shadow transition-transform active:scale-95 text-xs text-center"
                  onClick={() => dispatch({ type: 'SINGLE' })}
                >'''
text = text.replace(target_1b, repl_1b)

target_2b = '''                <button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded shadow transition-transform active:scale-95 text-xs text-center"
                  onClick={() => dispatch({ type: 'DOUBLE' })}
                >'''
repl_2b = '''                <button 
                  className="w-full flex-1 min-h-[36px] bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded shadow transition-transform active:scale-95 text-xs text-center"
                  onClick={() => dispatch({ type: 'DOUBLE' })}
                >'''
text = text.replace(target_2b, repl_2b)

target_3b = '''                <button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded shadow transition-transform active:scale-95 text-xs text-center"
                  onClick={() => dispatch({ type: 'TRIPLE' })}
                >'''
repl_3b = '''                <button 
                  className="w-full flex-1 min-h-[36px] bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded shadow transition-transform active:scale-95 text-xs text-center"
                  onClick={() => dispatch({ type: 'TRIPLE' })}
                >'''
text = text.replace(target_3b, repl_3b)

target_walk = '''                <div className="flex gap-2 w-full mt-1">
                  <button 
                    className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded shadow transition-transform active:scale-95 text-xs"'''
repl_walk = '''                <div className="flex gap-2 w-full mt-1 flex-1 min-h-[36px]">
                  <button 
                    className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded shadow transition-transform active:scale-95 text-xs"'''
text = text.replace(target_walk, repl_walk)

# Homerun move out
target_homer = '''              <div className="flex mt-3 gap-4 items-center justify-center">'''
repl_homer = '''            </div>
            {/* Full-width Homerun Button */}
            <div className="col-span-1 md:col-span-2 flex mt-2 gap-4 items-center justify-center border-t border-slate-200 pt-4">'''
text = text.replace(target_homer, repl_homer)

# Close the div that we replaced (the h-max wrapper in right column was removed in repl_right)
target_close = '''                  </button>
                </div>
              </div>
            </div>
            
            {/* Settings & Timer */}'''
repl_close = '''                  </button>
                </div>
            </div>
            
            {/* Settings & Timer */}'''
text = text.replace(target_close, repl_close)

with open('components/ScoreboardControls.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
