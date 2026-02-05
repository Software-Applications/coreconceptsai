import { useMemo } from 'react';

// ============================================================================
// Types
// ============================================================================
export interface WordTiming {
  word: string;
  paragraphIndex: number;
  wordIndexInParagraph: number;
  startTimeMs: number;
  endTimeMs: number;
}

// ============================================================================
// Constants
// ============================================================================
// Average characters per second at 1x playback speed (Google TTS is ~14 cps)
const AVG_CHARS_PER_SECOND = 14;

// Pause marker regex - matches [PAUSE: 3 Seconds], [PAUSE: 5s], etc.
const PAUSE_MARKER_REGEX = /\[PAUSE:\s*(\d+)\s*(?:Seconds?|s)\]/gi;

// Regex to find all words and pause markers in order
const TOKEN_REGEX = /\[PAUSE:\s*\d+\s*(?:Seconds?|s)\]|[^\s\[\]]+/gi;

// ============================================================================
// Helper: Parse raw transcript to extract timing information
// ============================================================================
function parseTranscriptWithPauses(rawTranscript: string): { 
  totalDurationEstimateMs: number;
  wordTimings: WordTiming[];
} {
  if (!rawTranscript) {
    return { totalDurationEstimateMs: 0, wordTimings: [] };
  }

  // Strip transcript tags but keep pause markers for now
  let transcript = rawTranscript
    .replace(/<\/?transcript>/gi, '')
    .replace(/\[(?:PROMPT|NOTE|DIRECTION)[^\]]*\]/gi, ''); // Keep PAUSE markers

  // Normalize newlines: single newlines become spaces, double become paragraph breaks
  transcript = transcript
    .replace(/\n\n+/g, '\u0000')
    .replace(/\n/g, ' ')
    .replace(/\u0000/g, '\n\n')
    .replace(/ {2,}/g, ' ')
    .trim();

  // Split into paragraphs
  const paragraphs = transcript.split(/\n\n+/).filter(p => p.trim());

  const wordTimings: WordTiming[] = [];
  let cumulativeTimeMs = 0;

  for (let pIndex = 0; pIndex < paragraphs.length; pIndex++) {
    const paragraph = paragraphs[pIndex];
    const tokens = paragraph.match(TOKEN_REGEX) || [];
    
    let wordIndexInParagraph = 0;

    for (const token of tokens) {
      // Check if this token is a pause marker
      const pauseMatch = token.match(/\[PAUSE:\s*(\d+)\s*(?:Seconds?|s)\]/i);
      
      if (pauseMatch) {
        // Add pause duration to cumulative time
        const pauseSeconds = parseInt(pauseMatch[1], 10);
        cumulativeTimeMs += pauseSeconds * 1000;
      } else {
        // This is a regular word
        const wordDurationMs = (token.length / AVG_CHARS_PER_SECOND) * 1000;
        
        wordTimings.push({
          word: token,
          paragraphIndex: pIndex,
          wordIndexInParagraph,
          startTimeMs: cumulativeTimeMs,
          endTimeMs: cumulativeTimeMs + wordDurationMs,
        });
        
        cumulativeTimeMs += wordDurationMs;
        wordIndexInParagraph++;
      }
    }

    // Add a small inter-paragraph pause (200ms) for natural speech flow
    if (pIndex < paragraphs.length - 1) {
      cumulativeTimeMs += 200;
    }
  }

  return {
    totalDurationEstimateMs: cumulativeTimeMs,
    wordTimings,
  };
}

// ============================================================================
// Helper: Binary search for active word by time
// ============================================================================
function findActiveWord(
  currentTimeMs: number,
  wordTimings: WordTiming[]
): WordTiming | null {
  if (wordTimings.length === 0) return null;

  let low = 0;
  let high = wordTimings.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const timing = wordTimings[mid];

    if (timing.endTimeMs <= currentTimeMs) {
      low = mid + 1;
    } else if (timing.startTimeMs > currentTimeMs) {
      high = mid - 1;
    } else {
      // currentTimeMs is within this word's time range
      return timing;
    }
  }

  // Return the closest word (either the last one if we've passed all, or the first one)
  if (low >= wordTimings.length) {
    return wordTimings[wordTimings.length - 1];
  }
  if (low === 0) {
    return wordTimings[0];
  }
  return wordTimings[low];
}

// ============================================================================
// Hook: useWordTimings
// ============================================================================
interface UseWordTimingsOptions {
  rawTranscript: string;
  actualDurationMs: number;
  currentTimeMs: number;
  playbackRate: number;
  hasStarted: boolean;
}

interface UseWordTimingsResult {
  activeSegmentIndex: number;
  activeWordIndex: number;
  wordTimings: WordTiming[];
}

export function useWordTimings({
  rawTranscript,
  actualDurationMs,
  currentTimeMs,
  playbackRate,
  hasStarted,
}: UseWordTimingsOptions): UseWordTimingsResult {
  // Parse transcript and compute word timings (memoized on transcript change)
  const { wordTimings, scaleFactor } = useMemo(() => {
    const parsed = parseTranscriptWithPauses(rawTranscript);
    
    // If we have actual audio duration, scale our estimates to match
    let scale = 1;
    if (actualDurationMs > 0 && parsed.totalDurationEstimateMs > 0) {
      scale = actualDurationMs / parsed.totalDurationEstimateMs;
    }

    // Apply scale factor to all timings
    const scaledTimings = parsed.wordTimings.map(wt => ({
      ...wt,
      startTimeMs: wt.startTimeMs * scale,
      endTimeMs: wt.endTimeMs * scale,
    }));

    return { wordTimings: scaledTimings, scaleFactor: scale };
  }, [rawTranscript, actualDurationMs]);

  // Find the currently active word using binary search
  const activeWord = useMemo(() => {
    if (!hasStarted || wordTimings.length === 0) {
      return null;
    }

    // Apply playback rate is already accounted for in currentTimeMs from audio element
    return findActiveWord(currentTimeMs, wordTimings);
  }, [currentTimeMs, wordTimings, hasStarted]);

  return {
    activeSegmentIndex: activeWord?.paragraphIndex ?? -1,
    activeWordIndex: activeWord?.wordIndexInParagraph ?? -1,
    wordTimings,
  };
}
