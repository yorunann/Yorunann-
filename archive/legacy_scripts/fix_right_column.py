import re

with open('components/ScoreboardDisplay.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

right_column_old = '''            {/* Right Column (Count & Diamond) */}
            <div 
              className="py-2 px-2 flex flex-col justify-center items-center shrink-0 relative h-full"
              style={{ width: `${state.meta.broadcastRightColumnWidth ?? 150}px` }}
            >
              <AnimatePresence>'''

right_column_new = '''            {/* Right Column (Count & Diamond) */}
            <div 
              className="py-2 px-2 flex flex-col justify-center items-center shrink-0 relative h-full"
              style={{ width: `${state.meta.broadcastRightColumnWidth ?? 150}px` }}
            >
              {topSpacerHeight > 0 && <div style={{ height: `${topSpacerHeight}px` }} className="shrink-0 w-full" />}
              <AnimatePresence>'''

text = text.replace(right_column_old, right_column_new)

right_column_bottom_old = '''                      </div>
                  </div>
              </div>
            </div>
          </div>'''

right_column_bottom_new = '''                      </div>
                  </div>
              </div>
              {bottomSpacerHeight > 0 && <div style={{ height: `${bottomSpacerHeight}px` }} className="shrink-0 w-full" />}
            </div>
          </div>'''

text = text.replace(right_column_bottom_old, right_column_bottom_new)

with open('components/ScoreboardDisplay.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

