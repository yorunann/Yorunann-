import re
with open('components/ScoreboardControls.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Make the settings and timer a grid
old_settings = '''          {/* Settings & Timer */}
          <div className="space-y-3">
             <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide border-b pb-1">{language === 'en' ? 'Settings & Timer' : language === 'zh' ? 'Settings & Timer 設定與計時器' : '設定とタイマー'}</h3>
             
             {/* Timer Controls */}'''

new_settings = '''          {/* Settings & Timer */}
          <div className="space-y-3">
             <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide border-b pb-1">{language === 'en' ? 'Settings & Timer' : language === 'zh' ? 'Settings & Timer 設定與計時器' : '設定とタイマー'}</h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-3 h-max">
             {/* Timer Controls */}'''

text = text.replace(old_settings, new_settings)

old_toggles = '''             </div>
             {/* Toggles */}'''

new_toggles = '''             </div>
             </div>
             
             <div className="space-y-3 h-max">
             {/* Toggles */}'''

text = text.replace(old_toggles, new_toggles)

old_broadcast = '''             <div className="mt-4 pt-4 border-t col-span-1 md:col-span-2">
               <h4 className="font-semibold text-gray-600 text-xs uppercase mb-2">{language === 'en' ? 'Broadcast Mode Settings' : language === 'zh' ? '轉播模式設定' : '配信モード設定'}</h4>'''

new_broadcast = '''             </div>
             </div>
             
             <div className="mt-4 pt-4 border-t w-full">
               <h4 className="font-semibold text-gray-600 text-xs uppercase mb-2">{language === 'en' ? 'Broadcast Mode Settings' : language === 'zh' ? '轉播模式設定' : '配信モード設定'}</h4>'''

text = text.replace(old_broadcast, new_broadcast)


with open('components/ScoreboardControls.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
