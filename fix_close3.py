with open('components/ScoreboardControls.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# We need to make sure the divs are balanced.
# Let's count open/close divs from the start of the controls tab to the Settings & Timer comment.
# Actually, I can just restore it to what it was before I broke it, then fix the action buttons again.

import re
