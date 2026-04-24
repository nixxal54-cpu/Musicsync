import React, { useEffect, useRef } from 'react';
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
  const currentYRef = useRef<number>(0);
  const lastActiveRef = useRef<number>(-2);

  // Runs every render (currentTime changes every 250ms from PlayerView)
  // All visual updates are direct DOM mutations — no setState, no extra re-render
  useEffect(() => {
    // Compute active index
    let activeIndex = -1;
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (currentTime - settings.lyricOffset >= lyrics[i].time) {
        activeIndex = i;
        break;
      }
    }

    // --- Update each line's style directly ---
    lineRefs.current.forEach((el, i) => {
      if (!el) return;
      const isActive = i === activeIndex;
      const isPassed = i < activeIndex;
      const distance = Math.abs(activeIndex - i);

      // Opacity
      let opacity = 0;
      if (isActive) opacity = 1;
      else if (distance < 5) opacity = Math.max(0, 1 - distance * 0.22);

      // Scale
      const scale = isActive ? 1 : 0.94;

      // Color
      let color = '#4a4a4a';
      if (isPassed) color = '#333';
      if (isActive) {
        switch (theme.highlightEffect) {
          case 'color': color = theme.primaryColor; break;
          case 'outline': color = 'transparent'; break;
          default: color = '#ffffff';
        }
      }

      // Glow / stroke / bold
      let textShadow = 'none';
      let webkitTextStroke = '0px transparent';
      if (isActive) {
        if (theme.highlightEffect === 'glow')
          textShadow = `0 0 24px ${theme.primaryColor}99, 0 0 48px ${theme.primaryColor}44`;
        if (theme.highlightEffect === 'outline')
          webkitTextStroke = `1.5px ${theme.primaryColor}`;
        if (theme.highlightEffect === 'bold')
          el.style.fontWeight = '800';
        else
          el.style.fontWeight = '';
      } else {
        el.style.fontWeight = '';
      }

      el.style.opacity = String(opacity);
      el.style.transform = `scale(${scale})`;
      el.style.color = color;
      el.style.textShadow = textShadow;
      (el.style as any).webkitTextStroke = webkitTextStroke;
    });

    // --- Scroll: only when active line changes ---
    if (lastActiveRef.current === activeIndex) return;
    lastActiveRef.current = activeIndex;

    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;

    const activeLine = lineRefs.current[activeIndex];
    const targetY =
      activeIndex === -1 || !activeLine
        ? container.clientHeight / 3
        : container.clientHeight / 2 - activeLine.offsetTop - activeLine.clientHeight / 2;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const animate = () => {
      const diff = targetY - currentYRef.current;
      if (Math.abs(diff) < 0.5) {
        currentYRef.current = targetY;
        inner.style.transform = `translateY(${targetY}px)`;
        return;
      }
      currentYRef.current += diff * 0.1;
      inner.style.transform = `translateY(${currentYRef.current}px)`;
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }); // <-- no dependency array: runs every render, which is every 250ms tick

  const fontClass =
    theme.fontStyle === 'elegant'
      ? 'font-serif'
      : theme.fontStyle === 'brutalist_mono'
        ? 'font-mono uppercase tracking-tight'
        : 'font-sans tracking-tight';

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

  // Size: use the larger (active) size for all lines — active line is visually
  // distinguished by opacity=1 + scale=1 vs others at 0.94. This avoids needing
  // re-render to swap class names per-line.
  const getSizeClass = () => {
    if (settings.lyricSize === 'small') return 'text-2xl md:text-4xl';
    if (settings.lyricSize === 'large') return 'text-3xl md:text-7xl';
    return 'text-2xl md:text-5xl lg:text-6xl';
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
          'w-full max-w-5xl mx-auto flex flex-col will-change-transform',
          getAlignClass()
        )}
        style={{ transform: 'translateY(0px)' }}
      >
        {lyrics.map((line, i) => (
          <div
            key={i}
            ref={(el) => { lineRefs.current[i] = el; }}
            className={cn(
              'w-full py-2 md:py-3 leading-tight',
              fontClass,
              getSizeClass()
            )}
            style={{
              opacity: 0,
              transform: 'scale(0.94)',
              transformOrigin: getOrigin(),
              color: '#4a4a4a',
              willChange: 'opacity, transform, color',
              transition: 'opacity 0.35s ease, transform 0.35s ease, color 0.35s ease, text-shadow 0.35s ease',
            }}
          >
            {line.text}
          </div>
        ))}
      </div>
    </div>
  );
}
