import { useState, useEffect, useRef, useMemo, useCallback, type MouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Play, Pause, Headphones, SkipBack, SkipForward, Sparkles, Loader2, FastForward
} from 'lucide-react';
import { toast as sonnerToast } from 'sonner';
import { useHaptics } from '@/hooks/useHaptics';
import { useGoogleTTS } from '@/hooks/useGoogleTTS';
import { useVoicePreference } from '@/hooks/useVoicePreference';
import { useAudioProgress } from '@/hooks/useAudioProgress';
import { useStreamingContent } from '@/hooks/useStreamingContent';
import { useSwipeToDismiss } from '@/hooks/useSwipeToDismiss';
import { FlashSummaryCard } from './FlashSummaryCard';
import { VoiceSelector } from './VoiceSelector';
import { springTransition } from '@/lib/motionVariants';
import { AIBadge } from './AIBadge';
import { GeneratingOverlay } from './GeneratingOverlay';
import { SwipeHintHandle } from './SwipeHintHandle';
import type { DailyDownloadTopic } from '@/hooks/useTopics';

// Helper to generate mock transcript (moved from dailyDownloadData.ts)
const generateMockTranscript = (topic: DailyDownloadTopic) => {
  const durationParts = topic.duration.split(':');
  const totalSeconds = parseInt(durationParts[0]) * 60 + parseInt(durationParts[1]);
  
  const segments: { id: string; startTime: number; endTime: number; text: string; words: { word: string; startTime: number; endTime: number }[] }[] = [];
  const segmentDuration = 15;
  
  const generateWordsWithTiming = (text: string, startTime: number, endTime: number) => {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const duration = endTime - startTime;
    const wordDuration = duration / words.length;
    return words.map((word, index) => ({
      word,
      startTime: startTime + (index * wordDuration),
      endTime: startTime + ((index + 1) * wordDuration)
    }));
  };
  
  const createSegment = (id: string, startTime: number, endTime: number, text: string) => ({
    id, startTime, endTime, text,
    words: generateWordsWithTiming(text, startTime, endTime)
  });
  
  // Introduction
  segments.push(createSegment(`${topic.id}-0`, 0, 15, `Welcome to Core Concepts AI. We're going to explore ${topic.title}. ${topic.description}`));
  
  // Content based on flash summary bullet points
  const bulletPoints = topic.flashSummary.bulletPoints;
  bulletPoints.forEach((point, index) => {
    const startTime = 15 + (index * segmentDuration * 3);
    segments.push(createSegment(`${topic.id}-${index + 1}a`, startTime, startTime + segmentDuration, `Let's talk about our ${index === 0 ? 'first' : index === 1 ? 'second' : 'third'} key concept. ${point}`));
    segments.push(createSegment(`${topic.id}-${index + 1}b`, startTime + segmentDuration, startTime + segmentDuration * 2, `This is really important to understand because it forms the foundation of how we approach this topic in practice.`));
    segments.push(createSegment(`${topic.id}-${index + 1}c`, startTime + segmentDuration * 2, startTime + segmentDuration * 3, `Take a moment to think about how this concept connects to what you already know about the subject.`));
  });
  
  // Conclusion
  segments.push(createSegment(`${topic.id}-end`, totalSeconds - 30, totalSeconds - 15, `To summarize what we've learned: ${topic.flashSummary.bulletPoints[0].split(' - ')[0]}, and the key principles we discussed.`));
  segments.push(createSegment(`${topic.id}-outro`, totalSeconds - 15, totalSeconds, `That's all for Core Concepts AI on ${topic.title}. Great job! Don't forget to review the flash card summary.`));
  
  return segments.sort((a, b) => a.startTime - b.startTime).filter((seg, index, arr) => index === 0 || seg.startTime !== arr[index - 1].startTime);
};

interface DailyDownloadPlayerProps {
  topic: DailyDownloadTopic | null;
  subjectName: string;
  isOpen: boolean;
  onClose: () => void;
  onPinCard: (topic: DailyDownloadTopic) => void;
  onTopicListened?: (topicId: string) => void;
}

export const DailyDownloadPlayer = ({
  topic,
  subjectName,
  isOpen,
  onClose,
  onPinCard,
  onTopicListened
}: DailyDownloadPlayerProps) => {
  const { lightTap, mediumTap, successNotification } = useHaptics();
  const [showFlashCard, setShowFlashCard] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const { saveProgress, getProgress, clearProgress } = useAudioProgress();
  
  // Voice preference hook
  const { voiceId, setVoiceId } = useVoicePreference();
  
  // Transcript scroll refs
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const activeSegmentRef = useRef<HTMLParagraphElement | null>(null);
  const dragState = useRef({ isDown: false, startY: 0, scrollTop: 0, didDrag: false });
  const lastSaveTime = useRef<number>(0);
  
  // Audio element ref for streaming playback
  const streamingAudioRef = useRef<HTMLAudioElement | null>(null);
  const streamingAudioQueueRef = useRef<string[]>([]);
  const currentStreamingChunkRef = useRef<number>(0);
  const [isStreamingPlayback, setIsStreamingPlayback] = useState(false);
  const [isWaitingForNextChunk, setIsWaitingForNextChunk] = useState(false);
  const [streamingPlaybackRate, setStreamingPlaybackRate] = useState(1.0);
  const [currentStreamingChunkIndex, setCurrentStreamingChunkIndex] = useState(0); // For UI updates
  
  // Available playback rates
  const PLAYBACK_RATES = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0] as const;
  
  // Define handleSpeechEnd first (used by multiple callbacks)
  const handleSpeechEnd = useCallback(() => {
    if (topic) {
      setShowCelebration(true);
      // Show celebration briefly, then flash card
      setTimeout(() => {
        setShowCelebration(false);
        setShowFlashCard(true);
      }, 1500);
      onTopicListened?.(topic.id);
      clearProgress(topic.id);
    }
  }, [topic, onTopicListened, clearProgress]);
  
  // Play next chunk in streaming queue
  const playNextStreamingChunk = useCallback(() => {
    const queue = streamingAudioQueueRef.current;
    const nextIndex = currentStreamingChunkRef.current + 1;
    
    if (nextIndex < queue.length && queue[nextIndex]) {
      setIsWaitingForNextChunk(false);
      currentStreamingChunkRef.current = nextIndex;
      setCurrentStreamingChunkIndex(nextIndex); // Update state for UI
      const audio = new Audio(queue[nextIndex]);
      audio.playbackRate = streamingPlaybackRate; // Apply current playback rate
      streamingAudioRef.current = audio;
      
      audio.addEventListener('ended', () => {
        const nextNextIndex = currentStreamingChunkRef.current + 1;
        if (nextNextIndex < queue.length && queue[nextNextIndex]) {
          playNextStreamingChunk();
        } else if (nextNextIndex < queue.length) {
          // Next chunk exists but audio not ready yet - show buffering
          console.log('[Player] Waiting for next chunk audio...');
          setIsWaitingForNextChunk(true);
        } else {
          // All chunks played
          setIsStreamingPlayback(false);
          setIsWaitingForNextChunk(false);
          handleSpeechEnd();
        }
      });
      
      audio.play().catch(console.error);
    } else if (nextIndex < queue.length) {
      // Chunk exists but audio not ready - show buffering
      setIsWaitingForNextChunk(true);
    }
  }, [handleSpeechEnd, streamingPlaybackRate]);
  
  // Streaming content hook for parallel transcript + audio generation
  const streamingContent = useStreamingContent({
    onFirstChunkAudioReady: (blobUrl) => {
      console.log('[Player] First chunk audio ready, auto-playing...');
      streamingAudioQueueRef.current[0] = blobUrl;
      currentStreamingChunkRef.current = 0;
      setCurrentStreamingChunkIndex(0); // Update state for UI
      setIsWaitingForNextChunk(false);
      
      // Create and play first audio chunk
      const audio = new Audio(blobUrl);
      audio.playbackRate = streamingPlaybackRate; // Apply current playback rate
      streamingAudioRef.current = audio;
      
      audio.addEventListener('ended', () => {
        // Check if next chunk is ready
        if (streamingAudioQueueRef.current[1]) {
          playNextStreamingChunk();
        } else {
          // Wait for next chunk - show buffering
          console.log('[Player] Waiting for next chunk...');
          setIsWaitingForNextChunk(true);
        }
      });
      
      // Auto-start playback
      setHasStarted(true);
      setShowResumePrompt(false);
      setIsStreamingPlayback(true);
      
      audio.play().catch(console.error);
    },
    onChunkAudioReady: (chunkIndex, blobUrl) => {
      console.log(`[Player] Chunk ${chunkIndex} audio ready`);
      streamingAudioQueueRef.current[chunkIndex] = blobUrl;
      
      // If we were waiting for this chunk, play it now
      if (isWaitingForNextChunk && currentStreamingChunkRef.current + 1 === chunkIndex) {
        console.log('[Player] Resuming playback with newly ready chunk');
        playNextStreamingChunk();
      }
    },
    onError: (error) => {
      sonnerToast.error("Generation Issue", {
        description: error || "Using fallback content. Try again later.",
        duration: 3000,
      });
      setIsStreamingPlayback(false);
    },
    onComplete: () => {
      console.log('[Player] Streaming generation complete');
    },
  });
  
  const isStreaming = streamingContent.isStreaming;
  const streamingProgress = streamingContent.progress;
  const chunksReady = streamingContent.chunks.filter(c => c.audioReady).length;
  const totalChunks = streamingContent.chunks.length;

  const {
    isPlaying,
    isPaused,
    isSpeaking,
    isLoading: isTTSLoading,
    isBuffering,
    currentCharIndex,
    progress,
    playbackRate,
    duration,
    useFallback,
    speak,
    pause,
    resume,
    stop,
    cyclePlaybackRate,
    seekToChar,
    clearCache,
  } = useGoogleTTS({
    onEnd: handleSpeechEnd
  });

  // Waveform animation should follow the hook's playing state.
  // The hook now syncs isPlaying via audio 'playing'/'pause' events,
  // so this stays accurate without extra polling.
  const waveformShouldAnimate = isPlaying;

  // Helper to strip stage directions/tags from transcript text
  const stripTags = useCallback((text: string): string => {
    // Remove [PAUSE: X Seconds], [PROMPT], and similar bracketed tags
    return text
      .replace(/\[PAUSE:\s*\d+\s*(?:Seconds?|s)\]/gi, '')
      .replace(/\[(?:PROMPT|PAUSE|NOTE|DIRECTION)[^\]]*\]/gi, '')
      .replace(/\s{2,}/g, ' ') // Clean up extra spaces
      .trim();
  }, []);

  // Generate transcript for current topic - use streaming chunks if available
  const transcript = useMemo(() => {
    if (!topic) return [];
    
    // If we have streaming chunks with text, use those instead of mock
    const streamingChunks = streamingContent.chunks.filter(c => c.text);
    if (streamingChunks.length > 0) {
      // Convert streaming chunks to transcript segment format
      const segmentDuration = 30; // Each chunk is ~30 seconds
      return streamingChunks.map((chunk, index) => {
        const startTime = index * segmentDuration;
        const endTime = startTime + segmentDuration;
        // Strip tags from the text
        const cleanText = stripTags(chunk.text);
        
        // Generate word timings
        const words = cleanText.split(/\s+/).filter(w => w.length > 0);
        const wordDuration = words.length > 0 ? segmentDuration / words.length : 0;
        
        return {
          id: `${topic.id}-streaming-${index}`,
          startTime,
          endTime,
          text: cleanText,
          words: words.map((word, wordIndex) => ({
            word,
            startTime: startTime + (wordIndex * wordDuration),
            endTime: startTime + ((wordIndex + 1) * wordDuration),
          })),
        };
      });
    }
    
    // Fallback to mock transcript if no streaming content
    return generateMockTranscript(topic);
  }, [topic, streamingContent.chunks, stripTags]);

  // Get full transcript text for speech (also stripped of tags)
  const fullTranscriptText = useMemo(() => {
    return transcript.map(seg => seg.text).join(' ');
  }, [transcript]);

  // For streaming playback, track which segment is currently playing based on chunk index
  const streamingActiveSegmentIndex = isStreamingPlayback ? currentStreamingChunkRef.current : -1;

  // Handle voice change - works for both streaming and non-streaming playback
  const handleVoiceChange = useCallback((newVoiceId: string) => {
    setVoiceId(newVoiceId);
    
    // Check if we're in streaming playback mode
    if (isStreamingPlayback && streamingContent.chunks.length > 0) {
      console.log('[Player] Voice change during streaming - regenerating audio');
      
      // Stop current streaming audio
      if (streamingAudioRef.current) {
        streamingAudioRef.current.pause();
        streamingAudioRef.current = null;
      }
      
      // Save current position (chunk index)
      const savedChunkIndex = currentStreamingChunkRef.current;
      
      // Clear audio queue
      streamingAudioQueueRef.current = [];
      currentStreamingChunkRef.current = 0;
      setIsWaitingForNextChunk(true);
      
      // Regenerate audio with new voice
      streamingContent.regenerateAudioWithVoice(
        newVoiceId,
        1.0,
        // onFirstChunkReady - resume from saved position or start
        (blobUrl) => {
          console.log('[Player] First chunk regenerated, resuming...');
          streamingAudioQueueRef.current[0] = blobUrl;
          
          // If saved position was 0, play immediately
          if (savedChunkIndex === 0) {
            currentStreamingChunkRef.current = 0;
            setIsWaitingForNextChunk(false);
            
            const audio = new Audio(blobUrl);
            streamingAudioRef.current = audio;
            
            audio.addEventListener('ended', () => {
              if (streamingAudioQueueRef.current[1]) {
                playNextStreamingChunk();
              } else {
                setIsWaitingForNextChunk(true);
              }
            });
            
            audio.play().catch(console.error);
          }
        },
        // onChunkReady
        (chunkIndex, blobUrl) => {
          streamingAudioQueueRef.current[chunkIndex] = blobUrl;
          
          // If this is the chunk we need to resume from, play it
          if (chunkIndex === savedChunkIndex && !streamingAudioRef.current) {
            currentStreamingChunkRef.current = chunkIndex;
            setIsWaitingForNextChunk(false);
            
            const audio = new Audio(blobUrl);
            streamingAudioRef.current = audio;
            
            audio.addEventListener('ended', () => {
              const nextIndex = currentStreamingChunkRef.current + 1;
              if (streamingAudioQueueRef.current[nextIndex]) {
                playNextStreamingChunk();
              } else {
                setIsWaitingForNextChunk(true);
              }
            });
            
            audio.play().catch(console.error);
          }
          // If we're waiting and this is the next chunk, play it
          else if (isWaitingForNextChunk && currentStreamingChunkRef.current + 1 === chunkIndex) {
            playNextStreamingChunk();
          }
        }
      );
    } else {
      // Non-streaming playback - use existing TTS logic
      const wasPlaying = isPlaying || isPaused;
      clearCache(undefined, true); // Save position before clearing
      
      if (wasPlaying && hasStarted) {
        setTimeout(() => {
          speak(fullTranscriptText, newVoiceId);
        }, 50);
      }
    }
  }, [
    setVoiceId, isStreamingPlayback, streamingContent, playNextStreamingChunk,
    isWaitingForNextChunk, isPlaying, isPaused, hasStarted, clearCache, speak, fullTranscriptText
  ]);

  // Cycle playback rate for streaming audio
  const cycleStreamingPlaybackRate = useCallback(() => {
    setStreamingPlaybackRate(currentRate => {
      const currentIndex = PLAYBACK_RATES.indexOf(currentRate as typeof PLAYBACK_RATES[number]);
      const nextIndex = (currentIndex + 1) % PLAYBACK_RATES.length;
      const newRate = PLAYBACK_RATES[nextIndex];
      
      // Apply to current audio element immediately
      if (streamingAudioRef.current) {
        streamingAudioRef.current.playbackRate = newRate;
      }
      
      return newRate;
    });
  }, []);

  // Combined playback rate handler that works for both modes
  const handleCyclePlaybackRate = useCallback(() => {
    lightTap();
    if (isStreamingPlayback) {
      cycleStreamingPlaybackRate();
    } else {
      cyclePlaybackRate();
    }
  }, [isStreamingPlayback, cycleStreamingPlaybackRate, cyclePlaybackRate, lightTap]);

  // Get current playback rate for display
  const currentPlaybackRate = isStreamingPlayback ? streamingPlaybackRate : playbackRate;

  // Estimate total duration based on text length and speaking rate (~150 words/min)
  const estimatedDuration = useMemo(() => {
    // If we have real duration from TTS, use it (convert from ms to seconds)
    if (duration > 0) {
      return duration / 1000;
    }
    // Otherwise estimate based on word count
    const wordCount = fullTranscriptText.split(/\s+/).length;
    return Math.max((wordCount / 150) * 60, 60); // At least 60 seconds
  }, [fullTranscriptText, duration]);

  // Calculate current time in seconds based on character progress
  const currentSeconds = useMemo(() => {
    if (fullTranscriptText.length === 0) return 0;
    return (currentCharIndex / fullTranscriptText.length) * estimatedDuration;
  }, [currentCharIndex, fullTranscriptText.length, estimatedDuration]);

  // Find active transcript segment based on playback mode
  const activeSegmentIndex = useMemo(() => {
    // For streaming playback, use the current chunk index
    if (isStreamingPlayback) {
      return currentStreamingChunkIndex;
    }
    
    // For TTS playback, use character index
    if (!isSpeaking && !hasStarted) return -1;
    
    let charCount = 0;
    for (let i = 0; i < transcript.length; i++) {
      const segmentLength = transcript[i].text.length + 1; // +1 for space
      if (currentCharIndex < charCount + segmentLength) {
        return i;
      }
      charCount += segmentLength;
    }
    return transcript.length - 1;
  }, [transcript, currentCharIndex, isSpeaking, hasStarted, isStreamingPlayback, currentStreamingChunkIndex]);

  // Calculate word-level progress within active segment
  const activeWordIndex = useMemo(() => {
    if (activeSegmentIndex < 0) return -1;
    const segment = transcript[activeSegmentIndex];
    if (!segment) return -1;
    
    // Calculate character offset within this segment
    let prevCharsCount = 0;
    for (let i = 0; i < activeSegmentIndex; i++) {
      prevCharsCount += transcript[i].text.length + 1;
    }
    const charInSegment = currentCharIndex - prevCharsCount;
    
    // Find which word we're on
    let charCount = 0;
    for (let i = 0; i < segment.words.length; i++) {
      const wordLength = segment.words[i].word.length + 1;
      if (charInSegment < charCount + wordLength) {
        return i;
      }
      charCount += wordLength;
    }
    return segment.words.length - 1;
  }, [activeSegmentIndex, currentCharIndex, transcript]);

  // Auto-scroll to active segment
  useEffect(() => {
    if (activeSegmentRef.current && transcriptRef.current) {
      activeSegmentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeSegmentIndex]);

  // Always trigger streaming flow - edge function handles transcript caching internally
  // This allows the edge function to check for cached transcripts and return them without AI call
  const needsAIContent = useMemo(() => {
    if (!topic) return false;
    // Always go through streaming flow - edge function handles caching
    return true;
  }, [topic]);

  // Track which topic we're generating for to prevent duplicate requests
  const generatingForTopicId = useRef<string | null>(null);
  const previousTopicId = useRef<string | null>(null);

  // Auto-generate content when topic is opened and needs AI content
  useEffect(() => {
    if (isOpen && topic && needsAIContent && !isStreaming && !streamingContent.firstChunkReady) {
      // Prevent re-entrant generation for the same topic
      if (generatingForTopicId.current === topic.id) {
        return;
      }
      
      console.log('Auto-generating streaming AI content for topic:', topic.title);
      
      // Track that we're generating for this topic
      generatingForTopicId.current = topic.id;
      
      // Start streaming generation with voice preference
      streamingContent.startStreaming({
        topicId: topic.id,
        topicTitle: topic.title,
        topicDescription: topic.description,
        subjectName,
        voiceId,
      });
    }
  }, [isOpen, topic?.id, needsAIContent, isStreaming, streamingContent.firstChunkReady, subjectName, voiceId]);

  // Clear generation tracking when streaming completes or errors
  useEffect(() => {
    if (streamingContent.error) {
      generatingForTopicId.current = null;
    } else if (streamingContent.fullTranscript) {
      generatingForTopicId.current = null;
    }
  }, [streamingContent.error, streamingContent.fullTranscript]);

  // Reset state when topic changes to a DIFFERENT topic
  useEffect(() => {
    // Only cancel and reset if switching to a different topic
    if (previousTopicId.current !== null && previousTopicId.current !== topic?.id) {
      console.log('[Player] Topic changed, cancelling previous streaming');
      stop();
      streamingContent.cancel();
      generatingForTopicId.current = null;
      setShowFlashCard(false);
      setHasStarted(false);
      setShowResumePrompt(false);
    }
    
    // Update previous topic ID
    previousTopicId.current = topic?.id ?? null;
    
    // Check if there's saved progress for this topic
    if (topic) {
      const savedProgress = getProgress(topic.id);
      if (savedProgress !== null && savedProgress > 0) {
        setShowResumePrompt(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic?.id]);

  // Auto-save progress every 5 seconds while playing
  useEffect(() => {
    if (!isPlaying || !topic) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastSaveTime.current > 5000) {
        saveProgress(topic.id, currentCharIndex);
        lastSaveTime.current = now;
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isPlaying, topic, currentCharIndex, saveProgress]);

  // Format time helper
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Transcript drag handlers
  const handleTranscriptMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    const el = transcriptRef.current;
    if (!el) return;
    dragState.current.isDown = true;
    dragState.current.startY = e.clientY;
    dragState.current.scrollTop = el.scrollTop;
    dragState.current.didDrag = false;
    el.style.cursor = 'grabbing';
  };

  const handleTranscriptMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = transcriptRef.current;
    if (!el || !dragState.current.isDown) return;
    const dy = e.clientY - dragState.current.startY;
    if (Math.abs(dy) > 3) dragState.current.didDrag = true;
    el.scrollTop = dragState.current.scrollTop - dy;
    e.preventDefault();
  };

  const handleTranscriptMouseUp = () => {
    const el = transcriptRef.current;
    if (el) el.style.cursor = 'grab';
    
    const hadDrag = dragState.current.didDrag;
    dragState.current.isDown = false;
    
    if (hadDrag) {
      window.setTimeout(() => {
        dragState.current.didDrag = false;
      }, 0);
    }
  };

  const handlePlayPause = () => {
    mediumTap();
    if (!hasStarted) {
      // First time playing - start speech with selected voice
      setHasStarted(true);
      setShowResumePrompt(false);
      speak(fullTranscriptText, voiceId);
    } else if (isPlaying) {
      pause();
    } else if (isPaused) {
      resume();
    } else {
      // Restart from beginning with selected voice
      speak(fullTranscriptText, voiceId);
    }
  };

  const handleResume = () => {
    mediumTap();
    setHasStarted(true);
    setShowResumePrompt(false);
    
    if (topic) {
      const savedCharIndex = getProgress(topic.id);
      speak(fullTranscriptText, voiceId);
      if (savedCharIndex !== null && savedCharIndex > 0) {
        // Small delay to let speech start before seeking
        setTimeout(() => {
          seekToChar(savedCharIndex);
        }, 100);
      }
    }
  };

  const handleStartFresh = () => {
    mediumTap();
    setHasStarted(true);
    setShowResumePrompt(false);
    if (topic) {
      clearProgress(topic.id);
    }
    speak(fullTranscriptText, voiceId);
  };

  const handleDismissFlashCard = () => {
    successNotification();
    setShowFlashCard(false);
    if (topic) {
      clearProgress(topic.id);
    }
    onClose();
  };

  const handlePinFlashCard = () => {
    if (topic) {
      successNotification();
      onPinCard(topic);
      setShowFlashCard(false);
      clearProgress(topic.id);
      onClose();
    }
  };

  // Generate waveform bars - memoized to prevent re-renders
  const waveformBars = useMemo(() => 
    Array.from({ length: 40 }, (_, i) => ({
      height: Math.random() * 60 + 20,
      delay: i * 0.02
    })), []);

  const { dragProps: swipeDragProps, backdropOpacity } = useSwipeToDismiss({
    onDismiss: onClose,
    threshold: 120,
  });

  if (!topic || !isOpen) return null;

  return (
    <motion.div
      className="absolute inset-0 z-50 bg-background flex flex-col"
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: backdropOpacity, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={springTransition}
      {...swipeDragProps}
    >
          {/* Drag Handle with swipe hint */}
          <SwipeHintHandle direction="down" />

          {/* Header */}
          <header className="flex items-center justify-between p-4 pt-8 sm:pt-8">
            <button
              onClick={() => { lightTap(); onClose(); }}
              className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-6 h-6 text-foreground" />
            </button>
            <div className="text-center">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center justify-center gap-1.5">
                Core Concepts <AIBadge size="sm" />
              </p>
              <p className="text-sm text-primary font-medium">{subjectName}</p>
            </div>
            {/* Empty div to balance header */}
            <div className="w-10" />
          </header>

          {/* TTS Loading overlay */}
          <AnimatePresence>
            {isTTSLoading && (
              <motion.div
                className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </motion.div>
                <p className="text-lg font-semibold text-foreground mb-2">Generating Audio</p>
                <p className="text-sm text-muted-foreground text-center px-8">
                  Creating high-quality narration with Google Cloud TTS...
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generating overlay - now uses streaming props */}
          <GeneratingOverlay 
            isGenerating={false} 
            isStreaming={isStreaming && !streamingContent.firstChunkReady}
            streamingProgress={streamingProgress}
            chunksReady={chunksReady}
            totalChunks={totalChunks}
            topicTitle={topic.title} 
            onCancel={() => {
              streamingContent.cancel();
              onClose();
            }}
          />

          {/* Main content */}
          <div className="flex-1 flex flex-col px-6 overflow-hidden">
            {/* Compact player section */}
            <div className="flex items-center gap-4 py-4">
              {/* Topic icon - smaller */}
              <motion.div
                className={`w-16 h-16 shrink-0 rounded-full flex items-center justify-center ${
                  showResumePrompt 
                    ? 'bg-gradient-to-br from-warning/20 to-warning/5' 
                    : 'bg-gradient-to-br from-primary/20 to-primary/5'
                }`}
                animate={isPlaying ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Headphones className={`w-8 h-8 ${showResumePrompt ? 'text-warning' : 'text-primary'}`} />
              </motion.div>

              {/* Title and description */}
              <div className="flex-1 min-w-0">
                <h1 className="text-base font-bold text-foreground truncate">
                  {topic.title}
                </h1>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {topic.description}
                </p>
                {useFallback && (
                  <p className="text-[10px] text-warning mt-1">
                    Using browser voice (fallback)
                  </p>
                )}
              </div>
            </div>

            {/* Waveform visualization - only show when playing/paused */}
            <div className="flex items-center justify-center gap-0.5 h-10 mb-3 relative">
              {hasStarted ? (
                waveformBars.map((bar, i) => (
                  <motion.div
                    key={i}
                    className={`w-1 rounded-full ${isBuffering ? 'bg-primary/30' : 'bg-primary/60'}`}
                    animate={waveformShouldAnimate && !isBuffering ? {
                      height: [bar.height * 0.2, bar.height * 0.6, bar.height * 0.3, bar.height * 0.5, bar.height * 0.2],
                    } : { height: bar.height * 0.3 }}
                    transition={waveformShouldAnimate && !isBuffering ? {
                      duration: 1,
                      repeat: Infinity,
                      delay: bar.delay,
                      ease: "easeInOut"
                    } : { duration: 0.2 }}
                  />
                ))
              ) : (
                // Static placeholder waveform before audio starts
                waveformBars.map((bar, i) => (
                  <div
                    key={i}
                    className="w-1 bg-muted-foreground/20 rounded-full"
                    style={{ height: bar.height * 0.3 }}
                  />
                ))
              )}
            </div>
            
            {/* Buffering indicator - shows for TTS buffering OR waiting for next streaming chunk */}
            <AnimatePresence>
              {((isBuffering && hasStarted) || isWaitingForNextChunk) && (
                <motion.div
                  className="flex items-center justify-center gap-2 mb-2"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Loader2 className="w-3 h-3 text-primary animate-spin" />
                  <span className="text-xs text-muted-foreground">
                    {isWaitingForNextChunk ? 'Loading next segment...' : 'Buffering...'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Seekable Progress bar */}
            <div className="w-full max-w-sm mx-auto mb-2">
              <div 
                className="h-2 bg-muted rounded-full overflow-visible relative cursor-pointer group"
                onClick={(e) => {
                  if (!hasStarted) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const percentage = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
                  const targetChar = Math.floor((percentage / 100) * fullTranscriptText.length);
                  lightTap();
                  seekToChar(targetChar);
                }}
                onMouseDown={(e) => {
                  if (!hasStarted) return;
                  e.preventDefault();
                  
                  const progressBar = e.currentTarget;
                  const rect = progressBar.getBoundingClientRect();
                  
                  const handleDrag = (moveEvent: globalThis.MouseEvent) => {
                    const clickX = moveEvent.clientX - rect.left;
                    const percentage = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
                    const targetChar = Math.floor((percentage / 100) * fullTranscriptText.length);
                    seekToChar(targetChar);
                  };
                  
                  const handleDragEnd = () => {
                    document.removeEventListener('mousemove', handleDrag);
                    document.removeEventListener('mouseup', handleDragEnd);
                  };
                  
                  document.addEventListener('mousemove', handleDrag);
                  document.addEventListener('mouseup', handleDragEnd);
                }}
                onTouchStart={(e) => {
                  if (!hasStarted) return;
                  
                  const progressBar = e.currentTarget;
                  const rect = progressBar.getBoundingClientRect();
                  
                  const handleTouchMove = (moveEvent: TouchEvent) => {
                    const touch = moveEvent.touches[0];
                    const clickX = touch.clientX - rect.left;
                    const percentage = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
                    const targetChar = Math.floor((percentage / 100) * fullTranscriptText.length);
                    seekToChar(targetChar);
                  };
                  
                  const handleTouchEnd = () => {
                    document.removeEventListener('touchmove', handleTouchMove);
                    document.removeEventListener('touchend', handleTouchEnd);
                  };
                  
                  document.addEventListener('touchmove', handleTouchMove, { passive: true });
                  document.addEventListener('touchend', handleTouchEnd);
                  
                  // Handle initial touch position
                  const touch = e.touches[0];
                  const clickX = touch.clientX - rect.left;
                  const percentage = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
                  const targetChar = Math.floor((percentage / 100) * fullTranscriptText.length);
                  lightTap();
                  seekToChar(targetChar);
                }}
              >
                {/* Track background with larger touch target */}
                <div className="absolute inset-y-0 -inset-x-0 py-2 -my-2" />
                
                {/* Progress fill */}
                <motion.div 
                  className="h-full bg-primary rounded-full pointer-events-none"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1, ease: "linear" }}
                />
                
                {/* Progress knob - larger on hover/drag */}
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full shadow-md border-2 border-background pointer-events-none group-hover:scale-125 transition-transform"
                  style={{ left: `calc(${Math.min(progress, 98)}% - 8px)` }}
                />
              </div>
            </div>

            {/* Time display with speed and voice controls */}
            <div className="flex justify-between items-center w-full max-w-sm mx-auto mb-4">
              <span className="text-sm font-medium text-foreground tabular-nums">
                {formatTime(currentSeconds)}
              </span>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCyclePlaybackRate}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/60 hover:bg-muted hover:scale-105 transition-all text-[10px] font-medium text-foreground"
                >
                  {currentPlaybackRate}x
                </button>
                
                <div className="w-px h-3 bg-border/50" />
                
                <VoiceSelector
                  selectedVoiceId={voiceId}
                  onVoiceChange={handleVoiceChange}
                  disabled={isTTSLoading}
                />
              </div>
              
              <span className="text-sm text-muted-foreground tabular-nums">
                {formatTime(estimatedDuration)}
              </span>
            </div>

            {/* Resume prompt or playback controls */}
            {showResumePrompt ? (
              <div className="flex flex-col items-center gap-3 w-full max-w-sm mx-auto mb-4">
                <p className="text-sm text-muted-foreground text-center">
                  You have saved progress for this topic
                </p>
                <div className="flex gap-3 w-full">
                  <motion.button
                    onClick={handleStartFresh}
                    className="flex-1 py-3 rounded-xl bg-muted text-foreground font-medium"
                    whileTap={{ scale: 0.95 }}
                  >
                    Start Over
                  </motion.button>
                  <motion.button
                    onClick={handleResume}
                    className="flex-1 py-3 rounded-xl bg-warning text-warning-foreground font-medium"
                    whileTap={{ scale: 0.95 }}
                  >
                    Resume
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-4 w-full max-w-sm mx-auto mb-4">
                {/* Skip back 15s */}
                <motion.button
                  onClick={() => {
                    lightTap();
                    if (!hasStarted) return;
                    // Estimate chars for 15 seconds: ~150 words/min = 2.5 words/sec, ~5 chars/word = ~12.5 chars/sec
                    const charsPerSecond = (fullTranscriptText.length / estimatedDuration);
                    const skipChars = Math.floor(charsPerSecond * 15);
                    const newCharIndex = Math.max(0, currentCharIndex - skipChars);
                    seekToChar(newCharIndex);
                  }}
                  className="w-12 h-12 rounded-full bg-muted text-foreground flex flex-col items-center justify-center relative"
                  whileTap={{ scale: 0.9 }}
                  aria-label="Skip back 15 seconds"
                >
                  <SkipBack className="w-5 h-5" />
                  <span className="text-[10px] font-semibold -mt-0.5">15</span>
                </motion.button>

                {/* Play/Pause */}
                <motion.button
                  onClick={handlePlayPause}
                  disabled={isTTSLoading}
                  className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg disabled:opacity-50"
                  whileTap={{ scale: 0.9 }}
                >
                  {isTTSLoading ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8 ml-1" />
                  )}
                </motion.button>

              {/* Skip forward 15s */}
              <motion.button
                onClick={() => {
                  lightTap();
                  if (!hasStarted) return;
                  const charsPerSecond = (fullTranscriptText.length / estimatedDuration);
                  const skipChars = Math.floor(charsPerSecond * 15);
                  const newCharIndex = currentCharIndex + skipChars;
                  
                  // If skipping past end, show flash card
                  if (newCharIndex >= fullTranscriptText.length) {
                    stop();
                    if (topic) {
                      setShowFlashCard(true);
                      onTopicListened?.(topic.id);
                    }
                  } else {
                    seekToChar(newCharIndex);
                  }
                }}
                className="w-12 h-12 rounded-full bg-muted text-foreground flex flex-col items-center justify-center relative"
                whileTap={{ scale: 0.9 }}
                aria-label="Skip forward 15 seconds"
              >
                <SkipForward className="w-5 h-5" />
                <span className="text-[10px] font-semibold -mt-0.5">15</span>
              </motion.button>

              {/* Skip to Summary */}
              {hasStarted && (
                <motion.button
                  onClick={() => {
                    lightTap();
                    stop();
                    if (topic) {
                      setShowCelebration(true);
                      setTimeout(() => {
                        setShowCelebration(false);
                        setShowFlashCard(true);
                      }, 1500);
                      onTopicListened?.(topic.id);
                      clearProgress(topic.id);
                    }
                  }}
                  className="ml-4 px-3 py-2 rounded-lg bg-muted/60 text-foreground text-xs font-medium flex items-center gap-1.5 hover:bg-muted transition-colors"
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <FastForward className="w-3.5 h-3.5" />
                  Summary
                </motion.button>
              )}
              </div>
            )}

            {/* Transcript section - flex-grow to fill remaining space */}
            <div className="flex-1 flex flex-col min-h-0 pb-safe">
              <p className="text-xs text-muted-foreground mb-2 text-center shrink-0">Transcript</p>
              <div
                ref={transcriptRef}
                className="flex-1 overflow-y-auto scrollbar-none bg-muted/30 rounded-xl p-4 cursor-grab overscroll-contain"
                style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
                onMouseDown={handleTranscriptMouseDown}
                onMouseMove={handleTranscriptMouseMove}
                onMouseUp={handleTranscriptMouseUp}
                onMouseLeave={handleTranscriptMouseUp}
                onDragStart={(e) => e.preventDefault()}
              >
                <div className="space-y-3">
                  {transcript.map((segment, index) => {
                    const isActive = index === activeSegmentIndex;
                    const isPast = index < activeSegmentIndex;
                    
                    // Calculate char index for this segment
                    let segmentStartChar = 0;
                    for (let i = 0; i < index; i++) {
                      segmentStartChar += transcript[i].text.length + 1;
                    }
                    
                    return (
                      <p
                        key={segment.id}
                        ref={isActive ? activeSegmentRef : null}
                        onClick={() => {
                          if (hasStarted && !dragState.current.didDrag) {
                            lightTap();
                            seekToChar(segmentStartChar);
                          }
                        }}
                        className={`text-sm leading-relaxed transition-all duration-300 cursor-pointer hover:bg-primary/5 rounded px-1 -mx-1 ${
                          isActive 
                            ? 'text-foreground' 
                            : isPast 
                              ? 'text-muted-foreground/60' 
                              : 'text-muted-foreground/40'
                        }`}
                      >
                        {isActive && (
                          <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full mr-2 animate-pulse" />
                        )}
                        {isActive ? (
                          segment.words.map((word, wordIndex) => {
                            const isWordActive = wordIndex === activeWordIndex;
                            const isWordPast = wordIndex < activeWordIndex;
                            
                            return (
                              <span
                                key={wordIndex}
                                className={`transition-all duration-150 ${
                                  isWordActive 
                                    ? 'text-primary font-semibold' 
                                    : isWordPast 
                                      ? 'text-foreground font-medium' 
                                      : 'text-muted-foreground/70'
                                }`}
                              >
                                {word.word}{' '}
                              </span>
                            );
                          })
                        ) : (
                          segment.text
                        )}
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Celebration animation */}
          <AnimatePresence>
            {showCelebration && (
              <motion.div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ type: "spring", damping: 12, stiffness: 200 }}
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mb-4 shadow-lg shadow-green-500/30"
                >
                  <Sparkles className="w-12 h-12 text-white" />
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-bold text-white mb-2"
                >
                  Great job!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-white/80 text-sm"
                >
                  Topic completed
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Flash Summary Card overlay */}
          <AnimatePresence>
            {showFlashCard && (
              <motion.div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 50, opacity: 0 }}
                  transition={springTransition}
                >
                  <FlashSummaryCard
                    flashSummary={topic.flashSummary}
                    topicTitle={topic.title}
                    onDismiss={handleDismissFlashCard}
                    onPin={handlePinFlashCard}
                  />
                </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);
};
