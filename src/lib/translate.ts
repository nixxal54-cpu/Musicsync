import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface LyricLine {
  time: number;
  text: string;
}

export type TranslateTarget =
  | 'hinglish'           // Hindi → Roman script
  | 'english'
  | 'spanish'
  | 'french'
  | 'arabic_roman'       // Arabic → Roman
  | 'tamil_roman'        // Tamil → Roman
  | 'japanese_roman'
  | 'korean_roman'
  // Indian languages (22 scheduled languages + major regional)
  | 'hindi'              // Translate to Hindi (Devanagari)
  | 'bengali'            // Bengali / Bangla
  | 'telugu'             // Telugu
  | 'marathi'            // Marathi
  | 'tamil'              // Tamil (native script)
  | 'gujarati'           // Gujarati
  | 'kannada'            // Kannada
  | 'malayalam'          // Malayalam
  | 'odia'               // Odia / Oriya
  | 'punjabi'            // Punjabi / Gurmukhi
  | 'assamese'           // Assamese
  | 'maithili'           // Maithili
  | 'sanskrit'           // Sanskrit
  | 'urdu'               // Urdu
  | 'kashmiri'           // Kashmiri
  | 'konkani'            // Konkani
  | 'manipuri'           // Manipuri / Meitei
  | 'nepali'             // Nepali
  | 'sindhi'             // Sindhi
  | 'bodo'               // Bodo
  | 'dogri'              // Dogri
  | 'santali'            // Santali
  // Romanized versions for non-Latin Indian scripts
  | 'bengali_roman'      // Bengali → Roman
  | 'telugu_roman'       // Telugu → Roman
  | 'kannada_roman'      // Kannada → Roman
  | 'malayalam_roman'    // Malayalam → Roman
  | 'gujarati_roman'     // Gujarati → Roman
  | 'punjabi_roman'      // Punjabi → Roman
  | 'odia_roman'         // Odia → Roman
  | 'marathi_roman';     // Marathi → Roman

export const TRANSLATE_OPTIONS: { value: TranslateTarget; label: string; description: string; group?: string }[] = [
  // Global languages
  { value: 'english',        label: 'English',              description: 'Translate to English',         group: 'Global' },
  { value: 'hindi',          label: 'Hindi',                description: 'Translate to Hindi',           group: 'Global' },
  { value: 'hinglish',       label: 'Hinglish',             description: 'Hindi → Roman script',         group: 'Global' },
  { value: 'spanish',        label: 'Spanish',              description: 'Translate to Spanish',         group: 'Global' },
  { value: 'french',         label: 'French',               description: 'Translate to French',          group: 'Global' },
  { value: 'arabic_roman',   label: 'Arabic Romanized',     description: 'Arabic → Roman script',        group: 'Global' },
  { value: 'japanese_roman', label: 'Romaji',               description: 'Japanese → Romaji',            group: 'Global' },
  { value: 'korean_roman',   label: 'Romanized Korean',     description: 'Korean → Roman script',        group: 'Global' },
  // Indian languages — native script
  { value: 'bengali',        label: 'Bengali',              description: 'Translate to Bengali',         group: 'Indian' },
  { value: 'telugu',         label: 'Telugu',               description: 'Translate to Telugu',          group: 'Indian' },
  { value: 'marathi',        label: 'Marathi',              description: 'Translate to Marathi',         group: 'Indian' },
  { value: 'tamil',          label: 'Tamil',                description: 'Translate to Tamil',           group: 'Indian' },
  { value: 'tamil_roman',    label: 'Tamil Romanized',      description: 'Tamil → Roman script',         group: 'Indian' },
  { value: 'gujarati',       label: 'Gujarati',             description: 'Translate to Gujarati',        group: 'Indian' },
  { value: 'kannada',        label: 'Kannada',              description: 'Translate to Kannada',         group: 'Indian' },
  { value: 'malayalam',      label: 'Malayalam',            description: 'Translate to Malayalam',       group: 'Indian' },
  { value: 'odia',           label: 'Odia',                 description: 'Translate to Odia',            group: 'Indian' },
  { value: 'punjabi',        label: 'Punjabi',              description: 'Translate to Punjabi',         group: 'Indian' },
  { value: 'assamese',       label: 'Assamese',             description: 'Translate to Assamese',        group: 'Indian' },
  { value: 'maithili',       label: 'Maithili',             description: 'Translate to Maithili',        group: 'Indian' },
  { value: 'urdu',           label: 'Urdu',                 description: 'Translate to Urdu',            group: 'Indian' },
  { value: 'sanskrit',       label: 'Sanskrit',             description: 'Translate to Sanskrit',        group: 'Indian' },
  { value: 'kashmiri',       label: 'Kashmiri',             description: 'Translate to Kashmiri',        group: 'Indian' },
  { value: 'konkani',        label: 'Konkani',              description: 'Translate to Konkani',         group: 'Indian' },
  { value: 'manipuri',       label: 'Manipuri',             description: 'Translate to Manipuri',        group: 'Indian' },
  { value: 'nepali',         label: 'Nepali',               description: 'Translate to Nepali',          group: 'Indian' },
  { value: 'sindhi',         label: 'Sindhi',               description: 'Translate to Sindhi',          group: 'Indian' },
  { value: 'bodo',           label: 'Bodo',                 description: 'Translate to Bodo',            group: 'Indian' },
  { value: 'dogri',          label: 'Dogri',                description: 'Translate to Dogri',           group: 'Indian' },
  { value: 'santali',        label: 'Santali',              description: 'Translate to Santali',         group: 'Indian' },
  // Indian languages — Romanized
  { value: 'bengali_roman',  label: 'Bengali Romanized',    description: 'Bengali → Roman script',       group: 'Indian Romanized' },
  { value: 'telugu_roman',   label: 'Telugu Romanized',     description: 'Telugu → Roman script',        group: 'Indian Romanized' },
  { value: 'kannada_roman',  label: 'Kannada Romanized',    description: 'Kannada → Roman script',       group: 'Indian Romanized' },
  { value: 'malayalam_roman',label: 'Malayalam Romanized',  description: 'Malayalam → Roman script',     group: 'Indian Romanized' },
  { value: 'gujarati_roman', label: 'Gujarati Romanized',   description: 'Gujarati → Roman script',      group: 'Indian Romanized' },
  { value: 'punjabi_roman',  label: 'Punjabi Romanized',    description: 'Punjabi → Roman script',       group: 'Indian Romanized' },
  { value: 'odia_roman',     label: 'Odia Romanized',       description: 'Odia → Roman script',          group: 'Indian Romanized' },
  { value: 'marathi_roman',  label: 'Marathi Romanized',    description: 'Marathi → Roman script',       group: 'Indian Romanized' },
];

// Detect if lyrics are in a non-Latin script (Hindi, Tamil, Arabic, Japanese, Korean, etc.)
export function detectNonLatinScript(lyrics: LyricLine[]): string | null {
  const sample = lyrics.slice(0, 5).map(l => l.text).join(' ');

  // Indian scripts
  if (/[\u0900-\u097F]/.test(sample)) return 'Hindi';       // Devanagari (Hindi, Marathi, Sanskrit, Nepali, Maithili, Konkani, Bodo, Dogri)
  if (/[\u0980-\u09FF]/.test(sample)) return 'Bengali';     // Bengali / Assamese
  if (/[\u0C00-\u0C7F]/.test(sample)) return 'Telugu';      // Telugu
  if (/[\u0B80-\u0BFF]/.test(sample)) return 'Tamil';       // Tamil
  if (/[\u0C80-\u0CFF]/.test(sample)) return 'Kannada';     // Kannada
  if (/[\u0D00-\u0D7F]/.test(sample)) return 'Malayalam';   // Malayalam
  if (/[\u0A80-\u0AFF]/.test(sample)) return 'Gujarati';    // Gujarati
  if (/[\u0B00-\u0B7F]/.test(sample)) return 'Odia';        // Odia
  if (/[\u0A00-\u0A7F]/.test(sample)) return 'Punjabi';     // Gurmukhi (Punjabi)
  if (/[\u1C50-\u1C7F]/.test(sample)) return 'Santali';     // Ol Chiki (Santali)
  if (/[\uABC0-\uABFF]/.test(sample)) return 'Manipuri';    // Meetei Mayek (Manipuri)
  // Other world scripts
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
    // Global
    hinglish:         'Transliterate each Hindi lyric line into Roman script (Hinglish). Keep the pronunciation feel, do not translate the meaning.',
    english:          'Translate each lyric line into natural English.',
    spanish:          'Translate each lyric line into natural Spanish.',
    french:           'Translate each lyric line into natural French.',
    arabic_roman:     'Transliterate each Arabic lyric line into Roman/Latin script. Preserve pronunciation.',
    tamil_roman:      'Transliterate each Tamil lyric line into Roman script. Preserve pronunciation.',
    japanese_roman:   'Convert each Japanese lyric line into standard Romaji. Preserve pronunciation.',
    korean_roman:     'Romanize each Korean lyric line using standard Romanization. Preserve pronunciation.',
    // Indian — native script translations
    hindi:            'Translate each lyric line into natural Hindi written in Devanagari script.',
    bengali:          'Translate each lyric line into natural Bengali written in Bengali script.',
    telugu:           'Translate each lyric line into natural Telugu written in Telugu script.',
    marathi:          'Translate each lyric line into natural Marathi written in Devanagari script.',
    tamil:            'Translate each lyric line into natural Tamil written in Tamil script.',
    gujarati:         'Translate each lyric line into natural Gujarati written in Gujarati script.',
    kannada:          'Translate each lyric line into natural Kannada written in Kannada script.',
    malayalam:        'Translate each lyric line into natural Malayalam written in Malayalam script.',
    odia:             'Translate each lyric line into natural Odia written in Odia script.',
    punjabi:          'Translate each lyric line into natural Punjabi written in Gurmukhi script.',
    assamese:         'Translate each lyric line into natural Assamese written in Assamese/Bengali script.',
    maithili:         'Translate each lyric line into natural Maithili written in Devanagari script.',
    sanskrit:         'Translate each lyric line into Sanskrit written in Devanagari script.',
    urdu:             'Translate each lyric line into natural Urdu written in Nastaliq/Arabic script.',
    kashmiri:         'Translate each lyric line into natural Kashmiri written in Perso-Arabic script.',
    konkani:          'Translate each lyric line into natural Konkani written in Devanagari script.',
    manipuri:         'Translate each lyric line into natural Manipuri (Meitei) written in Meetei Mayek script.',
    nepali:           'Translate each lyric line into natural Nepali written in Devanagari script.',
    sindhi:           'Translate each lyric line into natural Sindhi written in Perso-Arabic script.',
    bodo:             'Translate each lyric line into natural Bodo written in Devanagari script.',
    dogri:            'Translate each lyric line into natural Dogri written in Devanagari script.',
    santali:          'Translate each lyric line into natural Santali written in Ol Chiki script.',
    // Indian — Romanized transliterations
    bengali_roman:    'Transliterate each Bengali lyric line into Roman script. Preserve pronunciation faithfully.',
    telugu_roman:     'Transliterate each Telugu lyric line into Roman script. Preserve pronunciation faithfully.',
    kannada_roman:    'Transliterate each Kannada lyric line into Roman script. Preserve pronunciation faithfully.',
    malayalam_roman:  'Transliterate each Malayalam lyric line into Roman script. Preserve pronunciation faithfully.',
    gujarati_roman:   'Transliterate each Gujarati lyric line into Roman script. Preserve pronunciation faithfully.',
    punjabi_roman:    'Transliterate each Punjabi (Gurmukhi) lyric line into Roman script. Preserve pronunciation faithfully.',
    odia_roman:       'Transliterate each Odia lyric line into Roman script. Preserve pronunciation faithfully.',
    marathi_roman:    'Transliterate each Marathi lyric line into Roman script (similar to Hinglish style). Preserve pronunciation faithfully.',
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
