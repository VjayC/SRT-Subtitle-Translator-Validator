import { AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import type { Subtitle } from '../utils/srtUtils';
import type { SequenceError, TimestampMismatch, ScriptError } from '../utils/validationUtils';

interface ValidationDashboardProps {
  sourceSubtitles: Subtitle[];
  translatedSubtitles: Subtitle[];
  validation: {
    isCountMismatch: boolean;
    sequenceErrors: SequenceError[];
    timestampMismatches: TimestampMismatch[];
    scriptErrors: ScriptError[];
    hasErrors: boolean;
  };
}

export const ValidationDashboard = ({ sourceSubtitles, translatedSubtitles, validation }: ValidationDashboardProps) => {
  const { isCountMismatch, sequenceErrors, timestampMismatches, scriptErrors, hasErrors } = validation;

  const mismatchCount = timestampMismatches.reduce((acc, range) => acc + (range.end - range.start + 1), 0);

  if (isCountMismatch) {
    return (
      <div className="mt-6 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
        <h3 className="text-lg font-bold text-red-700 dark:text-red-400 flex items-center gap-2 mb-2">
          <XCircle size={20} /> Critical Error: Subtitle count mismatch!
        </h3>
        <p className="text-sm text-red-600 dark:text-red-300">Retranslation is recommended.</p>
        <div className="mt-4 p-4 bg-white/50 dark:bg-black/20 rounded-lg text-sm text-red-800 dark:text-red-200 font-mono">
          <p>Source: {sourceSubtitles.length} subtitles</p>
          <p>Translated: {translatedSubtitles.length} subtitles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 p-6 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] rounded-xl shadow-sm">

      {/* Dashboard Header */}
      <div className="flex items-center gap-2 mb-6">
        {hasErrors ? (
          <AlertTriangle className="text-yellow-500" size={24} />
        ) : (
          <CheckCircle className="text-green-500" size={24} />
        )}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {hasErrors ? 'Validation Results: Issues Detected' : 'Validation Results: Perfect Sync!'}
        </h3>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6 border-b border-gray-200 dark:border-[#1a1a1a] pb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#667eea]">{sourceSubtitles.length}</div>
          <div className="text-xs text-gray-500 mt-1">Total Subtitles</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${mismatchCount > 0 ? 'text-red-500' : 'text-[#667eea]'}`}>{mismatchCount}</div>
          <div className="text-xs text-gray-500 mt-1">Timestamp Errors</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${scriptErrors.length > 0 ? 'text-yellow-500' : 'text-[#667eea]'}`}>{scriptErrors.length}</div>
          <div className="text-xs text-gray-500 mt-1">Script Errors</div>
        </div>
      </div>

      {/* Error Lists */}
      <div className="space-y-4">

        {/* Index Sequence Errors */}
        {sequenceErrors.length > 0 && (
          <div className="p-4 bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 rounded-r-lg">
            <p className="text-sm font-semibold text-red-800 dark:text-red-400 mb-1">Index Sequence Errors</p>
            <p className="text-xs text-red-500 dark:text-red-400 mb-3">
              Subtitle indices must be strictly increasing. Manual review or retranslation is recommended.
            </p>
            {sequenceErrors.map((err, idx) => (
              <p key={idx} className="text-xs font-mono text-red-600 dark:text-red-300 mb-1">
                After index {err.previousIndex}, next is {err.currentIndex} (expected {err.previousIndex + 1})
              </p>
            ))}
          </div>
        )}

        {/* Timestamp Mismatches — with aligned timecode detail */}
        {timestampMismatches.length > 0 && (
          <div className="p-4 bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 rounded-r-lg">
            <p className="text-sm font-semibold text-red-800 dark:text-red-400 mb-3">
              Timestamp Mismatches ({mismatchCount} subtitle{mismatchCount !== 1 ? 's' : ''} affected)
            </p>
            <div className="space-y-3">
              {timestampMismatches.map((range, idx) => {
                if (range.start === range.end) {
                  const srcSub = sourceSubtitles[range.start];
                  const trnSub = translatedSubtitles[range.start];
                  return (
                    <div key={idx} className="bg-white/60 dark:bg-black/20 rounded-lg p-3 text-xs font-mono flex flex-col gap-1">
                      <p className="font-semibold text-red-700 dark:text-red-300 mb-1">
                        Subtitle #{range.startIndex}
                      </p>
                      <div className="flex">
                        <span className="text-green-700 dark:text-green-400 font-semibold w-24 shrink-0">Source:</span>
                        <span className="text-gray-600 dark:text-gray-400">{srcSub?.timecode ?? '—'}</span>
                      </div>
                      <div className="flex">
                        <span className="text-red-600 dark:text-red-400 font-semibold w-24 shrink-0">Translated:</span>
                        <span className="text-gray-600 dark:text-gray-400">{trnSub?.timecode ?? '—'}</span>
                      </div>
                    </div>
                  );
                }
                // For ranges show first and last timecodes aligned
                const firstSrc = sourceSubtitles[range.start];
                const lastSrc = sourceSubtitles[range.end];
                const firstTrn = translatedSubtitles[range.start];
                const lastTrn = translatedSubtitles[range.end];
                return (
                  <div key={idx} className="bg-white/60 dark:bg-black/20 rounded-lg p-3 text-xs font-mono">
                    <p className="font-semibold text-red-700 dark:text-red-300 mb-2">
                      Subtitles #{range.startIndex}–#{range.endIndex}{' '}
                      <span className="font-normal text-red-500">({range.end - range.start + 1} affected)</span>
                    </p>
                    {firstSrc && (
                      <>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex">
                            <span className="text-green-700 dark:text-green-400 font-semibold w-36 shrink-0">Source first:</span>
                            <span className="text-gray-500 dark:text-gray-400">{firstSrc.timecode}</span>
                          </div>
                          <div className="flex">
                            <span className="text-red-600 dark:text-red-400 font-semibold w-36 shrink-0">Translated first:</span>
                            <span className="text-gray-500 dark:text-gray-400">{firstTrn?.timecode ?? '—'}</span>
                          </div>
                        </div>
                        {range.end !== range.start && (
                          <div className="flex flex-col gap-0.5 mt-2">
                            <div className="flex">
                              <span className="text-green-700 dark:text-green-400 font-semibold w-36 shrink-0">Source last:</span>
                              <span className="text-gray-500 dark:text-gray-400">{lastSrc?.timecode ?? '—'}</span>
                            </div>
                            <div className="flex">
                              <span className="text-red-600 dark:text-red-400 font-semibold w-36 shrink-0">Translated last:</span>
                              <span className="text-gray-500 dark:text-gray-400">{lastTrn?.timecode ?? '—'}</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Script Errors — with highlighted invalid char in the line text */}
        {scriptErrors.length > 0 && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500 rounded-r-lg">
            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-400 mb-3">
              Foreign Script Detected ({scriptErrors.length} subtitle{scriptErrors.length !== 1 ? 's' : ''})
            </p>
            <div className="space-y-3">
              {scriptErrors.map((err, idx) => (
                <div key={idx} className="bg-white/60 dark:bg-black/20 rounded-lg p-3 text-xs font-mono">
                  <p className="font-semibold text-yellow-700 dark:text-yellow-300 mb-1.5">
                    Subtitle #{err.index}:{' '}
                    <span className="text-red-600 dark:text-red-400">
                      Invalid &apos;{err.invalidChar}&apos; ({err.unicode})
                    </span>
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 break-all leading-relaxed">
                    Line: &quot;
                    {err.line.split(err.invalidChar).map((part, i, arr) => (
                      <span key={i}>
                        {part}
                        {i < arr.length - 1 && (
                          <span className="bg-red-200 dark:bg-red-900/60 text-red-800 dark:text-red-200 font-bold px-0 rounded">
                            {err.invalidChar}
                          </span>
                        )}
                      </span>
                    ))}
                    &quot;
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};