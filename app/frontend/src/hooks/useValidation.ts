import { useMemo } from 'react';
import { checkLanguageScript, checkIndexSequence, parseScriptInput } from '../utils/validationUtils';
import type { Subtitle } from '../utils/srtUtils';
import type { ScriptRange, TimestampMismatch } from '../utils/validationUtils';

export const useValidation = (
  sourceSubtitles: Subtitle[], 
  translatedSubtitles: Subtitle[], 
  allowedScripts: string[]
) => {
  const isCountMismatch = sourceSubtitles.length !== translatedSubtitles.length;

  const sequenceErrors = useMemo(() => checkIndexSequence(translatedSubtitles), [translatedSubtitles]);

  const timestampMismatches = useMemo(() => {
    const mismatches: TimestampMismatch[] = [];
    let currentRange: TimestampMismatch | null = null;

    for (let i = 0; i < sourceSubtitles.length; i++) {
      if (!sourceSubtitles[i] || !translatedSubtitles[i] || sourceSubtitles[i].timecode !== translatedSubtitles[i].timecode) {
        if (!sourceSubtitles[i] || !translatedSubtitles[i]) continue;
        if (currentRange && currentRange.end === i - 1) {
          currentRange.end = i;
          currentRange.endIndex = sourceSubtitles[i].index;
        } else {
          if (currentRange) mismatches.push(currentRange);
          currentRange = { start: i, end: i, startIndex: sourceSubtitles[i].index, endIndex: sourceSubtitles[i].index };
        }
      } else {
        if (currentRange) {
          mismatches.push(currentRange);
          currentRange = null;
        }
      }
    }
    if (currentRange) mismatches.push(currentRange);
    return mismatches;
  }, [sourceSubtitles, translatedSubtitles]);

  const scriptErrors = useMemo(() => {
    const activeRanges: ScriptRange[] = allowedScripts
      .map(scriptName => parseScriptInput(scriptName))
      .filter((range): range is ScriptRange => range !== null);
    
    return checkLanguageScript(translatedSubtitles, activeRanges);
  }, [translatedSubtitles, allowedScripts]);

  const hasErrors = timestampMismatches.length > 0 || sequenceErrors.length > 0 || scriptErrors.length > 0;

  return { isCountMismatch, sequenceErrors, timestampMismatches, scriptErrors, hasErrors };
};