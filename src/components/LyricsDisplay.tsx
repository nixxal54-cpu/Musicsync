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

// ── Visualizer: 20 bars animated via RAF, reads AnalyserNode if available ──
function Visualizer({ audioRef, color }: { audioRef: React.RefObject<HTMLAudioElement>; color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const BAR_COUNT = 28;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    // Try to hook up Web Audio analyser for real frequency data
    const audio = audioRef.current;
    if (audio && !analyserRef.current) {
      try {
        const ac = new AudioContext();
        ctxRef.current = ac;
        const source = ac.createMediaElementSource(audio);
        const analyser = ac.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyser.connect(ac.destination);
        analyserRef.current = analyser;
        dataRef.current = new Uint8Array(analyser.frequencyBinCount);
      } catch (_) {
        // fallback to fake animation if already connected
      }
    }

    // Fake heights for fallback animation
    const fakePhases = Array.from({ length: BAR_COUNT }, (_, i) => Math.random() * Math.PI * 2);
    const fakeSpeeds = Array.from({ length: BAR_COUNT }, () => 0.03 + Math.random() * 0.04);

    let frame = 0;

    const draw = () => {
      frame++;
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const barW = W / BAR_COUNT;
      const gap = 3;

      for (let i = 0; i < BAR_COUNT; i++) {
        let heightRatio: number;

        if (analyserRef.current && dataRef.current) {
          analyserRef.current.getByteFrequencyData(dataRef.current);
          const idx = Math.floor((i / BAR_COUNT) * dataRef.current.length);
          heightRatio = dataRef.current[idx] / 255;
        } else {
          // Smooth fake wave
          fakePhases[i] += fakeSpeeds[i];
          heightRatio = 0.15 + 0.7 * Math.abs(Math.sin(fakePhases[i]));
        }

        const barH = Math.max(4, heightRatio * H * 0.85);
        const x = i * barW + gap / 2;
        const y = (H - barH) / 2;

        // Gradient per bar
        const grad = ctx.createLinearGradient(x, y, x, y + barH);
        grad.addColorStop(0, color + 'ff');
        grad.addColorStop(1, color + '33');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barW - gap, barH, 3);
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
      height={80}
      className="w-64 md:w-80 h-16 md:h-20"
      style={{ imageRendering: 'pixelated' }}
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

      // Active index
      let activeIndex = -1;
      for (let i = lyrics.length - 1; i >= 0; i--) {
        if (ct - offset >= lyrics[i].time) {
          activeIndex = i;
          break;
        }
      }

      // Show/hide visualizer — visible when no active lyric
      const showViz = activeIndex === -1;
      const viz = vizRef.current;
      if (viz) {
        if (showViz !== vizVisibleRef.current) {
          vizVisibleRef.current = showViz;
          viz.style.opacity = showViz ? '1' : '0';
          viz.style.transform = showViz ? 'translateY(0px) scale(1)' : 'translateY(10px) scale(0.95)';
        }
      }

      // Update each line style
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
      {/* Visualizer — shown when no lyric is active */}
      <div
        ref={vizRef}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          opacity: 1,
          transform: 'translateY(0px) scale(1)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}
      >
        <Visualizer audioRef={audioRef} color={theme.primaryColor} />
      </div>

      {/* Lyrics inner — RAF owns transform */}
      <div
        ref={innerRef}
        className={cn('w-full max-w-5xl mx-auto flex flex-col will-change-transform', getAlignClass())}
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
