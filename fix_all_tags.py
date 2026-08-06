import re
with open('components/ScoreboardControls.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

pattern = re.compile(r'(\s*Next\s*</button>\s*)</div>\s*</div>\s*</div>\s*</div>\s*({\/\* Settings & Timer \*\/})')
match = pattern.search(text)
if match:
    print("Found! Adjusting tags.")
    new_text = pattern.sub(r'\1</div>\n            </div>\n          </div>\n        </div>\n      </div>\n      \2', text)
    with open('components/ScoreboardControls.tsx', 'w', encoding='utf-8') as f:
        f.write(new_text)
else:
    print("Not found. Let's try matching from Next.</button> to Settings & Timer")
    pattern2 = re.compile(r'(Next\s*</button>\s*</div>\s*</div>\s*</div>\s*</div>\s*)({\/\* Settings & Timer \*\/})')
    match2 = pattern2.search(text)
    if match2:
        print("Found with pattern2")
    else:
        print("Still not found")
