import re
with open("components/ScoreboardDisplay.tsx", "r") as f:
    text = f.read()

target = """const AnimatedScore = ({ score, color, sizeClass, disableScale }: { score: number, color?: string, sizeClass?: string, disableScale?: boolean }) => {"""
replacement = """const AnimatedScore = ({ score, color, sizeClass, disableScale, style }: { score: number, color?: string, sizeClass?: string, disableScale?: boolean, style?: React.CSSProperties }) => {"""

target2 = """        <div 
          className={`flex items-center justify-center w-full h-full ${sizeClass || 'text-[6rem] sm:text-[12rem] lg:text-[16rem] xl:text-[22rem]'} font-bold text-center cursor-pointer select-none transition-all drop-shadow-lg leading-none rounded-lg ${animate ? (disableScale ? 'scale-110' : 'scale-150') + ' duration-150 z-50' : 'duration-300'}`}
          style={{ 
             color: animate ? '#fde047' : 'white', // Yellow flash 
             textShadow: animate ? `0 0 40px ${color || '#fde047'}` : 'none'
          }}
        >"""
replacement2 = """        <div 
          className={`flex items-center justify-center w-full h-full ${sizeClass || 'text-[6rem] sm:text-[12rem] lg:text-[16rem] xl:text-[22rem]'} font-bold text-center cursor-pointer select-none transition-all drop-shadow-lg leading-none rounded-lg ${animate ? (disableScale ? 'scale-110' : 'scale-150') + ' duration-150 z-50' : 'duration-300'}`}
          style={{ 
             color: animate ? '#fde047' : 'white', // Yellow flash 
             textShadow: animate ? `0 0 40px ${color || '#fde047'}` : 'none',
             ...style
          }}
        >"""

if target in text and target2 in text:
    text = text.replace(target, replacement)
    text = text.replace(target2, replacement2)
    with open("components/ScoreboardDisplay.tsx", "w") as f:
        f.write(text)
    print("Success")
else:
    print("Failed")
