import { useState, useEffect } from 'react';
import { parseSRT } from '../utils/srtUtils';
import type { Subtitle } from '../utils/srtUtils';

interface UseSRTParserResult {
  rawContent: string | null;
  parsedSubtitles: Subtitle[];
  fileName: string;
  isParsing: boolean;
  error: string | null;
}

export const useSRTParser = (file: File | null): UseSRTParserResult => {
  const [rawContent, setRawContent] = useState<string | null>(null);
  const [parsedSubtitles, setParsedSubtitles] = useState<Subtitle[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setRawContent(null);
      setParsedSubtitles([]);
      setFileName('');
      setError(null);
      return;
    }

    setIsParsing(true);
    setError(null);

    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = parseSRT(content); //
        
        setRawContent(content);
        setParsedSubtitles(parsed);
        setFileName(file.name.replace(/\.srt$/i, ''));
      } catch (err: any) {
        setError(err.message || 'Failed to parse SRT file.');
      } finally {
        setIsParsing(false);
      }
    };

    reader.onerror = () => {
      setError('Failed to read the file.');
      setIsParsing(false);
    };

    reader.readAsText(file);
  }, [file]);

  return { rawContent, parsedSubtitles, fileName, isParsing, error };
};