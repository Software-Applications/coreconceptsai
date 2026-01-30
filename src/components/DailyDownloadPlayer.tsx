import { useState, useEffect, useRef, useMemo, useCallback, type MouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Play, Pause, Headphones, SkipBack, SkipForward, Sparkles, Loader2
} from 'lucide-react';
import { toast as sonnerToast } from 'sonner';
import { useHaptics } from '@/hooks/useHaptics';
import { useGoogleTTS } from '@/hooks/useGoogleTTS';
import { useVoicePreference } from '@/hooks/useVoicePreference';
import { useAudioProgress } from '@/hooks/useAudioProgress';
import { useGenerateContent } from '@/hooks/useAIGeneration';
import { FlashSummaryCard } from './FlashSummaryCard';
import { VoiceSelector } from './VoiceSelector';
import { springTransition } from '@/lib/motionVariants';
import { AIBadge } from './AIBadge';
import { GeneratingOverlay } from './GeneratingOverlay';
import { GeneratingProgressToast } from './GeneratingProgressToast';
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
  const { saveProgress, getProgress, clearProgress } = useAudioProgress();
  
  // Voice preference hook
  const { voiceId, setVoiceId } = useVoicePreference();
  
  // AI generation hook
  const generateContent = useGenerateContent();
  const isGenerating = generateContent.isPending;
  
  // Transcript scroll refs
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const activeSegmentRef = useRef<HTMLParagraphElement | null>(null);
  const dragState = useRef({ isDown: false, startY: 0, scrollTop: 0 });
  const lastSaveTime = useRef<number>(0);
  
  const handleSpeechEnd = useCallback(() => {
    if (topic) {
      setShowFlashCard(true);
      onTopicListened?.(topic.id);
      clearProgress(topic.id); // Clear saved progress on completion
    }
  }, [topic, onTopicListened, clearProgress]);

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

  // Generate transcript for current topic
  const transcript = useMemo(() => {
    if (!topic) return [];
    return generateMockTranscript(topic);
  }, [topic]);

  // Get full transcript text for speech
  const fullTranscriptText = useMemo(() => {
    return transcript.map(seg => seg.text).join(' ');
  }, [transcript]);

  // Handle voice change - clear cache so new voice is used, preserving playback position
  const handleVoiceChange = useCallback((newVoiceId: string) => {
    const wasPlaying = isPlaying || isPaused;
    setVoiceId(newVoiceId);
    // Clear the cache with position saving, then restart with new voice
    clearCache(undefined, true); // Save position before clearing
    
    // If audio was playing/paused, restart with new voice (will resume from saved position)
    if (wasPlaying && hasStarted) {
      // Small delay to ensure cache is cleared
      setTimeout(() => {
        speak(fullTranscriptText, newVoiceId);
      }, 50);
    }
  }, [setVoiceId, clearCache, isPlaying, isPaused, hasStarted, speak, fullTranscriptText]);

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

  // Find active transcript segment based on character index
  const activeSegmentIndex = useMemo(() => {
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
  }, [transcript, currentCharIndex, isSpeaking, hasStarted]);

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

  // Check if topic needs AI content generation
  const needsAIContent = useMemo(() => {
    if (!topic) return false;
    // Check if flash summary has meaningful content (AI-generated content has longer bullet points)
    const hasFlashSummary = topic.flashSummary.bulletPoints.some(bp => bp.length > 20);
    // Check if description is substantial (AI transcripts are typically 1000+ chars)
    const hasTranscript = topic.description.length > 500;
    return !hasFlashSummary || !hasTranscript;
  }, [topic]);

  const generatingToastId = useRef<string | number | null>(null);

  // Auto-generate content when topic is opened and needs AI content
  useEffect(() => {
    if (isOpen && topic && needsAIContent && !isGenerating && !generateContent.isSuccess) {
      console.log('Auto-generating AI content for topic:', topic.title);
      
      // Show custom progress toast using sonner
      generatingToastId.current = sonnerToast.custom(
        () => <GeneratingProgressToast topicTitle={topic.title} />,
        { duration: Infinity }
      );
      
      generateContent.mutate({
        topicId: topic.id,
        topicTitle: topic.title,
        topicDescription: topic.description,
        subjectName,
      });
    }
  }, [isOpen, topic?.id, needsAIContent, isGenerating, generateContent.isSuccess, subjectName]);

  // Dismiss toast when generation completes or fails
  useEffect(() => {
    if (generatingToastId.current && (generateContent.isSuccess || generateContent.isError)) {
      sonnerToast.dismiss(generatingToastId.current);
      generatingToastId.current = null;
      
      if (generateContent.isSuccess) {
        sonnerToast.success("Content Ready", {
          description: "Your personalized explanation is ready!",
          duration: 2000,
        });
      } else if (generateContent.isError) {
        sonnerToast.error("Generation Issue", {
          description: "Using fallback content. Try again later.",
          duration: 3000,
        });
      }
    }
  }, [generateContent.isSuccess, generateContent.isError]);

  // Reset state when topic changes
  useEffect(() => {
    stop();
    setShowFlashCard(false);
    setHasStarted(false);
    setShowResumePrompt(false);
    
    // Check if there's saved progress for this topic
    if (topic) {
      const savedProgress = getProgress(topic.id);
      if (savedProgress !== null && savedProgress > 0) {
        setShowResumePrompt(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic?.id]);
  
  // Reset generation state separately to avoid render loop
  useEffect(() => {
    generateContent.reset();
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
    el.style.cursor = 'grabbing';
  };

  const handleTranscriptMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = transcriptRef.current;
    if (!el || !dragState.current.isDown) return;
    const dy = e.clientY - dragState.current.startY;
    el.scrollTop = dragState.current.scrollTop - dy;
    e.preventDefault();
  };

  const handleTranscriptMouseUp = () => {
    const el = transcriptRef.current;
    if (el) el.style.cursor = 'grab';
    dragState.current.isDown = false;
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

  if (!topic || !isOpen) return null;

  return (
    <motion.div
      className="absolute inset-0 z-50 bg-background flex flex-col"
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={springTransition}
    >
          {/* Header */}
          <header className="flex items-center justify-between p-4 pt-14 sm:pt-14">
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

          {/* Generating overlay */}
          <GeneratingOverlay isGenerating={isGenerating} />

          {/* Main content */}
          <div className="flex-1 flex flex-col px-6 overflow-hidden">
            {/* Compact player section */}
            <div className="flex items-center gap-4 py-4">
              {/* Topic icon - smaller */}
              <motion.div
                className={`w-16 h-16 shrink-0 rounded-full flex items-center justify-center ${
                  showResumePrompt 
                    ? 'bg-gradient-to-br from-amber-500/20 to-amber-500/5' 
                    : 'bg-gradient-to-br from-primary/20 to-primary/5'
                }`}
                animate={isPlaying ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Headphones className={`w-8 h-8 ${showResumePrompt ? 'text-amber-500' : 'text-primary'}`} />
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
                  <p className="text-[10px] text-amber-500 mt-1">
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
            
            {/* Buffering indicator */}
            <AnimatePresence>
              {isBuffering && hasStarted && (
                <motion.div
                  className="flex items-center justify-center gap-2 mb-2"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Loader2 className="w-3 h-3 text-primary animate-spin" />
                  <span className="text-xs text-muted-foreground">Buffering...</span>
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
                  onClick={() => { lightTap(); cyclePlaybackRate(); }}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/60 hover:bg-muted hover:scale-105 transition-all text-[10px] font-medium text-foreground"
                >
                  {playbackRate}x
                </button>
                
                <div className="w-px h-3 bg-border/50" />
                
                <VoiceSelector
                  selectedVoiceId={voiceId}
                  onVoiceChange={handleVoiceChange}
                  disabled={isPlaying || isTTSLoading}
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
                    className="flex-1 py-3 rounded-xl bg-amber-500 text-white font-medium"
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
                    
                    return (
                      <p
                        key={segment.id}
                        ref={isActive ? activeSegmentRef : null}
                        className={`text-sm leading-relaxed transition-all duration-300 ${
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
