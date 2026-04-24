import React, { useEffect, useRef } from 'react';
import { LyricLine, ThemeConfig } from '@/lib/gemini';
import { cn } from '@/lib/utils';
import { UserSettings } from '@/lib/useSettings';

interface LyricsDisplayProps {
  lyrics: LyricLine[];
  audioRef: React.RefObject<HTMLAudioElement>;
  lyricOffset: number;
  theme: ThemeConfig;
  settings: UserSettings;
}

// Fake-only visualizer — no Web Audio API touching the element
function Visualizer({ color }: { color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const BAR_COUNT = 28;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const phases = Array.from({ length: BAR_COUNT }, () => Math.random() * Math.PI * 2);
    const speeds = Array.from({ length: BAR_COUNT }, (_, i) => 0.025 + (i % 4) * 0.012);
    // Each bar has a different amplitude so it looks organic
    const amps = Array.from({ length: BAR_COUNT }, () => 0.4 + Math.random() * 0.5);

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const barW = W / BAR_COUNT;
      const gap = 4;

      for (let i = 0; i < BAR_COUNT; i++) {
        phases[i] += speeds[i];
        const heightRatio = 0.1 + amps[i] * Math.abs(Math.sin(phases[i]));
        const barH = Math.max(5, heightRatio * H);
        const x = i * barW + gap / 2;
        const y = (H - barH) / 2;

        const grad = ctx.createLinearGradient(x, y, x, y + barH);
        grad.addColorStop(0, color + 'ee');
        grad.addColorStop(1, color + '22');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barW - gap, barH, 4);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [color]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={100}
      style={{ width: '280px', height: '88px' }}
    />
  );
}

export function LyricsDisplay({ lyrics, audioRef, lyricOffset, theme, settings }: LyricsDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const vizRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const currentYRef = useRef<number>(0);
  const targetYRef = useRef<number>(0);
  const lastActiveRef = useRef<number>(-2);
  const vizVisibleRef = useRef<boolean>(true);

  const settingsRef = useRef(settings);
  const themeRef = useRef(theme);
  const lyricOffsetRef = useRef(lyricOffset);
  settingsRef.current = settings;
  themeRef.current = theme;
  lyricOffsetRef.current = lyricOffset;

  useEffect(() => {
    const tick = () => {
      const audio = audioRef.current;
      const ct = audio ? audio.currentTime : 0;
      const offset = lyricOffsetRef.current;
      const t = themeRef.current;

      let activeIndex = -1;
      for (let i = lyrics.length - 1; i >= 0; i--) {
        if (ct - offset >= lyrics[i].time) {
          activeIndex = i;
          break;
        }
      }

      // Visualizer visibility
      const showViz = activeIndex === -1;
      const viz = vizRef.current;
      if (viz && showViz !== vizVisibleRef.current) {
        vizVisibleRef.current = showViz;
        viz.style.opacity = showViz ? '1' : '0';
        viz.style.pointerEvents = showViz ? 'none' : 'none';
      }

      // Line styles
      lineRefs.current.forEach((el, i) => {
        if (!el) return;
        const isActive = i === activeIndex;
        const isPassed = i < activeIndex;
        const distance = Math.abs(activeIndex - i);

        const opacity = isActive ? 1 : distance < 5 ? Math.max(0, 1 - distance * 0.22) : 0;
        const scale = isActive ? 1 : 0.94;

        let color = '#444';
        if (isPassed) color = '#2a2a2a';
        if (isActive) {
          switch (t.highlightEffect) {
            case 'color': color = t.primaryColor; break;
            case 'outline': color = 'transparent'; break;
            default: color = '#ffffff';
          }
        }

        let textShadow = 'none';
        (el.style as any).webkitTextStroke = '0px transparent';
        el.style.fontWeight = '';

        if (isActive) {
          if (t.highlightEffect === 'glow')
            textShadow = `0 0 24px ${t.primaryColor}99, 0 0 48px ${t.primaryColor}44`;
          if (t.highlightEffect === 'outline')
            (el.style as any).webkitTextStroke = `1.5px ${t.primaryColor}`;
          if (t.highlightEffect === 'bold')
            el.style.fontWeight = '800';
        }

        el.style.opacity = String(opacity);
        el.style.transform = `scale(${scale})`;
        el.style.color = color;
        el.style.textShadow = textShadow;
      });

      // Scroll
      if (lastActiveRef.current !== activeIndex) {
        lastActiveRef.current = activeIndex;
        const container = containerRef.current;
        const activeLine = lineRefs.current[activeIndex];
        if (container) {
          if (activeIndex === -1 || !activeLine) {
            targetYRef.current = container.clientHeight / 3;
          } else {
            targetYRef.current =
              container.clientHeight / 2 - activeLine.offsetTop - activeLine.clientHeight / 2;
          }
        }
      }

      const inner = innerRef.current;
      if (inner) {
        const diff = targetYRef.current - currentYRef.current;
        if (Math.abs(diff) > 0.4) {
          currentYRef.current += diff * 0.08;
          inner.style.transform = `translateY(${currentYRef.current}px)`;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [lyrics, audioRef]);

  const fontClass =
    theme.fontStyle === 'elegant' ? 'font-serif'
    : theme.fontStyle === 'brutalist_mono' ? 'font-mono uppercase tracking-tight'
    : 'font-sans tracking-tight';

  const getAlignClass = () => {
    if (settings.lyricAlignment === 'left') return 'text-left items-start pr-6 md:pr-12';
    if (settings.lyricAlignment === 'right') return 'text-right items-end pl-6 md:pl-12';
    return 'text-center items-center px-4 md:px-8';
  };

  const getOrigin = () => {
    if (settings.lyricAlignment === 'left') return 'left center';
    if (settings.lyricAlignment === 'right') return 'right center';
    return 'center center';
  };

  const getSizeClass = () => {
    if (settings.lyricSize === 'small') return 'text-xl md:text-4xl';
    if (settings.lyricSize === 'large') return 'text-3xl md:text-7xl';
    return 'text-2xl md:text-5xl lg:text-6xl';
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-x-0 top-20 bottom-36 md:top-32 md:bottom-40 overflow-hidden"
      style={{
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
      }}
    >
      {/* Visualizer — centered, fades out when lyrics kick in */}
      <div
        ref={vizRef}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          opacity: 1,
          transition: 'opacity 0.6s ease',
          zIndex: 0,
        }}
      >
        <Visualizer color={theme.primaryColor} />
      </div>

      {/* Lyrics — RAF owns translateY */}
      <div
        ref={innerRef}
        className={cn('relative w-full max-w-5xl mx-auto flex flex-col will-change-transform', getAlignClass())}
        style={{ zIndex: 1 }}
      >
        {lyrics.map((line, i) => (
          <div
            key={i}
            ref={(el) => { lineRefs.current[i] = el; }}
            className={cn('w-full py-2 md:py-3 leading-tight', fontClass, getSizeClass())}
            style={{
              opacity: 0,
              transform: 'scale(0.94)',
              transformOrigin: getOrigin(),
              color: '#444',
              willChange: 'opacity, transform, color',
              transition: 'opacity 0.3s ease, transform 0.3s ease, color 0.3s ease, text-shadow 0.3s ease',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }}
          >
            {line.text}
          </div>
        ))}
      </div>
    </div>
  );
}
