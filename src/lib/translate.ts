import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface LyricLine {
  time: number;
  text: string;
}

export type TranslateTarget =
  | 'hinglish'      // Hindi → Roman script
  | 'english'
  | 'spanish'
  | 'french'
  | 'arabic_roman'  // Arabic → Roman
  | 'tamil_roman'   // Tamil → Roman
  | 'japanese_roman'
  | 'korean_roman';

export const TRANSLATE_OPTIONS: { value: TranslateTarget; label: string; description: string }[] = [
  { value: 'hinglish',       label: 'Hinglish',        description: 'Hindi → Roman script' },
  { value: 'english',        label: 'English',          description: 'Translate to English' },
  { value: 'spanish',        label: 'Spanish',          description: 'Translate to Spanish' },
  { value: 'french',         label: 'French',           description: 'Translate to French' },
  { value: 'arabic_roman',   label: 'Arabic Romanized', description: 'Arabic → Roman script' },
  { value: 'tamil_roman',    label: 'Tamil Romanized',  description: 'Tamil → Roman script' },
  { value: 'japanese_roman', label: 'Romaji',           description: 'Japanese → Romaji' },
  { value: 'korean_roman',   label: 'Romanized Korean', description: 'Korean → Roman script' },
];

// Detect if lyrics are in a non-Latin script (Hindi, Tamil, Arabic, Japanese, Korean, etc.)
export function detectNonLatinScript(lyrics: LyricLine[]): string | null {
  const sample = lyrics.slice(0, 5).map(l => l.text).join(' ');

  if (/[\u0900-\u097F]/.test(sample)) return 'Hindi';
  if (/[\u0B80-\u0BFF]/.test(sample)) return 'Tamil';
  if (/[\u0600-\u06FF]/.test(sample)) return 'Arabic';
  if (/[\u3040-\u30FF\u4E00-\u9FFF]/.test(sample)) return 'Japanese';
  if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(sample)) return 'Korean';
  if (/[\u0400-\u04FF]/.test(sample)) return 'Russian';
  if (/[\u0370-\u03FF]/.test(sample)) return 'Greek';
  if (/[\u0E00-\u0E7F]/.test(sample)) return 'Thai';

  return null; // Latin script already
}

export async function translateLyrics(
  lyrics: LyricLine[],
  target: TranslateTarget
): Promise<LyricLine[]> {
  const instructions: Record<TranslateTarget, string> = {
    hinglish:       'Transliterate each Hindi lyric line into Roman script (Hinglish). Keep the pronunciation feel, do not translate the meaning.',
    english:        'Translate each lyric line into natural English.',
    spanish:        'Translate each lyric line into natural Spanish.',
    french:         'Translate each lyric line into natural French.',
    arabic_roman:   'Transliterate each Arabic lyric line into Roman/Latin script. Preserve pronunciation.',
    tamil_roman:    'Transliterate each Tamil lyric line into Roman script. Preserve pronunciation.',
    japanese_roman: 'Convert each Japanese lyric line into standard Romaji. Preserve pronunciation.',
    korean_roman:   'Romanize each Korean lyric line using standard Romanization. Preserve pronunciation.',
  };

  const linesJson = JSON.stringify(lyrics.map((l, i) => ({ i, text: l.text })));

  const prompt = `You are a lyrics translator/transliterator.
${instructions[target]}
Return ONLY a JSON array of objects with "i" (original index, integer) and "text" (translated/transliterated string).
Do not add any explanation. Do not change the number of items.
Input lines:
${linesJson}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });

  const raw = response.text?.replace(/```json|```/g, '').trim() || '[]';
  const parsed: { i: number; text: string }[] = JSON.parse(raw);

  return lyrics.map((line, i) => {
    const match = parsed.find(p => p.i === i);
    return { time: line.time, text: match ? match.text : line.text };
  });
}
