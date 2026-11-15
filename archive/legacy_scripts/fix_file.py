import re
with open('components/ScoreboardControls.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = "          </div>\n        </div>\n        </div>\n        </div>\n        )}"
replacement = "          </div>\n        </div>\n        </div>\n        )}"
text = text.replace(target, replacement)
with open('components/ScoreboardControls.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
