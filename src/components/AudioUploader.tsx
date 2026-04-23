import React, { useRef } from 'react';
import { Upload, Music, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface AudioUploaderProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
  loadingMessage?: string;
}

export function AudioUploader({ onFileSelect, isLoading, loadingMessage }: AudioUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="flex w-full items-center justify-center min-h-screen bg-[#050505] inset-0 fixed z-10 p-6">
      <motion.div 
         initial={{ opacity: 0, scale: 0.95 }}
         animate={{ opacity: 1, scale: 1 }}
         className="w-full max-w-xl mx-auto rounded-3xl overflow-hidden shadow-2xl bg-[#111] border border-white/10"
      >
        <div className="p-12 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-8 relative">
            {isLoading && (
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border-[3px] border-white/10 border-t-white/80"
              />
            )}
            <Music className="w-10 h-10 text-white/50" />
          </div>
          
          <h1 className="text-4xl font-serif font-light text-white mb-4 tracking-tight">LyricSync</h1>
          <p className="text-white/40 mb-12 font-sans font-light text-sm max-w-sm h-10">
            {isLoading 
              ? (loadingMessage || "Generating visualizer...") 
              : "Upload a song to generate a dynamic immersive visualizer with AI-synced lyrics."}
          </p>
          
          <div className="w-full space-y-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="w-full group relative overflow-hidden rounded-full bg-white text-black py-4 px-8 font-medium transition-transform transform active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:active:scale-100 uppercase tracking-widest text-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Choose Audio File</span>
                </>
              )}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="audio/*" 
              onChange={handleFileChange}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
