import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { LyricLine, ThemeConfig } from '@/lib/gemini';
import { cn } from '@/lib/utils';
import { UserSettings } from '@/lib/useSettings';

interface LyricsDisplayProps {
  lyrics: LyricLine[];
  currentTime: number;
  theme: ThemeConfig;
  settings: UserSettings;
}

export function LyricsDisplay({ lyrics, currentTime, theme, settings }: LyricsDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerContainerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const [yOffset, setYOffset] = useState(0);

  // Find active line index backward to catch the exact current playing segment
  let activeIndex = -1;
  for (let i = lyrics.length - 1; i >= 0; i--) {
    // Add offset tolerance exactly like the settings slider expects
    const adjustedTime = currentTime - settings.lyricOffset;
    if (adjustedTime >= lyrics[i].time) {
      activeIndex = i;
      break;
    }
  }

  // Transform-based scrolling logic
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      // Small timeout to guarantee DOM has painted size changes from the render
      const t = setTimeout(() => {
        if (!activeLineRef.current || !containerRef.current) return;
        const activeLine = activeLineRef.current;
        const container = containerRef.current;
        
        const lineTop = activeLine.offsetTop;
        const lineHeight = activeLine.clientHeight;
        const containerHeight = container.clientHeight;
        
        // Calculate true center relative to parent bounds
        const targetY = (containerHeight / 2) - lineTop - (lineHeight / 2);
        setYOffset(targetY);
      }, 50);
      return () => clearTimeout(t);
    } else if (activeIndex === -1 && containerRef.current) {
      // If song hasn't started, center container slightly
      setYOffset(containerRef.current.clientHeight / 3);
    }
  }, [activeIndex, settings.lyricSize, settings.lyricAlignment]);

  const fontClass = theme.fontStyle === 'elegant' 
      ? 'font-serif' 
      : theme.fontStyle === 'brutalist_mono' 
        ? 'font-mono uppercase tracking-tight' 
        : 'font-sans tracking-tight';

  const animationVariants = {
    soft_fade: {
      initial: { opacity: 0, y: 5 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -5 }
    },
    floating: {
      initial: { opacity: 0, scale: 0.98 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.98 }
    },
    snappy: {
      initial: { opacity: 0, x: -10 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 10 }
    }
  }[theme.animation] || {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const getSizeClasses = (isActive: boolean) => {
    if (settings.lyricSize === 'small') {
      return isActive ? "text-2xl md:text-5xl" : "text-lg md:text-3xl";
    }
    if (settings.lyricSize === 'large') {
      return isActive ? "text-4xl md:text-8xl" : "text-2xl md:text-6xl";
    }
    // medium
    return isActive ? "text-3xl md:text-6xl lg:text-7xl" : "text-xl md:text-4xl lg:text-5xl";
  };

  const getAlignClass = () => {
    switch (settings.lyricAlignment) {
      case 'left': return "text-left items-start pr-6 md:pr-12";
      case 'right': return "text-right items-end pl-6 md:pl-12";
      case 'center':
      default: return "text-center items-center px-4 md:px-8";
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-x-0 top-20 bottom-36 md:top-32 md:bottom-40 overflow-hidden pointer-events-none select-none"
      style={{
         // Gradient mask to fade out top and bottom
         maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
         WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
      }}
    >
      <motion.div 
        ref={innerContainerRef}
        animate={{ y: yOffset }}
        transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        className={cn("w-full max-w-5xl mx-auto relative flex flex-col will-change-transform", getAlignClass())}
      >
        {lyrics.map((line, i) => {
          const isActive = i === activeIndex;
          const isPassed = i < activeIndex;
          const distance = Math.abs(activeIndex - i);
          
          let opacity = 0;
          if (isActive) opacity = 1;
          else if (distance < 5) opacity = 1 - (distance * 0.2); // fade off based on distance
          
          const isVisible = opacity > 0;

          // Highlight effect logic
          const getHighlightStyles = () => {
             if (!isActive) return {};
             switch (theme.highlightEffect) {
               case 'glow':
                 return { textShadow: `0 0 15px ${theme.primaryColor}80`, color: '#fff' };
               case 'color':
                 return { color: theme.primaryColor };
               case 'outline':
                 return { WebkitTextStroke: `1px ${theme.primaryColor}`, color: 'transparent' };
               case 'bold':
                 return { fontWeight: 800, color: '#fff' };
               default:
                 return { color: '#fff' };
             }
          };

          return (
            <motion.div
              key={i}
              ref={isActive ? activeLineRef : null}
              initial="initial"
              animate="animate"
              variants={animationVariants as any}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={cn(
                "w-full py-2 md:py-4 transition-all duration-300 leading-tight will-change-transform",
                fontClass,
                getSizeClasses(isActive)
              )}
              style={{
                opacity: opacity,
                filter: isVisible ? (isPassed ? 'blur(3px)' : isActive ? 'blur(0px)' : `blur(${distance}px)`) : 'none',
                transform: `scale(${isActive ? 1 : 0.95})`,
                transformOrigin: settings.lyricAlignment === 'left' ? 'left center' : settings.lyricAlignment === 'right' ? 'right center' : 'center center',
                color: isPassed ? '#444' : '#666',
                ...getHighlightStyles()
              }}
            >
              {line.text}
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
