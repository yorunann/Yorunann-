import re
with open('components/ScoreboardControls.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = '''                  </button>
              </div>
            </div>
          </div>
        </div>
      {/* Settings & Timer */}'''

repl = '''                  </button>
              </div>
            </div>
          </div>
      {/* Settings & Timer */}'''

text = text.replace(target, repl)

with open('components/ScoreboardControls.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
