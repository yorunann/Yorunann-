with open('App.tsx', 'r') as f:
    code = f.read()

code = code.replace('v26.9.5.6', 'v26.9.5.7')

with open('App.tsx', 'w') as f:
    f.write(code)

