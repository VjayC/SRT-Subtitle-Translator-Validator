import type { Subtitle } from './srtUtils';

export interface ScriptRange {
  name: string;
  start: number;
  end: number;
  removable?: boolean;
}

export interface ScriptError {
  index: number;
  line: string;
  invalidChar: string;
  unicode: string;
}

export interface SequenceError {
  position: number;
  currentIndex: number;
  previousIndex: number;
}

export interface TimestampMismatch {
  start: number;
  end: number;
  startIndex: number;
  endIndex: number;
}

// NOTE: Copy your full scriptRanges object from the original index.html here.
// I've included a truncated version for brevity.
export const scriptRanges: Record<string, Omit<ScriptRange, 'name'>> = {
  // Latin scripts
  'Basic Latin': { start: 0x0020, end: 0x007E },
  'Latin Supplement': { start: 0x00A0, end: 0x00FF },
  'Latin Extended-A': { start: 0x0100, end: 0x017F },
  'Latin Extended-B': { start: 0x0180, end: 0x024F },
  'Latin Extended Additional': { start: 0x1E00, end: 0x1EFF },
  'Latin Extended-C': { start: 0x2C60, end: 0x2C7F },
  'Latin Extended-D': { start: 0xA720, end: 0xA7FF },
  'Latin Extended-E': { start: 0xAB30, end: 0xAB6F },
  
  // Indian scripts
  'Devanagari (Hindi, Sanskrit, Marathi)': { start: 0x0900, end: 0x097F },
  'Bengali (Bangla)': { start: 0x0980, end: 0x09FF },
  'Gurmukhi (Punjabi)': { start: 0x0A00, end: 0x0A7F },
  'Gujarati': { start: 0x0A80, end: 0x0AFF },
  'Oriya (Odia)': { start: 0x0B00, end: 0x0B7F },
  'Tamil': { start: 0x0B80, end: 0x0BFF },
  'Telugu': { start: 0x0C00, end: 0x0C7F },
  'Kannada': { start: 0x0C80, end: 0x0CFF },
  'Malayalam': { start: 0x0D00, end: 0x0D7F },
  'Sinhala': { start: 0x0D80, end: 0x0DFF },
  
  // Southeast Asian scripts
  'Thai': { start: 0x0E00, end: 0x0E7F },
  'Lao': { start: 0x0E80, end: 0x0EFF },
  'Tibetan': { start: 0x0F00, end: 0x0FFF },
  'Burmese (Myanmar)': { start: 0x1000, end: 0x109F },
  'Khmer (Cambodian)': { start: 0x1780, end: 0x17FF },
  'Tagalog (Baybayin)': { start: 0x1700, end: 0x171F },
  'Balinese': { start: 0x1B00, end: 0x1B7F },
  'Sundanese': { start: 0x1B80, end: 0x1BBF },
  'Javanese': { start: 0xA980, end: 0xA9DF },
  
  // East Asian scripts
  'Chinese (CJK Unified Ideographs)': { start: 0x4E00, end: 0x9FFF },
  'Chinese (CJK Extension A)': { start: 0x3400, end: 0x4DBF },
  'Chinese (CJK Extension B)': { start: 0x20000, end: 0x2A6DF },
  'Chinese (CJK Extension C)': { start: 0x2A700, end: 0x2B73F },
  'Chinese (CJK Extension D)': { start: 0x2B740, end: 0x2B81F },
  'Chinese (CJK Extension E)': { start: 0x2B820, end: 0x2CEAF },
  'Chinese (CJK Compatibility)': { start: 0xF900, end: 0xFAFF },
  'Japanese Hiragana': { start: 0x3040, end: 0x309F },
  'Japanese Katakana': { start: 0x30A0, end: 0x30FF },
  'Japanese Katakana Phonetic': { start: 0x31F0, end: 0x31FF },
  'Korean Hangul Syllables': { start: 0xAC00, end: 0xD7AF },
  'Korean Hangul Jamo': { start: 0x1100, end: 0x11FF },
  'Korean Hangul Compatibility Jamo': { start: 0x3130, end: 0x318F },
  
  // Middle Eastern scripts
  'Arabic': { start: 0x0600, end: 0x06FF },
  'Arabic Supplement': { start: 0x0750, end: 0x077F },
  'Arabic Extended-A': { start: 0x08A0, end: 0x08FF },
  'Arabic Presentation Forms-A': { start: 0xFB50, end: 0xFDFF },
  'Arabic Presentation Forms-B': { start: 0xFE70, end: 0xFEFF },
  'Hebrew': { start: 0x0590, end: 0x05FF },
  'Syriac': { start: 0x0700, end: 0x074F },
  'Thaana (Maldivian)': { start: 0x0780, end: 0x07BF },
  'N\'Ko (West African)': { start: 0x07C0, end: 0x07FF },
  'Samaritan': { start: 0x0800, end: 0x083F },
  'Mandaic': { start: 0x0840, end: 0x085F },
  'Persian (Farsi)': { start: 0xFB50, end: 0xFDFF },
  'Urdu': { start: 0x0600, end: 0x06FF },
  
  // European scripts
  'Greek': { start: 0x0370, end: 0x03FF },
  'Greek Extended': { start: 0x1F00, end: 0x1FFF },
  'Cyrillic (Russian, Ukrainian, etc.)': { start: 0x0400, end: 0x04FF },
  'Cyrillic Supplement': { start: 0x0500, end: 0x052F },
  'Cyrillic Extended-A': { start: 0x2DE0, end: 0x2DFF },
  'Cyrillic Extended-B': { start: 0xA640, end: 0xA69F },
  'Cyrillic Extended-C': { start: 0x1C80, end: 0x1C8F },
  'Armenian': { start: 0x0530, end: 0x058F },
  'Georgian': { start: 0x10A0, end: 0x10FF },
  'Georgian Supplement': { start: 0x2D00, end: 0x2D2F },
  
  // African scripts
  'Ethiopic (Amharic, Tigrinya)': { start: 0x1200, end: 0x137F },
  'Ethiopic Supplement': { start: 0x1380, end: 0x139F },
  'Ethiopic Extended': { start: 0x2D80, end: 0x2DDF },
  'Tifinagh (Berber)': { start: 0x2D30, end: 0x2D7F },
  'Coptic': { start: 0x2C80, end: 0x2CFF },
  'Vai': { start: 0xA500, end: 0xA63F },
  'Bamum': { start: 0xA6A0, end: 0xA6FF },
  'Osmanya': { start: 0x10480, end: 0x104AF },
  
  // Native American scripts
  'Cherokee': { start: 0x13A0, end: 0x13FF },
  'Canadian Aboriginal Syllabics': { start: 0x1400, end: 0x167F },
  'Canadian Aboriginal Extended': { start: 0x18B0, end: 0x18FF },
  'Deseret': { start: 0x10400, end: 0x1044F },
  
  // Historical scripts
  'Phoenician': { start: 0x10900, end: 0x1091F },
  'Cuneiform': { start: 0x12000, end: 0x123FF },
  'Egyptian Hieroglyphs': { start: 0x13000, end: 0x1342F },
  'Anatolian Hieroglyphs': { start: 0x14400, end: 0x1467F },
  'Linear B Syllabary': { start: 0x10000, end: 0x1007F },
  'Linear B Ideograms': { start: 0x10080, end: 0x100FF },
  'Gothic': { start: 0x10330, end: 0x1034F },
  'Old Persian': { start: 0x103A0, end: 0x103DF },
  'Ugaritic': { start: 0x10380, end: 0x1039F },
  'Old Italic': { start: 0x10300, end: 0x1032F },
  'Runic': { start: 0x16A0, end: 0x16FF },
  'Ogham': { start: 0x1680, end: 0x169F },
  
  // Central/South Asian
  'Mongolian': { start: 0x1800, end: 0x18AF },
  'Phags-pa': { start: 0xA840, end: 0xA87F },
  'Limbu': { start: 0x1900, end: 0x194F },
  'Tai Le': { start: 0x1950, end: 0x197F },
  'New Tai Lue': { start: 0x1980, end: 0x19DF },
  'Tai Tham': { start: 0x1A20, end: 0x1AAF },
  'Tai Viet': { start: 0xAA80, end: 0xAADF },
  'Lepcha': { start: 0x1C00, end: 0x1C4F },
  'Ol Chiki': { start: 0x1C50, end: 0x1C7F },
  
  // Symbols and special
  'IPA Extensions': { start: 0x0250, end: 0x02AF },
  'Phonetic Extensions': { start: 0x1D00, end: 0x1D7F },
  'Phonetic Extensions Supplement': { start: 0x1D80, end: 0x1DBF },
  'General Punctuation': { start: 0x2000, end: 0x206F },
  'Currency Symbols': { start: 0x20A0, end: 0x20CF },
  'Mathematical Operators': { start: 0x2200, end: 0x22FF },
  'Box Drawing': { start: 0x2500, end: 0x257F },
  'Geometric Shapes': { start: 0x25A0, end: 0x25FF },
  'Miscellaneous Symbols': { start: 0x2600, end: 0x26FF },
  'Dingbats': { start: 0x2700, end: 0x27BF },
  'Emoticons': { start: 0x1F600, end: 0x1F64F },
  'Emoji (Supplemental Symbols)': { start: 0x1F300, end: 0x1F5FF },
};

export const parseScriptInput = (inputString: string): ScriptRange | null => {
  const value = inputString.trim();
  const scriptName = Object.keys(scriptRanges).find(key => key.toLowerCase() === value.toLowerCase());
  
  if (scriptName) {
    return { name: scriptName, start: scriptRanges[scriptName].start, end: scriptRanges[scriptName].end, removable: true };
  }

  const upperValue = value.toUpperCase();
  const MAX_UNICODE = 0x10FFFF; // The absolute maximum valid Unicode code point

  // Check for range patterns: U+XXXX-U+YYYY or XXXX-YYYY
  let match = upperValue.match(/^U\+([0-9A-F]+)-U\+([0-9A-F]+)$/) || upperValue.match(/^([0-9A-F]+)-([0-9A-F]+)$/);
  if (match) {
    const start = parseInt(match[1], 16);
    const end = parseInt(match[2], 16);
    if (!isNaN(start) && !isNaN(end) && start <= end && start <= MAX_UNICODE && end <= MAX_UNICODE) {
      return { name: `Custom Range U+${match[1]}-U+${match[2]}`, start, end, removable: true };
    }
  }

  // Check for single character patterns: U+XXXX or XXXX
  match = upperValue.match(/^U\+([0-9A-F]+)$/) || upperValue.match(/^([0-9A-F]+)$/);
  if (match) {
    const start = parseInt(match[1], 16);
    if (!isNaN(start) && start <= MAX_UNICODE) {
      return { name: `Custom Character U+${match[1]}`, start, end: start, removable: true };
    }
  }

  return null;
};

// Validates the translated text against allowed Unicode ranges
export const checkLanguageScript = (subtitles: Subtitle[], activeScripts: ScriptRange[]): ScriptError[] => {
  const errors: ScriptError[] = [];
  const isAllowedSpecial = (code: number) => [0x2018, 0x2019, 0x201C, 0x201D, 0x200C, 0x2014].includes(code);
  const isNewlineOrCR = (code: number) => code === 0x000A || code === 0x000D;

  for (const sub of subtitles) {
    for (let i = 0; i < sub.text.length; i++) {
      const char = sub.text[i];
      const code = char.charCodeAt(0);
      let isAllowed = isAllowedSpecial(code) || isNewlineOrCR(code);

      if (!isAllowed) {
        isAllowed = activeScripts.some(script => code >= script.start && code <= script.end);
      }

      if (!isAllowed) {
        errors.push({
          index: sub.index,
          line: sub.text.replace(/\n/g, ' '),
          invalidChar: char,
          unicode: `U+${code.toString(16).toUpperCase().padStart(4, '0')}`
        });
        break; // Only report the first error per subtitle block to avoid spam
      }
    }
  }
  return errors;
};

// Checks for strict index incrementation
export const checkIndexSequence = (subtitles: Subtitle[]): SequenceError[] => {
  const errors: SequenceError[] = [];
  for (let i = 1; i < subtitles.length; i++) {
    if (subtitles[i].index <= subtitles[i - 1].index) {
      errors.push({ position: i, currentIndex: subtitles[i].index, previousIndex: subtitles[i - 1].index });
    }
  }
  return errors;
};