import React, { useState } from 'react';
import { extractMetadata, FileMetadata } from '@/lib/metadata';
import { generateSongData, SongMetadata } from '@/lib/gemini';
import { AudioUploader } from '@/components/AudioUploader';
import { PlayerView } from '@/components/PlayerView';

export default function App() {
  const [appState, setAppState] = useState<'upload' | 'loading' | 'player'>('upload');
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [metadata, setMetadata] = useState<FileMetadata | null>(null);
  const [songData, setSongData] = useState<SongMetadata | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setAppState('loading');
    setLoadingMessage('Optimizing audio file...');
    
    try {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);

      setLoadingMessage('Extracting metadata and fetching synced lyrics...');
      const meta = await extractMetadata(file);
      setMetadata(meta);

      setLoadingMessage(`Analyzing theme for "${meta.title}"...`);
      // Fallback timeout for Gemini to prevent permanent hang
      const data = await Promise.race([
        generateSongData(meta.title, meta.artist),
        new Promise<SongMetadata>((_, reject) => 
          setTimeout(() => reject(new Error("AI Generation Timeout")), 35000)
        )
      ]);
      
      setSongData(data);
      setAppState('player');
    } catch (e) {
      console.warn("Failed to load song or AI timeout", e);
      // If AI fails/times out, we launch anyway with a default theme to avoid breaking UX
      if (!songData && metadata) {
         setSongData({
           theme: {
             mood: "Default",
             primaryColor: "#FF3366",
             secondaryColor: "#6b0f1a",
             backgroundStyle: "gradient_blur",
             animation: "soft_fade",
             fontStyle: "sans",
             highlightEffect: "glow"
           },
           lyrics: [{ time: 0, text: "Lyrics unavailable for this track." }]
         });
         setAppState('player');
      } else {
         setAppState('upload');
      }
    }
  };

  const reset = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAppState('upload');
    setLoadingMessage('');
    setMetadata(null);
    setSongData(null);
    setAudioUrl(null);
  };

  if (appState === 'player' && metadata && songData && audioUrl) {
    return (
      <PlayerView 
        metadata={metadata} 
        audioUrl={audioUrl} 
        theme={songData.theme} 
        lyrics={songData.lyrics} 
        onBack={reset} 
      />
    );
  }

  return (
    <AudioUploader 
      onFileSelect={handleFileSelect} 
      isLoading={appState === 'loading'} 
      loadingMessage={loadingMessage}
    />
  );
}
