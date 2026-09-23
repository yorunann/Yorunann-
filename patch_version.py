with open('App.tsx', 'r') as f:
    code = f.read()

code = code.replace('v26.9.5.11', 'v26.9.5.12')

with open('App.tsx', 'w') as f:
    f.write(code)

