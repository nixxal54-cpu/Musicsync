import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ThemeConfig {
  mood: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundStyle: string;
  animation: string;
  fontStyle: string;
  highlightEffect: string;
}

export interface LyricLine {
  time: number;
  text: string;
}

export interface SongMetadata {
  theme: ThemeConfig;
  lyrics: LyricLine[];
}

function parseLRC(lrc: string): LyricLine[] {
  const lines = lrc.split('\n');
  const result: LyricLine[] = [];
  const timeReg = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
  
  for (const line of lines) {
    const match = line.match(timeReg);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const ms = parseInt(match[3], 10);
      const msNormalized = ms < 100 ? ms * 10 : ms; 
      
      const time = minutes * 60 + seconds + msNormalized / 1000;
      const text = line.replace(timeReg, '').trim();
      
      if (text) {
        result.push({ time, text });
      }
    }
  }
  return result;
}

export async function generateSongData(title: string, artist: string): Promise<SongMetadata> {
  // ATTEMPT 1: Fetch perfectly synced LRC lyrics from LRCLib Real-Time API
  let realLyrics: LyricLine[] | null = null;
  try {
    const searchUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`;
    const res = await fetch(searchUrl);
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        // Find the best match that has synced lyrics
        const bestMatch = data.find((d: any) => d.syncedLyrics);
        if (bestMatch?.syncedLyrics) {
          realLyrics = parseLRC(bestMatch.syncedLyrics);
        }
      }
    }
  } catch (err) {
    console.warn("Failed to fetch from LRCLib", err);
  }

  const prompt = `You are a music synchronization engine. The user has uploaded the song "${title}" by "${artist}".
Calculate the mood and visual theme parameters for this exact song.
${!realLyrics ? `Generate the COMPLETE lyrics for the ENTIRE song from start to finish.
Provide estimated timestamps (in seconds) that realistically align with the song's verses, choruses, and bridges. 
Do not stop halfway—generate the full length of the track.
Return a JSON with "theme" and "lyrics".` : `Return a JSON with strictly just "theme" as we already have synced lyrics.`}`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          theme: {
            type: Type.OBJECT,
            properties: {
              mood: { type: Type.STRING, description: "e.g., romantic, energetic, sad, calm, aggressive" },
              primaryColor: { type: Type.STRING, description: "hex color code representing the main mood hue" },
              secondaryColor: { type: Type.STRING, description: "hex color code complementing the primary color" },
              backgroundStyle: { type: Type.STRING, description: "e.g., gradient_blur, soft_gradient, dark_glow, neon_motion" },
              animation: { type: Type.STRING, description: "e.g., soft_fade, floating, snappy, glitch" },
              fontStyle: { type: Type.STRING, description: "e.g., elegant, modern_sans, brutalist_mono" },
              highlightEffect: { type: Type.STRING, description: "e.g., glow, color, bold, outline" },
            },
            required: ["mood", "primaryColor", "secondaryColor", "backgroundStyle", "animation", "fontStyle", "highlightEffect"]
          },
          ...(!realLyrics ? {
            lyrics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.NUMBER, description: "time in seconds when the line starts" },
                  text: { type: Type.STRING, description: "the line of lyrics" },
                },
                required: ["time", "text"]
              }
            }
          }: {})
        },
        required: ["theme", ...(!realLyrics ? ["lyrics"] : [])]
      }
    }
  });

  const rawJson = response.text || "{}";
  const parsed = JSON.parse(rawJson) as SongMetadata;

  return {
    theme: parsed.theme,
    lyrics: realLyrics || parsed.lyrics || []
  };
}
