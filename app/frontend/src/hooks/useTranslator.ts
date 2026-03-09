import { useState, useContext } from 'react';
import { SettingsContext } from '../context/SettingsContext';
import { parseSimplifiedSRT } from '../utils/srtUtils';
import type { Subtitle } from '../utils/srtUtils';
import type { SavedTemplate } from '../context/TemplateContext';

interface UseTranslatorResult {
  isTranslating: boolean;
  loadingMessage: string | null;
  translatedSubtitles: Subtitle[];
  translationLanguage: string;
  translationCode: string;
  isPartialTranslation: boolean;
  hasRawOutput: boolean;
  error: string | null;
  translate: (
    sourceSubtitles: Subtitle[],
    finalPromptText: string,
    template: SavedTemplate
  ) => Promise<void>;
  continueTranslation: (
    sourceSubtitles: Subtitle[],
    finalPromptText: string,
    template: SavedTemplate
  ) => Promise<void>;
  resetTranslation: () => void;
  setTranslatedSubtitles: React.Dispatch<React.SetStateAction<Subtitle[]>>;
  downloadRawOutput: () => void;
  fixErrors: (
    sourceSubtitles: Subtitle[],
    currentTranslated: Subtitle[],
    timestampMismatches: any[],
    scriptErrors: any[],
    template: SavedTemplate,
    finalPromptText: string,
    validateMode?: boolean
  ) => Promise<Subtitle[] | undefined>;
}

export const useTranslator = (): UseTranslatorResult => {
  const settingsContext = useContext(SettingsContext);
  if (!settingsContext) throw new Error('useTranslator must be used within SettingsProvider');

  const { settings } = settingsContext;

  const [isTranslating, setIsTranslating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [translatedSubtitles, setTranslatedSubtitles] = useState<Subtitle[]>([]);
  const [translationLanguage, setTranslationLanguage] = useState('');
  const [translationCode, setTranslationCode] = useState('');
  const [isPartialTranslation, setIsPartialTranslation] = useState(false);
  const [rawOutputLog, setRawOutputLog] = useState('');
  const [error, setError] = useState<string | null>(null);

  const logRawOutput = (text: string) => {
    setRawOutputLog(prev => prev ? prev + '\n\n---\n\n' + text : text);
  };

  const resetTranslation = () => {
    setTranslatedSubtitles([]);
    setTranslationLanguage('');
    setTranslationCode('');
    setIsPartialTranslation(false);
    setRawOutputLog('');
    setError(null);
    setLoadingMessage(null);
  };

  // Shared helper: detect language from prompt using lite model
  const detectLanguage = async (
    promptText: string,
    apiEndpoint: string,
    apiKey: string,
    liteModel: string
  ): Promise<{ language: string; code: string }> => {
    
    // We intentionally do NOT use a try...catch here. 
    // If the API is offline, fetch() will throw a network error which will 
    // bubble up to the main translate() catch block, preventing the state 
    // from being incorrectly set to the fallback.
    const resp = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: liteModel,
        messages: [
          {
            role: 'user',
            content: `Given this prompt [${promptText}], identify the translation target language or the target code-mixed/code-switched vernacular (e.g., Tenglish, Hinglish). Only output the result in the format "Language Name|Code". If an exact ISO-639-2/B code does not exist for the vernacular, use the code for the dominant or most similar root language (e.g., for Spanglish use the code for Spanish), otherwise only output the Language Name.`,
          },
        ],
      }),
    });

    if (resp.ok) {
      const data = await resp.json();
      const raw = data.choices[0].message.content.trim().replace(/['"]/g, '');
      if (raw.includes('|')) {
        const parts = raw.split('|');
        return { language: parts[0].trim(), code: parts[1].trim() };
      }
      return { language: raw, code: '' };
    }
    
    // If the API is online but returns a 4xx/5xx error (e.g., safety block on the prompt),
    // we gracefully fall back to 'Translated' just like index.html
    return { language: 'Translated', code: '' };
  };

  // Shared helper: align simplified (no-timecode) LLM output back to source timestamps
  const alignToSource = (
    parsedSimplified: Subtitle[],
    sourceSubtitles: Subtitle[],
    startFromIndex?: number
  ): Subtitle[] => {
    const result: Subtitle[] = [];
    for (const simpleSub of parsedSimplified) {
      if (startFromIndex !== undefined && simpleSub.index < startFromIndex) continue;
      const sourceSub = sourceSubtitles.find(s => s.index === simpleSub.index);
      if (sourceSub) {
        result.push({
          index: simpleSub.index,
          timecode: sourceSub.timecode,
          text: simpleSub.text,
        });
      }
    }
    return result;
  };

  const translate = async (
    sourceSubtitles: Subtitle[],
    finalPromptText: string,
    template: SavedTemplate
  ) => {
    setIsTranslating(true);
    setError(null);
    setIsPartialTranslation(false);

    const apiEndpoint = template.endpointUrl || settings.apiEndpoint;
    const mainModel = template.mainModel || settings.mainModel;
    const liteModel = template.liteModel || settings.liteModel;
    const apiKey = settings.apiKey || 'dummy';

    try {
      // Language detection (only on first translate, not on re-translate)
      if (!translationLanguage) {
        setLoadingMessage(`Detecting translation language with ${liteModel}...`);
        const detected = await detectLanguage(finalPromptText, apiEndpoint, apiKey, liteModel);
        setTranslationLanguage(detected.language);
        setTranslationCode(detected.code);
      }

      setLoadingMessage(`Translating with ${mainModel} — this may take a few minutes...`);

      const promptPayload =
        finalPromptText +
        `\n\nIMPORTANT: Output ONLY the Index and the Translated Text. Do NOT output timestamps.\nFormat example:\n${sourceSubtitles[0]?.index}\nTranslated Text Here\n\n${sourceSubtitles[0]?.index + 1}\nNext Line Here\n\n` +
        sourceSubtitles.map(sub => `${sub.index}\n${sub.text}`).join('\n\n');

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: mainModel,
          messages: [{ role: 'user', content: promptPayload }],
          stream: false,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        const errorMsg = data.error?.message || `${response.status} ${response.statusText}`;
        throw new Error(`API Error: ${errorMsg}`);
      }

      if (!data.choices || data.choices.length === 0) {
        throw new Error("The API returned an empty response. This usually means safety filters blocked the source content.");
      }

      let rawResponse = data.choices[0].message.content;

      if (!rawResponse) {
        const finishReason = data.choices[0].finish_reason || "Unknown";
        throw new Error(`The model blocked the response (likely safety filters). Finish Reason: ${finishReason}`);
      }

      logRawOutput(rawResponse);

      const codeBlockMatch = rawResponse.match(/```(?:srt)?\n([\s\S]*?)\n```/);
      if (codeBlockMatch) rawResponse = codeBlockMatch[1];

      const parsedSimplified = parseSimplifiedSRT(rawResponse);
      const aligned = alignToSource(parsedSimplified, sourceSubtitles);

      if (aligned.length === 0) {
        throw new Error('No subtitles were translated. Please try again.');
      }

      // Partial translation detection: if last translated index < last source index
      const lastTranslatedIdx = aligned[aligned.length - 1].index;
      const lastSourceIdx = sourceSubtitles[sourceSubtitles.length - 1].index;

      if (lastTranslatedIdx < lastSourceIdx) {
        // Remove the last entry as it may be incomplete
        aligned.pop();
        setIsPartialTranslation(true);
        setTranslatedSubtitles(aligned);
      } else {
        setIsPartialTranslation(false);
        setTranslatedSubtitles(aligned);
      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred during translation.');
    } finally {
      setIsTranslating(false);
    }
  };

  const continueTranslation = async (
    sourceSubtitles: Subtitle[],
    finalPromptText: string,
    template: SavedTemplate
  ) => {
    setIsTranslating(true);
    setError(null);

    const apiEndpoint = template.endpointUrl || settings.apiEndpoint;
    const mainModel = template.mainModel || settings.mainModel;
    const apiKey = settings.apiKey || 'dummy';

    try {
      setLoadingMessage(`Translating with ${mainModel} — this may take a few minutes...`);

      // Resume from the index after the last successfully translated subtitle
      const nextIndex =
        translatedSubtitles.length > 0
          ? translatedSubtitles[translatedSubtitles.length - 1].index + 1
          : sourceSubtitles[0]?.index;

      const promptPayload =
        `Begin from index ${nextIndex}\n` +
        finalPromptText +
        `\n\nIMPORTANT: Output ONLY the Index and the Translated Text. Do NOT output timestamps.\nFormat example:\n${nextIndex}\nTranslated Text Here\n\n${nextIndex + 1}\nNext Line Here\n\n` +
        sourceSubtitles.map(sub => `${sub.index}\n${sub.text}`).join('\n\n');

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: mainModel,
          messages: [{ role: 'user', content: promptPayload }],
          stream: false,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        const errorMsg = data.error?.message || `${response.status} ${response.statusText}`;
        throw new Error(`API Error: ${errorMsg}`);
      }

      if (!data.choices || data.choices.length === 0) {
        throw new Error("The API returned an empty response. This usually means safety filters blocked the source content.");
      }

      let continuedSRT = data.choices[0].message.content;

      if (!continuedSRT) {
        const finishReason = data.choices[0].finish_reason || "Unknown";
        throw new Error(`The model blocked the response (likely safety filters). Finish Reason: ${finishReason}`);
      }

      logRawOutput(continuedSRT);

      const codeBlockMatch = continuedSRT.match(/```(?:srt)?\n([\s\S]*?)\n```/);
      if (codeBlockMatch) continuedSRT = codeBlockMatch[1];

      const parsedSimplified = parseSimplifiedSRT(continuedSRT);
      const newChunk = alignToSource(parsedSimplified, sourceSubtitles, nextIndex);

      const combined = [...translatedSubtitles, ...newChunk];
      const lastTranslatedIdx = combined[combined.length - 1]?.index ?? 0;
      const lastSourceIdx = sourceSubtitles[sourceSubtitles.length - 1].index;

      if (lastTranslatedIdx < lastSourceIdx) {
        combined.pop();
        setIsPartialTranslation(true);
        setTranslatedSubtitles(combined);
      } else {
        setIsPartialTranslation(false);
        setTranslatedSubtitles(combined);
      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred while continuing translation.');
    } finally {
      setIsTranslating(false);
    }
  };

  const fixErrors = async (
    sourceSubtitles: Subtitle[],
    currentTranslated: Subtitle[],
    timestampMismatches: any[],
    scriptErrors: any[],
    template: SavedTemplate,
    finalPromptText: string,
    validateMode?: boolean
  ): Promise<Subtitle[] | undefined> => {
    setIsTranslating(true);
    setError(null);

    try {
      let fixedSubtitles = JSON.parse(JSON.stringify(currentTranslated)) as Subtitle[];

      // 1. Fix Timestamps Locally
      if (timestampMismatches.length > 0) {
        for (const range of timestampMismatches) {
          for (let i = range.start; i <= range.end; i++) {
            if (fixedSubtitles[i] && sourceSubtitles[i]) {
              fixedSubtitles[i].timecode = sourceSubtitles[i].timecode;
            }
          }
        }
      }

      // 2. Fix Script Errors via LLM
      if (scriptErrors.length > 0) {
        const errorIndices = [...new Set(scriptErrors.map((err: any) => err.index))];

        const subsetParsedSource = sourceSubtitles
          .filter(sub => errorIndices.includes(sub.index))
          .map(sub => `${sub.index}\n${sub.text}`)
          .join('\n\n');

        const subsetParsedTranslated = fixedSubtitles
          .filter(sub => errorIndices.includes(sub.index))
          .map(sub => {
            const err = scriptErrors.find((e: any) => e.index === sub.index);
            const errMsg = err ? ` [Error: Invalid char '${err.invalidChar}']` : '';
            return `${sub.index}${errMsg}\n${sub.text}`;
          })
          .join('\n\n');

        const apiEndpoint = template.endpointUrl || settings.apiEndpoint;
        const mainModel = template.mainModel || settings.mainModel;
        const apiKey = settings.apiKey || 'dummy';

        setLoadingMessage(`Fixing foreign script errors with ${mainModel}...`);

        const promptPayload = `Given this prompt [${finalPromptText}] and subset of the input SRT [${subsetParsedSource}] fix only these subtitles [${subsetParsedTranslated}]`;

        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: mainModel,
            messages: [{ role: 'user', content: promptPayload }],
            stream: false,
          }),
        });

        const data = await response.json();

        if (!response.ok || data.error) {
          const errorMsg = data.error?.message || `${response.status} ${response.statusText}`;
          throw new Error(`API Error: ${errorMsg}`);
        }

        if (!data.choices || data.choices.length === 0) {
          throw new Error("The API returned an empty response. This usually means safety filters blocked the source content.");
        }

        let fixedSRT = data.choices[0].message.content;

        if (!fixedSRT) {
          const finishReason = data.choices[0].finish_reason || "Unknown";
          throw new Error(`The model blocked the response (likely safety filters). Finish Reason: ${finishReason}`);
        }

        logRawOutput(fixedSRT);

        const codeBlockMatch = fixedSRT.match(/```(?:srt)?\n([\s\S]*?)\n```/);
        if (codeBlockMatch) fixedSRT = codeBlockMatch[1];

        const fixedParsed = parseSimplifiedSRT(fixedSRT);

        for (const fixedSub of fixedParsed) {
          const idx = fixedSubtitles.findIndex(sub => sub.index === fixedSub.index);
          if (idx !== -1) {
            fixedSubtitles[idx].text = fixedSub.text;
          }
        }
      }

      // Only update global translated state when not in validate mode
      if (!validateMode) {
        setTranslatedSubtitles(fixedSubtitles);
      }
      return fixedSubtitles;
    } catch (err: any) {
      setError(err.message || 'Failed to fix errors.');
      return undefined;
    } finally {
      setIsTranslating(false);
    }
  };

  const downloadRawOutput = () => {
    if (!rawOutputLog) {
      alert('No raw output to download!');
      return;
    }
    const blob = new Blob([rawOutputLog], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'raw_output.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    isTranslating,
    loadingMessage,
    translatedSubtitles,
    translationLanguage,
    translationCode,
    isPartialTranslation,
    hasRawOutput: rawOutputLog.length > 0,
    error,
    translate,
    continueTranslation,
    resetTranslation,
    setTranslatedSubtitles,
    downloadRawOutput,
    fixErrors,
  };
};