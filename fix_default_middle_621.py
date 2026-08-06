import re

with open('components/ScoreboardDisplay.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Pattern 1
old_1 = '''            {/* Middle: Bases & Counts */}
            <div className="flex-1 flex flex-row sm:flex-col items-center justify-center w-full p-2 sm:p-2 gap-2 sm:gap-1 lg:gap-2 relative min-h-0">'''

new_1 = '''            {/* Middle: Bases & Counts */}
            <div className="flex-1 flex flex-row sm:flex-col items-center justify-evenly w-full relative min-h-0">'''

text = text.replace(old_1, new_1)

old_3 = '''                <div className="w-1/2 sm:w-auto flex justify-end sm:justify-center mt-0 lg:mt-6 mb-0 lg:mb-2 shrink-0 transform scale-[0.85] sm:scale-80 lg:scale-100 origin-right sm:origin-center pr-4 sm:pr-0">'''
new_3 = '''                <div className="w-1/2 sm:w-auto flex justify-end sm:justify-center shrink-0 transform scale-[0.85] sm:scale-80 lg:scale-100 origin-right sm:origin-center pr-4 sm:pr-0">'''

text = text.replace(old_3, new_3)

old_4 = '''                <div className="w-1/2 sm:w-full flex justify-start sm:justify-center pb-0 shrink-0 pl-4 sm:pl-0">'''
new_4 = '''                <div className="w-1/2 sm:w-full flex justify-start sm:justify-center shrink-0 pl-4 sm:pl-0">'''

text = text.replace(old_4, new_4)

with open('components/ScoreboardDisplay.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
