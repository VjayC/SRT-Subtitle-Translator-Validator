export interface Subtitle {
  index: number;
  timecode?: string;
  text: string;
}

// Faithfully ported from the original index.html
export const parseSRT = (content: string): Subtitle[] => {
  const subtitles: Subtitle[] = [];
  if (!content) return subtitles;
  
  const blocks = content.trim().split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 2) continue;

    const indexLine = lines[0];
    const timecodeLine = lines.length > 1 ? lines[1] : '';
    const textLines = lines.slice(2);

    const index = parseInt(indexLine);

    if (!isNaN(index) && timecodeLine.includes('-->')) {
      subtitles.push({
        index,
        timecode: timecodeLine.trim(),
        text: textLines.join('\n')
      });
    }
  }
  return subtitles;
};

// Parses LLM output which often omits timestamps to save tokens
export const parseSimplifiedSRT = (content: string): Subtitle[] => {
  const subtitles: Subtitle[] = [];
  if (!content) return subtitles;
  
  const blocks = content.trim().split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 1) continue;

    const index = parseInt(lines[0]);
    const textLines = lines.slice(1);

    if (!isNaN(index)) {
      subtitles.push({
        index,
        text: textLines.join('\n')
      });
    }
  }
  return subtitles;
};

// Utility to convert the Subtitle array back into a downloadable string
export const stringifySRT = (subtitles: Subtitle[]): string => {
  return subtitles
    .map(sub => `${sub.index}\n${sub.timecode || ''}\n${sub.text}`.trim())
    .join('\n\n');
};