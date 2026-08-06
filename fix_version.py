import re
with open('App.tsx', 'r') as f:
    text = f.read()

text = text.replace("26.7.28.1 ver.", "26.7.28.2 ver.")
with open('App.tsx', 'w') as f:
    f.write(text)
