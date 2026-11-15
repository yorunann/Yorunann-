import re
with open("components/ScoreboardDisplay.tsx", "r") as f:
    text = f.read()

text = re.sub(
    r"const AnimatedScore = \({ score, color, sizeClass, disableScale }: { score: number, color\?: string, sizeClass\?: string, disableScale\?: boolean }\) => {",
    "const AnimatedScore = ({ score, color, sizeClass, disableScale, style }: { score: number, color?: string, sizeClass?: string, disableScale?: boolean, style?: React.CSSProperties }) => {",
    text
)

text = re.sub(
    r"textShadow: animate \? `0 0 40px \$\{color \|\| '#fde047'}` : 'none'\s*}}",
    "textShadow: animate ? `0 0 40px ${color || '#fde047'}` : 'none',\n             ...style\n          }}",
    text
)

with open("components/ScoreboardDisplay.tsx", "w") as f:
    f.write(text)
print("Done")
