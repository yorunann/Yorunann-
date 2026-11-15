import re

with open('components/Diamond.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace container
old_container = '<div className={`relative w-40 h-40 lg:w-56 lg:h-56 flex items-center justify-center ${className}`}>'
# For w-40 (160px), center of 2nd is 34. Center of 1st/3rd is 80. Bottom is 114.
# Let's just hardcode the heights and use exact tops.
new_container = '''<div className={`relative w-[160px] h-[114px] lg:w-[224px] lg:h-[157px] ${className}`}>'''
text = text.replace(old_container, new_container)

# Replace 3rd base top
old_3rd = 'className={`absolute left-0 top-1/2 -translate-y-1/2 ${baseClass(bases[2])}`}'
new_3rd = 'className={`absolute left-0 top-[80px] lg:top-[112px] -translate-y-1/2 ${baseClass(bases[2])}`}'
text = text.replace(old_3rd, new_3rd)

# Replace 1st base top
old_1st = 'className={`absolute right-0 top-1/2 -translate-y-1/2 ${baseClass(bases[0])}`}'
new_1st = 'className={`absolute right-0 top-[80px] lg:top-[112px] -translate-y-1/2 ${baseClass(bases[0])}`}'
text = text.replace(old_1st, new_1st)

with open('components/Diamond.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
