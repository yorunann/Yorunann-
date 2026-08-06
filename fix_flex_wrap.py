import re
with open('components/ScoreboardControls.tsx', 'r') as f:
    text = f.read()

target = """      <div className="flex flex-col gap-2 mb-2">
        <div className="flex items-center justify-between gap-1">
           <div className="flex items-center gap-1 shrink-0">"""

replacement = """      <div className="flex flex-col gap-2 mb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
           <div className="flex items-center gap-1 shrink-0">"""

if target in text:
    text = text.replace(target, replacement)
    
target2 = """           <div className="flex flex-col gap-1 shrink w-[120px]">"""
replacement2 = """           <div className="flex flex-col gap-1 flex-1 min-w-[110px]">"""
if target2 in text:
    text = text.replace(target2, replacement2)
    with open('components/ScoreboardControls.tsx', 'w') as f:
        f.write(text)
    print("Success")
else:
    print("Failed")
