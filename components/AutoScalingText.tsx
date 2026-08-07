import React, { useState, useRef, useLayoutEffect } from 'react';

interface AutoScalingTextProps {
  text: string;
  className?: string;
  align?: 'left' | 'center' | 'right';
  style?: React.CSSProperties;
}

export const AutoScalingText: React.FC<AutoScalingTextProps> = ({ text, className, align = 'left', style }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const updateScale = () => {
      if (containerRef.current && textRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const textWidth = textRef.current.scrollWidth;
        
        if (textWidth > containerWidth && containerWidth > 0) {
          setScale(containerWidth / textWidth);
        } else {
          setScale(1);
        }
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [text]);

  const origin = align === 'left' ? 'left' : align === 'right' ? 'right' : 'center';
  const justify = align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center';

  return (
    <div ref={containerRef} className={`overflow-hidden flex items-center ${justify} ${className}`} style={{ width: '100%', ...style }}>
      <span 
        ref={textRef} 
        className="whitespace-nowrap inline-block py-0.5 leading-normal"
        style={{ 
          transform: `scale(${scale})`,
          transformOrigin: origin,
          transition: 'transform 0.2s ease-out'
        }}
      >
        {text}
      </span>
    </div>
  );
};
