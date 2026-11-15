import re
text = open('test_parse.jsx').read()

stack = []
for match in re.finditer(r'<(/)?([a-zA-Z0-9]+)([^>]*)>', text):
    tag = match.group(2)
    if tag in ['br', 'hr', 'img', 'input', 'path', 'circle', 'line', 'polyline', 'rect', 'Check', 'Settings', 'RotateCcw', 'User', 'LayoutTemplate', 'Eye', 'EyeOff', 'Monitor', 'Type', 'Plus', 'Minus']: 
        if not match.group(1) and not match.group(3).endswith('/'):
            if tag == 'input': continue
    if tag not in ['div', 'button', 'span', 'svg', 'h3', 'h4', 'label']: continue
    
    is_closing = match.group(1) == '/'
    is_self_closing = match.group(3).endswith('/')
    
    if is_closing:
        if stack and stack[-1] == tag:
            stack.pop()
        else:
            print(f"Mismatched closing tag {tag} at line {text[:match.start()].count(chr(10))+1} (stack: {stack[-5:] if stack else []})")
    elif not is_self_closing:
        stack.append(tag)
        
print("Left in stack:", stack)
