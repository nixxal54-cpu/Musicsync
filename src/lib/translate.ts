import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface LyricLine {
  time: number;
  text: string;
}

export type TranslateTarget =
  | 'tanglish'     // Tamil + English → Roman
  | 'manglish'     // Malayalam + English → Roman
  | 'hinglish'     // Hindi + English → Roman
  | 'tenglish'     // Telugu + English → Roman
  | 'kanglish'     // Kannada + English → Roman
  | 'banglish'     // Bengali + English → Roman
  | 'punglish'     // Punjabi + English → Roman
  | 'minglish'     // Marathi + English → Roman
  | 'spanglish'    // Spanish + English → Roman
  | 'franglais'    // French + English → Roman
  | 'chinglish'    // Chinese + English → Roman
  | 'japanglish'   // Japanese + English → Roman
  | 'arablish';    // Arabic + English → Roman

export const TRANSLATE_OPTIONS: { value: TranslateTarget; label: string; description: string }[] = [
  { value: 'tanglish',   label: 'Tanglish',   description: 'Tamil + English'     },
  { value: 'manglish',   label: 'Manglish',   description: 'Malayalam + English' },
  { value: 'hinglish',   label: 'Hinglish',   description: 'Hindi + English'     },
  { value: 'tenglish',   label: 'Tenglish',   description: 'Telugu + English'    },
  { value: 'kanglish',   label: 'Kanglish',   description: 'Kannada + English'   },
  { value: 'banglish',   label: 'Banglish',   description: 'Bengali + English'   },
  { value: 'punglish',   label: 'Punglish',   description: 'Punjabi + English'   },
  { value: 'minglish',   label: 'Minglish',   description: 'Marathi + English'   },
  { value: 'spanglish',  label: 'Spanglish',  description: 'Spanish + English'   },
  { value: 'franglais',  label: 'Franglais',  description: 'French + English'    },
  { value: 'chinglish',  label: 'Chinglish',  description: 'Chinese + English'   },
  { value: 'japanglish', label: 'Japanglish', description: 'Japanese + English'  },
  { value: 'arablish',   label: 'Arablish',   description: 'Arabic + English'    },
];

// Detect script to suggest a sensible default mode
export function detectNonLatinScript(lyrics: LyricLine[]): string | null {
  const sample = lyrics.slice(0, 5).map(l => l.text).join(' ');

  if (/[\u0900-\u097F]/.test(sample)) return 'Hindi';
  if (/[\u0980-\u09FF]/.test(sample)) return 'Bengali';
  if (/[\u0C00-\u0C7F]/.test(sample)) return 'Telugu';
  if (/[\u0B80-\u0BFF]/.test(sample)) return 'Tamil';
  if (/[\u0C80-\u0CFF]/.test(sample)) return 'Kannada';
  if (/[\u0D00-\u0D7F]/.test(sample)) return 'Malayalam';
  if (/[\u0A00-\u0A7F]/.test(sample)) return 'Punjabi';
  if (/[\u0600-\u06FF]/.test(sample)) return 'Arabic';
  if (/[\u3040-\u30FF\u4E00-\u9FFF]/.test(sample)) return 'Japanese';
  if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(sample)) return 'Korean';

  return null;
}

export async function translateLyrics(
  lyrics: LyricLine[],
  target: TranslateTarget
): Promise<LyricLine[]> {
  const instructions: Record<TranslateTarget, string> = {
    tanglish:   'Transliterate each Tamil lyric line into Roman script mixed naturally with English words (Tanglish style). Keep it conversational and singable.',
    manglish:   'Transliterate each Malayalam lyric line into Roman script mixed naturally with English words (Manglish style). Keep it conversational and singable.',
    hinglish:   'Transliterate each Hindi lyric line into Roman script mixed naturally with English words (Hinglish style). Keep it conversational and singable.',
    tenglish:   'Transliterate each Telugu lyric line into Roman script mixed naturally with English words (Tenglish style). Keep it conversational and singable.',
    kanglish:   'Transliterate each Kannada lyric line into Roman script mixed naturally with English words (Kanglish style). Keep it conversational and singable.',
    banglish:   'Transliterate each Bengali lyric line into Roman script mixed naturally with English words (Banglish style). Keep it conversational and singable.',
    punglish:   'Transliterate each Punjabi lyric line into Roman script mixed naturally with English words (Punglish style). Keep it conversational and singable.',
    minglish:   'Transliterate each Marathi lyric line into Roman script mixed naturally with English words (Minglish style). Keep it conversational and singable.',
    spanglish:  'Rewrite each lyric line in Spanglish — a natural mix of Spanish and English in Roman script. Keep the feel of the original.',
    franglais:  'Rewrite each lyric line in Franglais — a natural mix of French and English in Roman script. Keep the feel of the original.',
    chinglish:  'Transliterate each Chinese lyric line into Pinyin Roman script mixed naturally with English words (Chinglish style). Keep it conversational and singable.',
    japanglish: 'Transliterate each Japanese lyric line into Romaji mixed naturally with English words (Japanglish style). Keep it conversational and singable.',
    arablish:   'Transliterate each Arabic lyric line into Roman script mixed naturally with English words (Arablish style). Keep it conversational and singable.',
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
