import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeConfig } from '@/lib/gemini';
import { cn } from '@/lib/utils';

export function ThemeBackground({ theme, blur = 80 }: { theme: ThemeConfig | null, blur?: number }) {
  if (!theme) return null;

  // Reduced blur intensity for mobile performance
  const optimalBlur = Math.min(blur, 60);

  const getBackgroundMarkup = () => {
    switch (theme.backgroundStyle) {
      case 'dark_glow':
        return (
          <div className="absolute inset-0 z-0 overflow-hidden bg-[#0A0A0A]">
            <motion.div 
              animate={{ opacity: [0.3, 0.4, 0.3], scale: [1, 1.1, 1] }} 
              transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-1/4 left-1/4 w-[50vw] h-[50vh] rounded-full mix-blend-screen will-change-transform"
              style={{ backgroundColor: theme.primaryColor, filter: `blur(${optimalBlur}px)` }}
            />
            <motion.div 
              animate={{ opacity: [0.2, 0.3, 0.2], scale: [1.1, 1, 1.1] }} 
              transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute bottom-1/4 right-1/4 w-[60vw] h-[60vh] rounded-full mix-blend-screen will-change-transform"
              style={{ backgroundColor: theme.secondaryColor, filter: `blur(${optimalBlur + 10}px)` }}
            />
          </div>
        );
      case 'neon_motion':
        return (
          <div className="absolute inset-0 z-0 overflow-hidden bg-black">
             <motion.div 
               animate={{ x: [-50, 50, -50], y: [-25, 25, -25] }}
               transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
               className="absolute top-0 right-0 w-[150vw] h-[80vh] rounded-full opacity-40 mix-blend-color-dodge will-change-transform"
               style={{ backgroundColor: theme.primaryColor, filter: `blur(${optimalBlur + 20}px)` }}
             />
             <motion.div 
               animate={{ x: [50, -50, 50], y: [25, -25, 25] }}
               transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
               className="absolute bottom-0 left-0 w-[150vw] h-[80vh] rounded-full opacity-40 mix-blend-color-dodge will-change-transform"
               style={{ backgroundColor: theme.secondaryColor, filter: `blur(${optimalBlur + 20}px)` }}
             />
          </div>
        );
      case 'soft_gradient':
      default:
        return (
          <div className="absolute inset-0 z-0 overflow-hidden" style={{ background: '#050505' }}>
            <div 
              className="absolute inset-0 opacity-70 mix-blend-screen will-change-transform" 
              style={{
                backgroundImage: `radial-gradient(circle at 30% 20%, ${theme.primaryColor}40 0%, transparent 60%), radial-gradient(circle at 80% 80%, ${theme.secondaryColor}40 0%, transparent 60%)`,
                filter: `blur(${optimalBlur}px)`
              }}
            />
          </div>
        );
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key={theme.primaryColor + theme.backgroundStyle}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 2 }}
        className="fixed inset-0 pointer-events-none"
      >
        {getBackgroundMarkup()}
        {/* Fast CSS-only noise pattern instead of complex SVG filter */}
        <div className="absolute inset-0 opacity-[0.02] mix-blend-screen pointer-events-none" style={{ backgroundImage: `url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyBAMAAADsEZWCAAAAGFBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANYBG/AAAACHRSTlMAMwA0AEEAQwBfAFwAXwBf12B/WgAAAAlwSFlzAAALEwAACxMBAJqcGAAAAB3RJTUUH5QgUDzc76o8cDAAAACdJREFUOMtjYMAOGBgwQ1YwYIasYEAyGwkGxkQn6O8vIJoOBlQFxQAAQOABfS72VqYAAAAASUVORK5CYII=")`, backgroundRepeat: 'repeat' }} />
      </motion.div>
    </AnimatePresence>
  );
}
