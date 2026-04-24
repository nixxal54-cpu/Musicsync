import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Play, Pause, SkipBack, SkipForward, Mic2, MicOff, X, Languages, ChevronDown, Check, Loader2 } from 'lucide-react';
import { ThemeConfig, LyricLine } from '@/lib/gemini';
import { LyricsDisplay } from './LyricsDisplay';
import { ThemeBackground } from './ThemeBackground';
import { KaraokeAudioFilter } from '@/lib/karaoke';
import { cn } from '@/lib/utils';
import { FileMetadata } from '@/lib/metadata';
import { useSettings } from '@/lib/useSettings';
import { detectNonLatinScript, translateLyrics, TRANSLATE_OPTIONS, TranslateTarget } from '@/lib/translate';

interface PlayerViewProps {
  metadata: FileMetadata;
  audioUrl: string;
  theme: ThemeConfig;
  lyrics: LyricLine[];
  onBack: () => void;
}

export function PlayerView({ metadata, audioUrl, theme, lyrics, onBack }: PlayerViewProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const filterRef = useRef<KaraokeAudioFilter | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [karaokeMode, setKaraokeMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [lyricOffset, setLyricOffset] = useState(0);
  const { settings, updateSetting } = useSettings();
  const [customTheme, setCustomTheme] = useState<ThemeConfig>(theme);

  // Translation state
  const [activeLyrics, setActiveLyrics] = useState<LyricLine[]>(lyrics);
  const [detectedLang, setDetectedLang] = useState<string | null>(null);
  const [showTranslateToast, setShowTranslateToast] = useState(false);
  const [translateTarget, setTranslateTarget] = useState<TranslateTarget>('hinglish');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);

  // Detect language on lyrics load
  useEffect(() => {
    setActiveLyrics(lyrics);
    setIsTranslated(false);
    const lang = detectNonLatinScript(lyrics);
    setDetectedLang(lang);
    if (lang) {
      // Auto-set sensible default target
      if (lang === 'Hindi')      setTranslateTarget('hinglish');
      else if (lang === 'Tamil')     setTranslateTarget('tamil_roman');
      else if (lang === 'Bengali')   setTranslateTarget('bengali_roman');
      else if (lang === 'Telugu')    setTranslateTarget('telugu_roman');
      else if (lang === 'Kannada')   setTranslateTarget('kannada_roman');
      else if (lang === 'Malayalam') setTranslateTarget('malayalam_roman');
      else if (lang === 'Gujarati')  setTranslateTarget('gujarati_roman');
      else if (lang === 'Punjabi')   setTranslateTarget('punjabi_roman');
      else if (lang === 'Odia')      setTranslateTarget('odia_roman');
      else if (lang === 'Santali')   setTranslateTarget('english');
      else if (lang === 'Manipuri')  setTranslateTarget('english');
      else if (lang === 'Arabic')    setTranslateTarget('arabic_roman');
      else if (lang === 'Japanese')  setTranslateTarget('japanese_roman');
      else if (lang === 'Korean')    setTranslateTarget('korean_roman');
      else setTranslateTarget('english');

      // Show toast after short delay
      setTimeout(() => setShowTranslateToast(true), 1200);
    }
  }, [lyrics]);

  const doTranslate = async (target?: TranslateTarget) => {
    const t = target ?? translateTarget;
    setIsTranslating(true);
    setShowTranslateToast(false);
    try {
      const translated = await translateLyrics(lyrics, t);
      setActiveLyrics(translated);
      setIsTranslated(true);
    } catch (e) {
      console.error('Translation failed', e);
    } finally {
      setIsTranslating(false);
    }
  };

  const revertToOriginal = () => {
    setActiveLyrics(lyrics);
    setIsTranslated(false);
  };

  useEffect(() => {
    if (audioRef.current && !filterRef.current) {
      filterRef.current = new KaraokeAudioFilter(audioRef.current);
    }
  }, []);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (filterRef.current) filterRef.current.init();
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play().catch(e => console.error('Playback failed:', e));
  };

  const toggleKaraoke = () => {
    const newMode = !karaokeMode;
    setKaraokeMode(newMode);
    if (filterRef.current) filterRef.current.setMode(newMode);
  };

  return (
    <div
      className="relative w-full h-screen overflow-hidden bg-black text-white font-sans transition-all duration-300"
      style={{ filter: `brightness(${settings.brightness}%)` }}
    >
      <ThemeBackground theme={customTheme} blur={settings.backgroundBlur} />

      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <LyricsDisplay
        lyrics={activeLyrics}
        audioRef={audioRef}
        lyricOffset={lyricOffset}
        theme={customTheme}
        settings={settings}
      />

      {/* ── Translate Toast ── */}
      <AnimatePresence>
        {showTranslateToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="absolute bottom-44 md:bottom-52 left-1/2 -translate-x-1/2 z-50 w-[90vw] max-w-sm"
          >
            <div className="bg-[#111]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FF3366]/15 flex items-center justify-center shrink-0">
                  <Languages className="w-4 h-4 text-[#FF3366]" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-white text-sm font-semibold leading-snug">
                    {detectedLang} lyrics detected
                  </p>
                  <p className="text-white/50 text-xs leading-snug">
                    Translate to a language you understand?
                  </p>
                </div>
                <button
                  onClick={() => setShowTranslateToast(false)}
                  className="ml-auto text-white/30 hover:text-white/70 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Language picker inside toast */}
              <div className="relative">
                <button
                  onClick={() => setShowLangPicker(p => !p)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 hover:bg-white/10 transition"
                >
                  <span>{TRANSLATE_OPTIONS.find(o => o.value === translateTarget)?.label}</span>
                  <ChevronDown className={cn('w-4 h-4 text-white/40 transition-transform', showLangPicker && 'rotate-180')} />
                </button>
                <AnimatePresence>
                  {showLangPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="absolute bottom-full mb-2 left-0 right-0 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-10 max-h-64 overflow-y-auto"
                    >
                      {(['Global', 'Indian', 'Indian Romanized'] as const).map(group => {
                        const groupOpts = TRANSLATE_OPTIONS.filter(o => o.group === group);
                        if (!groupOpts.length) return null;
                        return (
                          <div key={group}>
                            <div className="px-3 py-1.5 bg-white/5 text-[9px] uppercase tracking-widest font-bold text-white/30 sticky top-0">
                              {group}
                            </div>
                            {groupOpts.map(opt => (
                              <button
                                key={opt.value}
                                onClick={() => { setTranslateTarget(opt.value); setShowLangPicker(false); }}
                                className={cn(
                                  'w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-white/5 transition text-left',
                                  translateTarget === opt.value ? 'text-[#FF3366]' : 'text-white/70'
                                )}
                              >
                                <span>{opt.label}</span>
                                {translateTarget === opt.value && <Check className="w-3.5 h-3.5 text-[#FF3366] shrink-0" />}
                              </button>
                            ))}
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => doTranslate()}
                className="w-full py-2.5 bg-[#FF3366] hover:bg-[#e0204f] rounded-xl text-sm font-bold text-white tracking-wide transition-colors"
              >
                Yes, Translate
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Translating spinner */}
      <AnimatePresence>
        {isTranslating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-[#FF3366] animate-spin" />
              <p className="text-white/70 text-sm font-medium">Translating lyrics...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <h1 className="absolute top-4 left-4 md:top-8 md:left-8 text-white/50 text-base md:text-xl font-light tracking-widest flex items-center gap-3 md:gap-4 z-40 max-w-[70vw]">
        {metadata.coverUrl && (
          <img src={metadata.coverUrl} className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover shadow-lg opacity-80" alt="cover" />
        )}
        <div className="flex flex-col min-w-0">
          <span className="text-white font-medium truncate">{metadata.title}</span>
          <span className="text-[10px] md:text-xs text-white/40 uppercase tracking-widest truncate">{metadata.artist}</span>
        </div>
      </h1>

      <button
        onClick={() => setShowSettings(!showSettings)}
        className="absolute top-4 right-4 md:top-8 md:right-8 w-10 h-10 md:w-12 md:h-12 z-50 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 backdrop-blur-md transition-colors border border-white/10"
      >
        <Settings className="w-4 h-4 md:w-5 md:h-5" />
      </button>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-16 right-4 left-4 md:left-auto md:top-24 md:right-8 w-auto md:w-[22rem] bg-[#111111]/90 backdrop-blur-3xl border border-white/10 rounded-3xl p-5 shadow-2xl z-50 flex flex-col gap-5 max-h-[75vh] md:max-h-[70vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-white font-medium tracking-wide">Theme & Settings</h3>
              <button onClick={() => setShowSettings(false)} className="text-white/50 hover:text-white transition p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">

              {/* ── Translate Section ── */}
              <div className="space-y-3">
                <label className="text-xs text-white/50 uppercase tracking-widest font-semibold font-mono flex items-center gap-2">
                  <Languages className="w-3.5 h-3.5" /> Translate Lyrics
                </label>

                {/* Language selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowLangPicker(p => !p)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 hover:bg-white/10 transition"
                  >
                    <span>{TRANSLATE_OPTIONS.find(o => o.value === translateTarget)?.label ?? 'Select language'}</span>
                    <ChevronDown className={cn('w-4 h-4 text-white/40 transition-transform', showLangPicker && 'rotate-180')} />
                  </button>
                  <AnimatePresence>
                    {showLangPicker && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="absolute top-full mt-2 left-0 right-0 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-10 max-h-52 overflow-y-auto"
                      >
                        {(['Global', 'Indian', 'Indian Romanized'] as const).map(group => {
                          const groupOpts = TRANSLATE_OPTIONS.filter(o => o.group === group);
                          if (!groupOpts.length) return null;
                          return (
                            <div key={group}>
                              <div className="px-3 py-1.5 bg-white/5 text-[9px] uppercase tracking-widest font-bold text-white/30 sticky top-0">
                                {group}
                              </div>
                              {groupOpts.map(opt => (
                                <button
                                  key={opt.value}
                                  onClick={() => { setTranslateTarget(opt.value); setShowLangPicker(false); }}
                                  className={cn(
                                    'w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-white/5 transition text-left gap-2',
                                    translateTarget === opt.value ? 'text-[#FF3366]' : 'text-white/70'
                                  )}
                                >
                                  <span className="font-medium">{opt.label}</span>
                                  {translateTarget === opt.value && <Check className="w-3.5 h-3.5 text-[#FF3366] shrink-0" />}
                                </button>
                              ))}
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => doTranslate()}
                    disabled={isTranslating}
                    className="flex-1 py-2 bg-[#FF3366]/90 hover:bg-[#FF3366] disabled:opacity-50 rounded-xl text-xs font-bold text-white tracking-wide transition-colors flex items-center justify-center gap-1.5"
                  >
                    {isTranslating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Languages className="w-3.5 h-3.5" />}
                    Translate
                  </button>
                  {isTranslated && (
                    <button
                      onClick={revertToOriginal}
                      className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white/60 tracking-wide transition-colors"
                    >
                      Original
                    </button>
                  )}
                </div>

                {isTranslated && (
                  <p className="text-[10px] text-[#FF3366]/80 font-mono">
                    ✓ Showing translated lyrics
                  </p>
                )}
              </div>

              <div className="border-t border-white/10 pt-1" />

              {/* Typeface */}
              <div className="space-y-3">
                <label className="text-xs text-white/50 uppercase tracking-widest font-semibold font-mono">Typeface</label>
                <div className="grid grid-cols-3 gap-2">
                  {['sans', 'elegant', 'brutalist_mono'].map(f => (
                    <button key={f} onClick={() => setCustomTheme({ ...customTheme, fontStyle: f })}
                      className={cn('py-2 px-1 text-[10px] uppercase font-bold rounded-xl border transition-all truncate', customTheme.fontStyle === f ? 'bg-white text-black border-white' : 'border-white/10 text-white/50 hover:bg-white/5 hover:text-white')}>
                      {f.split('_')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Animation */}
              <div className="space-y-3">
                <label className="text-xs text-white/50 uppercase tracking-widest font-semibold font-mono">Animation</label>
                <div className="grid grid-cols-3 gap-2">
                  {['soft_fade', 'floating', 'snappy'].map(a => (
                    <button key={a} onClick={() => setCustomTheme({ ...customTheme, animation: a })}
                      className={cn('py-2 px-1 text-[10px] uppercase font-bold rounded-xl border transition-all truncate', customTheme.animation === a ? 'bg-[#FF3366] text-white border-[#FF3366]' : 'border-white/10 text-white/50 hover:bg-white/5 hover:text-white')}>
                      {a.split('_')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Highlight */}
              <div className="space-y-3">
                <label className="text-xs text-white/50 uppercase tracking-widest font-semibold font-mono">Highlight</label>
                <div className="grid grid-cols-4 gap-2">
                  {['glow', 'color', 'outline', 'bold'].map(h => (
                    <button key={h} onClick={() => setCustomTheme({ ...customTheme, highlightEffect: h })}
                      className={cn('py-2 px-1 text-[10px] uppercase font-bold rounded-xl border transition-all truncate', customTheme.highlightEffect === h ? 'bg-white/20 text-white border-white/40' : 'border-white/10 text-white/50 hover:bg-white/5 hover:text-white')}>
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size & Align */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="text-xs text-white/50 uppercase tracking-widest font-semibold font-mono">Size</label>
                  <div className="flex gap-2">
                    {['small', 'medium', 'large'].map(s => (
                      <button key={s} onClick={() => updateSetting('lyricSize', s as any)}
                        className={cn('flex-1 py-1.5 text-[10px] uppercase font-bold rounded-md border transition-all', settings.lyricSize === s ? 'bg-white/20 text-white border-white/40' : 'border-transparent text-white/50 hover:bg-white/5')}>
                        {s.charAt(0)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-xs text-white/50 uppercase tracking-widest font-semibold font-mono">Align</label>
                  <div className="flex gap-2">
                    {['left', 'center', 'right'].map(s => (
                      <button key={s} onClick={() => updateSetting('lyricAlignment', s as any)}
                        className={cn('flex-1 py-1.5 text-[10px] uppercase font-bold rounded-md border transition-all', settings.lyricAlignment === s ? 'bg-white/20 text-white border-white/40' : 'border-transparent text-white/50 hover:bg-white/5')}>
                        {s.charAt(0)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/50 uppercase tracking-widest font-semibold font-mono">Brightness</span>
                  <span className="text-white/30 font-mono">{settings.brightness}%</span>
                </div>
                <input type="range" min="30" max="150" value={settings.brightness}
                  onChange={(e) => updateSetting('brightness', parseInt(e.target.value))}
                  className="w-full h-1 bg-white/20 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer" />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/50 uppercase tracking-widest font-semibold font-mono">Blur</span>
                  <span className="text-white/30 font-mono">{settings.backgroundBlur}px</span>
                </div>
                <input type="range" min="0" max="200" value={settings.backgroundBlur}
                  onChange={(e) => updateSetting('backgroundBlur', parseInt(e.target.value))}
                  className="w-full h-1 bg-white/20 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer" />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/50 uppercase tracking-widest font-semibold font-mono text-[10px]">Lyric Sync</span>
                  <span className="text-[#FF3366] font-mono">{lyricOffset > 0 ? '+' : ''}{lyricOffset.toFixed(1)}s</span>
                </div>
                <div className="flex gap-2 h-8">
                  <button onClick={() => setLyricOffset(prev => Math.round((prev - 0.5) * 10) / 10)} className="flex-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-mono text-white/70">-0.5s</button>
                  <button onClick={() => setLyricOffset(0)} className="flex-1 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] uppercase tracking-widest font-bold text-white/50">Reset</button>
                  <button onClick={() => setLyricOffset(prev => Math.round((prev + 0.5) * 10) / 10)} className="flex-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-mono text-white/70">+0.5s</button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs text-white/50 uppercase tracking-widest font-semibold font-mono">Colors</label>
                <div className="flex gap-4">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 hover:border-white/50 transition-colors">
                    <input title="Primary Color" type="color" value={customTheme.primaryColor} onChange={(e) => setCustomTheme({ ...customTheme, primaryColor: e.target.value })} className="absolute inset-[-10px] w-20 h-20 cursor-pointer" />
                  </div>
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 hover:border-white/50 transition-colors">
                    <input title="Secondary Color" type="color" value={customTheme.secondaryColor} onChange={(e) => setCustomTheme({ ...customTheme, secondaryColor: e.target.value })} className="absolute inset-[-10px] w-20 h-20 cursor-pointer" />
                  </div>
                </div>
              </div>

              <button onClick={onBack} className="w-full mt-2 py-3 bg-[#e53935]/10 text-[#ff5252] border border-[#e53935]/30 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-[#e53935]/20 transition-colors">
                Quit Player
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls bar */}
      <div className="absolute inset-x-4 bottom-4 md:inset-x-8 md:bottom-8 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-3xl p-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4 z-40 shadow-2xl">
        <div className="flex w-full md:w-auto items-center justify-between md:justify-start md:gap-6">
          <button
            onClick={toggleKaraoke}
            className={cn('flex items-center justify-center gap-2 px-3 py-2 md:px-5 md:py-2.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all',
              karaokeMode ? 'bg-[#FF3366] text-white shadow-[0_0_20px_rgba(255,51,102,0.4)]' : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
            )}>
            {karaokeMode ? <MicOff className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Mic2 className="w-3.5 h-3.5 md:w-4 md:h-4" />}
            <span className="hidden md:inline">{karaokeMode ? 'Karaoke ON' : 'Karaoke OFF'}</span>
            <span className="md:hidden">{karaokeMode ? 'ON' : 'OFF'}</span>
          </button>

          <div className="flex items-center gap-4 md:gap-8 md:absolute md:left-1/2 md:-translate-x-1/2">
            <button onClick={() => { if (audioRef.current) audioRef.current.currentTime -= 10; }} className="text-white/40 hover:text-white hover:scale-110 active:scale-95 transition-all">
              <SkipBack className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" />
            </button>
            <button
              onClick={handlePlayPause}
              className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)]"
            >
              {isPlaying ? <Pause className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" /> : <Play className="w-5 h-5 md:w-6 md:h-6 ml-1" fill="currentColor" />}
            </button>
            <button onClick={() => { if (audioRef.current) audioRef.current.currentTime += 10; }} className="text-white/40 hover:text-white hover:scale-110 active:scale-95 transition-all">
              <SkipForward className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-[240px]">
          <span className="text-[10px] font-mono text-white/50 min-w-[32px] text-right">
            {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}
          </span>
          <div className="h-2 md:h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden cursor-pointer md:hover:h-2 transition-all group relative"
            onClick={(e) => {
              if (audioRef.current && duration) {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                audioRef.current.currentTime = pos * duration;
              }
            }}>
            <div className="h-full bg-white group-hover:bg-[#FF3366] transition-colors rounded-full" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
          </div>
          <span className="text-[10px] font-mono text-white/50 min-w-[32px]">
            {Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}
          </span>
        </div>
      </div>
    </div>
  );
}
