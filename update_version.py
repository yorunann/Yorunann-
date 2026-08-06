import re
with open('App.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("26.7.21 ver.", "26.7.27 ver.")

with open('App.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
