import React, { useEffect, useRef, useCallback } from 'react';
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
  const innerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastActiveRef = useRef<number>(-2);
  const currentYRef = useRef<number>(0);

  // Find active line — pure computation, no setState
  let activeIndex = -1;
  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (currentTime - settings.lyricOffset >= lyrics[i].time) {
      activeIndex = i;
      break;
    }
  }

  // Update lyric line styles directly on DOM — zero re-renders
  useEffect(() => {
    lineRefs.current.forEach((el, i) => {
      if (!el) return;
      const isActive = i === activeIndex;
      const isPassed = i < activeIndex;
      const distance = Math.abs(activeIndex - i);

      const opacity = isActive ? 1 : distance < 5 ? Math.max(0, 1 - distance * 0.2) : 0;
      const scale = isActive ? 1 : 0.95;

      let color = '#555';
      if (isPassed) color = '#3a3a3a';
      if (isActive) {
        switch (theme.highlightEffect) {
          case 'color': color = theme.primaryColor; break;
          case 'outline': color = 'transparent'; break;
          default: color = '#fff';
        }
      }

      let textShadow = 'none';
      let webkitTextStroke = 'unset';
      let fontWeight = '';
      if (isActive) {
        if (theme.highlightEffect === 'glow') textShadow = `0 0 20px ${theme.primaryColor}90`;
        if (theme.highlightEffect === 'bold') fontWeight = '800';
        if (theme.highlightEffect === 'outline') webkitTextStroke = `1px ${theme.primaryColor}`;
      }

      el.style.opacity = String(opacity);
      el.style.transform = `scale(${scale})`;
      el.style.color = color;
      el.style.textShadow = textShadow;
      (el.style as any).webkitTextStroke = webkitTextStroke;
      if (fontWeight) el.style.fontWeight = fontWeight;
      else el.style.fontWeight = '';
    });
  }, [activeIndex, theme]);

  // Smooth scroll via RAF lerp — no state, pure DOM
  useEffect(() => {
    if (lastActiveRef.current === activeIndex) return;
    lastActiveRef.current = activeIndex;

    const container = containerRef.current;
    const inner = innerRef.current;

    if (!container || !inner) return;

    let targetY: number;
    const activeLine = lineRefs.current[activeIndex];

    if (activeIndex === -1 || !activeLine) {
      targetY = container.clientHeight / 3;
    } else {
      targetY = container.clientHeight / 2 - activeLine.offsetTop - activeLine.clientHeight / 2;
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const animate = () => {
      const diff = targetY - currentYRef.current;
      if (Math.abs(diff) < 0.4) {
        currentYRef.current = targetY;
        inner.style.transform = `translateY(${targetY}px)`;
        return;
      }
      currentYRef.current += diff * 0.12;
      inner.style.transform = `translateY(${currentYRef.current}px)`;
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [activeIndex, settings.lyricOffset]);

  // Re-scroll when size/alignment settings change
  useEffect(() => {
    lastActiveRef.current = -2;
  }, [settings.lyricSize, settings.lyricAlignment]);

  const fontClass =
    theme.fontStyle === 'elegant'
      ? 'font-serif'
      : theme.fontStyle === 'brutalist_mono'
        ? 'font-mono uppercase tracking-tight'
        : 'font-sans tracking-tight';

  const getSizeClasses = (isActive: boolean) => {
    if (settings.lyricSize === 'small')
      return isActive ? 'text-2xl md:text-5xl' : 'text-lg md:text-3xl';
    if (settings.lyricSize === 'large')
      return isActive ? 'text-4xl md:text-8xl' : 'text-2xl md:text-6xl';
    return isActive ? 'text-3xl md:text-6xl lg:text-7xl' : 'text-xl md:text-4xl lg:text-5xl';
  };

  const getAlignClass = () => {
    switch (settings.lyricAlignment) {
      case 'left': return 'text-left items-start pr-6 md:pr-12';
      case 'right': return 'text-right items-end pl-6 md:pl-12';
      default: return 'text-center items-center px-4 md:px-8';
    }
  };

  const getOrigin = () => {
    if (settings.lyricAlignment === 'left') return 'left center';
    if (settings.lyricAlignment === 'right') return 'right center';
    return 'center center';
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-x-0 top-20 bottom-36 md:top-32 md:bottom-40 overflow-hidden select-none"
      style={{
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
      }}
    >
      <div
        ref={innerRef}
        className={cn(
          'w-full max-w-5xl mx-auto relative flex flex-col will-change-transform',
          getAlignClass()
        )}
        style={{ transform: 'translateY(0px)' }}
      >
        {lyrics.map((line, i) => {
          const isActive = i === activeIndex;
          return (
            <div
              key={i}
              ref={(el) => { lineRefs.current[i] = el; }}
              className={cn(
                'w-full py-2 md:py-4 leading-tight',
                fontClass,
                getSizeClasses(isActive)
              )}
              style={{
                opacity: 0,
                transform: 'scale(0.95)',
                transformOrigin: getOrigin(),
                color: '#555',
                willChange: 'opacity, transform',
                // CSS transitions handle smoothness — no JS per-tick
                transition: 'opacity 0.3s ease, transform 0.3s ease, color 0.3s ease, text-shadow 0.3s ease',
              }}
            >
              {line.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}
