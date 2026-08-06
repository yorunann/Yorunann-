import re

with open('components/ScoreboardDisplay.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(
    "{state.animation.type === 'homerun' && (language === 'zh' ? '陽春砲' : language === 'ja' ? 'ソロホームラン' : 'HOMERUN!')}",
    "{state.animation.type === 'homerun' && (language === 'zh' ? '陽春砲' : language === 'ja' ? <span className=\"flex flex-col items-center justify-center leading-tight\"><span>ソロ</span><span>ホームラン</span></span> : 'HOMERUN!')}"
)
text = text.replace(
    "{state.animation.type === '2-run-homer' && (language === 'zh' ? '兩分砲' : language === 'ja' ? '2ランホームラン' : '2-RUN HOMER!')}",
    "{state.animation.type === '2-run-homer' && (language === 'zh' ? '兩分砲' : language === 'ja' ? <span className=\"flex flex-col items-center justify-center leading-tight\"><span>2ラン</span><span>ホームラン</span></span> : '2-RUN HOMER!')}"
)
text = text.replace(
    "{state.animation.type === '3-run-homer' && (language === 'zh' ? '三分砲' : language === 'ja' ? '3ランホームラン' : '3-RUN HOMER!')}",
    "{state.animation.type === '3-run-homer' && (language === 'zh' ? '三分砲' : language === 'ja' ? <span className=\"flex flex-col items-center justify-center leading-tight\"><span>3ラン</span><span>ホームラン</span></span> : '3-RUN HOMER!')}"
)

# And also fix "四死球 (BB)" to "四死球 (Walk)", "保送 (BB)" to "保送 (Walk)" in ScoreboardControls.tsx
with open('components/ScoreboardControls.tsx', 'r', encoding='utf-8') as f:
    controls = f.read()

controls = controls.replace("'保送 (BB)' : '四死球 (BB)'", "'保送 (Walk)' : '四死球 (Walk)'")
with open('components/ScoreboardControls.tsx', 'w', encoding='utf-8') as f:
    f.write(controls)

with open('components/ScoreboardDisplay.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated Homerun and Walk")
