import re

with open("components/AutoScalingText.tsx", "r") as f:
    text = f.read()

target1 = """interface AutoScalingTextProps {
  text: string;
  className?: string;
  align?: 'left' | 'center' | 'right';
}"""

replacement1 = """interface AutoScalingTextProps {
  text: string;
  className?: string;
  align?: 'left' | 'center' | 'right';
  style?: React.CSSProperties;
}"""

target2 = """export const AutoScalingText: React.FC<AutoScalingTextProps> = ({ text, className, align = 'left' }) => {"""
replacement2 = """export const AutoScalingText: React.FC<AutoScalingTextProps> = ({ text, className, align = 'left', style }) => {"""

target3 = """    <div ref={containerRef} className={`overflow-hidden flex items-center ${justify} ${className}`} style={{ width: '100%' }}>"""
replacement3 = """    <div ref={containerRef} className={`overflow-hidden flex items-center ${justify} ${className}`} style={{ width: '100%', ...style }}>"""

if target1 in text and target2 in text and target3 in text:
    text = text.replace(target1, replacement1)
    text = text.replace(target2, replacement2)
    text = text.replace(target3, replacement3)
    with open("components/AutoScalingText.tsx", "w") as f:
        f.write(text)
    print("Success")
else:
    print("Failed")
