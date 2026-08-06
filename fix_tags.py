import re
with open('components/ScoreboardControls.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = '''                  </button>
              </div>
            </div>
          </div>
          
          {/* Settings & Timer */}'''

replacement = '''                  </button>
              </div>
            </div>
            </div>
          </div>
          
          {/* Settings & Timer */}'''

if target in text:
    text = text.replace(target, replacement)
    with open('components/ScoreboardControls.tsx', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Fixed.")
else:
    print("Target not found.")

