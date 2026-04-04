import { useState, useEffect, useRef, useMemo, useCallback, type MouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Headphones, SkipBack, SkipForward, Sparkles } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { useVoicePreference } from '@/hooks/useVoicePreference';
import { useAudioProgress } from '@/hooks/useAudioProgress';
import { useStreamingContent } from '@/hooks/useStreamingContent';
import { useSwipeToDismiss } from '@/hooks/useSwipeToDismiss';
import { useWordTimings } from '@/hooks/useWordTimings';

import { VoiceSelector } from './VoiceSelector';
import { springTransition } from '@/lib/motionVariants';
import { AIBadge } from './AIBadge';
import { GeneratingOverlay } from './GeneratingOverlay';
import { SwipeHintHandle } from './SwipeHintHandle';
import { RetryErrorModal } from './RetryErrorModal';
import type { DailyDownloadTopic } from '@/hooks/useTopics';

// ============================================================================
// Configuration Constants
// ============================================================================
const HIGHLIGHT_LEAD_MS = 180;
const PARAGRAPH_MIN_LENGTH = 500;
const SENTENCE_CHUNK_SIZE = 400;
const PLAYBACK_RATES = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0] as const;
const WAVEFORM_BAR_COUNT = 40;
const PROGRESS_SAVE_INTERVAL_MS = 5000;

// Stable waveform bars (deterministic, no random on remount)
const WAVEFORM_BARS = Array.from({ length: WAVEFORM_BAR_COUNT }, (_, i) => ({
  height: 20 + (Math.sin(i * 0.7) + 1) * 30 + (Math.cos(i * 1.3) + 1) * 15,
  delay: i * 0.02
}));

// ============================================================================
// Component
// ============================================================================
interface DailyDownloadPlayerProps {
  topic: DailyDownloadTopic | null;
  subjectName: string;
  isOpen: boolean;
  onClose: () => void;
  onTopicListened?: (topicId: string) => void;
}

export const DailyDownloadPlayer = ({
  topic,
  subjectName,
  isOpen,
  onClose,
  onTopicListened
}: DailyDownloadPlayerProps) => {
  const { lightTap, mediumTap, successNotification } = useHaptics();
  
  const [hasStarted, setHasStarted] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const { saveProgress, getProgress, clearProgress } = useAudioProgress();
  
  // Voice preference hook
  const { voiceId, setVoiceId } = useVoicePreference();
  
  // Audio state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [isChangingVoice, setIsChangingVoice] = useState(false);

  // Keep transcript highlighting synced tightly to playback without heavy listeners
  const stopTimeSync = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const startTimeSync = useCallback(() => {
    stopTimeSync();

    const tick = () => {
      const audio = audioRef.current;
      if (!audio) return;

      // Always read the latest audio time (no incremental drift)
      setCurrentTimeMs(audio.currentTime * 1000);

      if (!audio.paused && !audio.ended) {
        animationFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animationFrameRef.current = requestAnimationFrame(tick);
  }, [stopTimeSync]);
  
  // Playback rate
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  
  // Saved position for voice change resume
  const savedPositionRef = useRef<number>(0);
  const wasPlayingRef = useRef<boolean>(false);
  
  // Transcript scroll refs
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const activeSegmentRef = useRef<HTMLParagraphElement | null>(null);
  const dragState = useRef({ isDown: false, startY: 0, scrollTop: 0, didDrag: false });
  const lastSaveTime = useRef<number>(0);
  
  // Streaming content hook
  const streamingContent = useStreamingContent({
    onError: (error) => {
      // Don't show toast - we'll show the retry modal instead
      console.log('[Player] Generation error:', error);
    },
  });

  // Show retry modal when there's an error
  const showRetryModal = Boolean(streamingContent.error && !streamingContent.isGenerating);

  // Helper to strip stage directions/tags from transcript text
  const stripTags = useCallback((text: string): string => {
    return text
      .replace(/<\/?transcript>/gi, '')
      .replace(/\[(?:PAUSE|PROMPT|NOTE|DIRECTION)[^\]]*\]/gi, '')
      .replace(/\n\n+/g, '\u0000')
      .replace(/\n/g, ' ')
      .replace(/\u0000/g, '\n\n')
      .replace(/ {2,}/g, ' ')
      .trim();
  }, []);

  // Full transcript text (cleaned)
  const fullTranscriptText = useMemo(() => {
    return stripTags(streamingContent.fullTranscript);
  }, [streamingContent.fullTranscript, stripTags]);

  // Parse transcript into paragraphs for display with fallback splitting
  const paragraphs = useMemo(() => {
    if (!fullTranscriptText) return [];
    
    // Try splitting on double newlines first
    let parts = fullTranscriptText.split(/\n\n+/).filter(p => p.trim());
    
    // Fallback: if only 1 paragraph and text is long, try single newlines
    if (parts.length === 1 && fullTranscriptText.length > PARAGRAPH_MIN_LENGTH) {
      parts = fullTranscriptText.split(/\n/).filter(p => p.trim());
    }
    
    // Final fallback: split long text into chunks by sentences
    if (parts.length === 1 && fullTranscriptText.length > PARAGRAPH_MIN_LENGTH) {
      const sentences = fullTranscriptText.match(/[^.!?]+[.!?]+\s*/g) || [fullTranscriptText];
      parts = [];
      let currentParagraph = '';
      
      for (const sentence of sentences) {
        if ((currentParagraph + sentence).length > SENTENCE_CHUNK_SIZE) {
          if (currentParagraph.trim()) parts.push(currentParagraph.trim());
          currentParagraph = sentence;
        } else {
          currentParagraph += sentence;
        }
      }
      if (currentParagraph.trim()) parts.push(currentParagraph.trim());
    }
    
    return parts;
  }, [fullTranscriptText]);

  // Use word-level timing for accurate transcript highlighting
  // This accounts for pause markers and uses binary search for O(log n) lookup
  const { activeSegmentIndex, activeWordIndex } = useWordTimings({
    rawTranscript: streamingContent.fullTranscript,
    actualDurationMs: durationMs,
    currentTimeMs: currentTimeMs + HIGHLIGHT_LEAD_MS,
    playbackRate,
    hasStarted,
  });

  // Calculate current character index for progress saving (approximate)
  const currentCharIndex = useMemo(() => {
    if (!durationMs || !fullTranscriptText.length) return 0;
    const progress = currentTimeMs / durationMs;
    return Math.floor(progress * fullTranscriptText.length);
  }, [currentTimeMs, durationMs, fullTranscriptText.length]);

  // Progress percentage for progress bar
  const progress = useMemo(() => {
    if (!durationMs) return 0;
    return (currentTimeMs / durationMs) * 100;
  }, [currentTimeMs, durationMs]);

  // Format time helper
  const formatTime = useCallback((ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Handle audio end
  const handleAudioEnd = useCallback(() => {
    setIsPlaying(false);
    if (topic) {
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        onClose();
      }, 1500);
      onTopicListened?.(topic.id);
      clearProgress(topic.id);
    }
  }, [topic, onTopicListened, clearProgress, onClose]);

  // Setup audio element when blob URL is available
  useEffect(() => {
    if (!streamingContent.audioBlobUrl) return;
    
    const audio = new Audio(streamingContent.audioBlobUrl);
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      setDurationMs(audio.duration * 1000);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      startTimeSync();
    };

    const handlePause = () => {
      setIsPlaying(false);
      stopTimeSync();
      setCurrentTimeMs(audio.currentTime * 1000);
    };

    const handleSeek = () => {
      setCurrentTimeMs(audio.currentTime * 1000);
    };

    const handleEnded = () => {
      stopTimeSync();
      handleAudioEnd();
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('seeking', handleSeek);
    audio.addEventListener('seeked', handleSeek);
    audio.addEventListener('ended', handleEnded);
    
    audio.playbackRate = playbackRate;
    
    if (savedPositionRef.current > 0) {
      audio.currentTime = savedPositionRef.current / 1000;
      savedPositionRef.current = 0;
      
      if (wasPlayingRef.current) {
        wasPlayingRef.current = false;
        audio.play().catch(console.error);
      }
    }
    
    return () => {
      stopTimeSync();
      audio.pause();

      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('seeking', handleSeek);
      audio.removeEventListener('seeked', handleSeek);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [streamingContent.audioBlobUrl, handleAudioEnd, playbackRate, startTimeSync, stopTimeSync]);

  // Handle voice change - regenerate audio and resume from current position
  const handleVoiceChange = useCallback(async (newVoiceId: string) => {
    if (!streamingContent.transcriptReady) return;
    
    setVoiceId(newVoiceId);
    setIsChangingVoice(true);
    
    if (audioRef.current) {
      savedPositionRef.current = audioRef.current.currentTime * 1000;
      wasPlayingRef.current = !audioRef.current.paused;
      audioRef.current.pause();
    }
    
    console.log(`[Player] Changing voice to ${newVoiceId}, resume from ${savedPositionRef.current}ms`);
    
    try {
      await streamingContent.regenerateAudioWithVoice(newVoiceId, 1.0, savedPositionRef.current);
    } finally {
      setIsChangingVoice(false);
    }
  }, [setVoiceId, streamingContent]);

  // Cycle playback rate
  const cyclePlaybackRate = useCallback(() => {
    lightTap();
    setPlaybackRate(currentRate => {
      const currentIndex = PLAYBACK_RATES.indexOf(currentRate as typeof PLAYBACK_RATES[number]);
      const nextIndex = (currentIndex + 1) % PLAYBACK_RATES.length;
      const newRate = PLAYBACK_RATES[nextIndex];
      
      if (audioRef.current) {
        audioRef.current.playbackRate = newRate;
      }
      
      return newRate;
    });
  }, [lightTap]);

  // Play/Pause handler
  const handlePlayPause = useCallback(() => {
    mediumTap();
    
    if (!audioRef.current) return;
    
    if (!hasStarted) {
      setHasStarted(true);
      setShowResumePrompt(false);
    }
    
    if (audioRef.current.paused) {
      audioRef.current.play().catch(console.error);
    } else {
      audioRef.current.pause();
    }
  }, [hasStarted, mediumTap]);

  // Seek to position
  const seekTo = useCallback((percentage: number) => {
    if (!audioRef.current || !durationMs) return;
    const targetMs = (percentage / 100) * durationMs;
    audioRef.current.currentTime = targetMs / 1000;
  }, [durationMs]);

  // Skip forward/back
  const skip = useCallback((seconds: number) => {
    if (!audioRef.current) return;
    lightTap();
    const newTime = Math.max(0, Math.min(audioRef.current.duration, audioRef.current.currentTime + seconds));
    audioRef.current.currentTime = newTime;
  }, [lightTap]);

  // Auto-scroll to active segment
  useEffect(() => {
    if (activeSegmentRef.current && transcriptRef.current) {
      activeSegmentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeSegmentIndex]);

  // Track which topic we're generating for
  const generatingForTopicId = useRef<string | null>(null);
  const previousTopicId = useRef<string | null>(null);

  // Auto-generate content when topic is opened
  useEffect(() => {
    if (streamingContent.audioReady || streamingContent.transcriptReady) return;
    if (streamingContent.isGenerating || streamingContent.isAudioGenerating) return;
    
    if (isOpen && topic) {
      if (generatingForTopicId.current === topic.id) return;
      
      console.log('[Player] Starting generation for:', topic.title);
      generatingForTopicId.current = topic.id;
      
      streamingContent.startGeneration({
        topicId: topic.id,
        topicTitle: topic.title,
        topicDescription: topic.description,
        subjectName,
        voiceId,
      });
    }
  }, [isOpen, topic?.id, streamingContent.audioReady, streamingContent.transcriptReady, 
      streamingContent.isGenerating, streamingContent.isAudioGenerating, subjectName, voiceId]);

  // Destructure cancel for stable dependency
  const cancelGeneration = streamingContent.cancel;

  // Reset state when topic changes
  useEffect(() => {
    if (previousTopicId.current !== null && previousTopicId.current !== topic?.id) {
      console.log('[Player] Topic changed, resetting');
      cancelGeneration();
      generatingForTopicId.current = null;
      setShowFlashCard(false);
      setHasStarted(false);
      setShowResumePrompt(false);
      setIsPlaying(false);
      setCurrentTimeMs(0);
      savedPositionRef.current = 0;
      wasPlayingRef.current = false;
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    }
    
    previousTopicId.current = topic?.id ?? null;
    
    if (topic) {
      const savedProgress = getProgress(topic.id);
      if (savedProgress !== null && savedProgress > 0) {
        setShowResumePrompt(true);
      }
    }
  }, [topic?.id, cancelGeneration, getProgress]);

  // Auto-save progress periodically while playing
  useEffect(() => {
    if (!isPlaying || !topic) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastSaveTime.current > PROGRESS_SAVE_INTERVAL_MS) {
        saveProgress(topic.id, currentCharIndex);
        lastSaveTime.current = now;
      }
    }, PROGRESS_SAVE_INTERVAL_MS);
    
    return () => clearInterval(interval);
  }, [isPlaying, topic, currentCharIndex, saveProgress]);

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
    dragState.current.isDown = false;
  };

  // Handle resume from saved position
  const handleResume = useCallback(() => {
    mediumTap();
    setHasStarted(true);
    setShowResumePrompt(false);
    
    if (topic && audioRef.current) {
      const savedCharIndex = getProgress(topic.id);
      if (savedCharIndex !== null && savedCharIndex > 0 && fullTranscriptText.length > 0) {
        const percentage = (savedCharIndex / fullTranscriptText.length) * 100;
        seekTo(percentage);
      }
      audioRef.current.play().catch(console.error);
    }
  }, [topic, getProgress, fullTranscriptText.length, seekTo, mediumTap]);

  // Handle start fresh
  const handleStartFresh = useCallback(() => {
    mediumTap();
    setHasStarted(true);
    setShowResumePrompt(false);
    if (topic) {
      clearProgress(topic.id);
    }
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
    }
  }, [topic, clearProgress, mediumTap]);

  const handleDismissFlashCard = useCallback(() => {
    successNotification();
    setShowFlashCard(false);
    if (topic) {
      clearProgress(topic.id);
    }
    onClose();
  }, [topic, clearProgress, onClose, successNotification]);

  const handlePinFlashCard = useCallback(() => {
    if (topic) {
      successNotification();
      onPinCard(topic);
      setShowFlashCard(false);
      clearProgress(topic.id);
      onClose();
    }
  }, [topic, onPinCard, clearProgress, onClose, successNotification]);

  const { dragProps: swipeDragProps, backdropOpacity } = useSwipeToDismiss({
    onDismiss: onClose,
    threshold: 120,
  });

  if (!topic || !isOpen) return null;

  const showGeneratingOverlay = streamingContent.isGenerating || streamingContent.isAudioGenerating || isChangingVoice;

  return (
    <motion.div
      className="absolute inset-0 z-50 bg-background flex flex-col"
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: backdropOpacity, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={springTransition}
      {...swipeDragProps}
    >
      {/* Drag Handle */}
      <SwipeHintHandle direction="down" />

      {/* Header */}
      <header className="flex items-center justify-between p-4 pt-8 sm:pt-8">
        <div className="w-10" />
        <div className="text-center">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center justify-center gap-1.5">
            Core Concepts <AIBadge size="sm" />
          </p>
          <p className="text-sm text-primary font-medium">{subjectName}</p>
        </div>
        <button
          onClick={() => { lightTap(); onClose(); }}
          className="p-2 -mr-2 rounded-full hover:bg-muted transition-colors"
        >
          <X className="w-6 h-6 text-foreground" />
        </button>
      </header>

      {/* Generating overlay */}
      <GeneratingOverlay 
        isGenerating={streamingContent.isGenerating} 
        isGeneratingAudio={streamingContent.isAudioGenerating || isChangingVoice}
        topicTitle={topic.title} 
        onCancel={() => {
          streamingContent.cancel();
          onClose();
        }}
      />

      {/* Retry error modal */}
      <RetryErrorModal
        isOpen={showRetryModal}
        errorMessage={streamingContent.error || "Failed to stream content"}
        onRetry={() => {
          streamingContent.retryGeneration();
        }}
        onCancel={() => {
          streamingContent.cancel();
          onClose();
        }}
      />

      {/* Main content - only show when audio is ready */}
      {streamingContent.audioReady && !showGeneratingOverlay && (
        <div className="flex-1 flex flex-col px-6 overflow-hidden">
          {/* Compact player section */}
          <div className="flex items-center gap-4 py-4">
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

            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-foreground truncate">
                {topic.title}
              </h1>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {topic.description}
              </p>
            </div>
          </div>

          {/* Waveform visualization */}
          <div className="flex items-center justify-center gap-0.5 h-10 mb-3 relative">
            {hasStarted ? (
              WAVEFORM_BARS.map((bar, i) => (
                <motion.div
                  key={i}
                  className="w-1 rounded-full bg-primary/60"
                  animate={isPlaying ? {
                    height: [bar.height * 0.2, bar.height * 0.6, bar.height * 0.3, bar.height * 0.5, bar.height * 0.2],
                  } : { height: bar.height * 0.3 }}
                  transition={isPlaying ? {
                    duration: 1,
                    repeat: Infinity,
                    delay: bar.delay,
                    ease: "easeInOut"
                  } : { duration: 0.2 }}
                />
              ))
            ) : (
              WAVEFORM_BARS.map((bar, i) => (
                <div
                  key={i}
                  className="w-1 bg-muted-foreground/20 rounded-full"
                  style={{ height: bar.height * 0.3 }}
                />
              ))
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-sm mx-auto mb-2">
            <div 
              className="h-2 bg-muted rounded-full overflow-visible relative cursor-pointer group"
              onClick={(e) => {
                if (!hasStarted) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const percentage = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                lightTap();
                seekTo(percentage);
              }}
            >
              <div className="absolute inset-y-0 -inset-x-0 py-2 -my-2" />
              
              <motion.div 
                className="h-full bg-primary rounded-full pointer-events-none"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1, ease: "linear" }}
              />
              
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full shadow-md border-2 border-background pointer-events-none group-hover:scale-125 transition-transform"
                style={{ left: `calc(${Math.min(progress, 98)}% - 8px)` }}
              />
            </div>
          </div>

          {/* Time display with controls */}
          <div className="flex justify-between items-center w-full max-w-sm mx-auto mb-4">
            <span className="text-sm font-medium text-foreground tabular-nums">
              {formatTime(currentTimeMs)}
            </span>
            
            <div className="flex items-center gap-3">
              <button
                onClick={cyclePlaybackRate}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/60 hover:bg-muted hover:scale-105 transition-all text-[10px] font-medium text-foreground"
              >
                {playbackRate}x
              </button>
              
              <div className="w-px h-3 bg-border/50" />
              
              <VoiceSelector
                selectedVoiceId={voiceId}
                onVoiceChange={handleVoiceChange}
                disabled={isChangingVoice}
              />
            </div>
            
            <span className="text-sm text-muted-foreground tabular-nums">
              {formatTime(durationMs)}
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
                onClick={() => skip(-15)}
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
                disabled={!streamingContent.audioReady}
                className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg disabled:opacity-50"
                whileTap={{ scale: 0.9 }}
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8" />
                ) : (
                  <Play className="w-8 h-8 ml-1" />
                )}
              </motion.button>

              {/* Skip forward 15s */}
              <motion.button
                onClick={() => skip(15)}
                className="w-12 h-12 rounded-full bg-muted text-foreground flex flex-col items-center justify-center relative"
                whileTap={{ scale: 0.9 }}
                aria-label="Skip forward 15 seconds"
              >
                <SkipForward className="w-5 h-5" />
                <span className="text-[10px] font-semibold -mt-0.5">15</span>
              </motion.button>
            </div>
          )}

          {/* Transcript Section */}
          <div className="flex items-center gap-2 mb-3 mt-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Transcript
            </h3>
            <div className="flex-1 h-px bg-border" />
          </div>
          
          <div 
            ref={transcriptRef}
            className="flex-1 overflow-y-auto scrollbar-hide pb-8 cursor-grab select-none"
            onMouseDown={handleTranscriptMouseDown}
            onMouseMove={handleTranscriptMouseMove}
            onMouseUp={handleTranscriptMouseUp}
            onMouseLeave={handleTranscriptMouseUp}
          >
            <div className="space-y-6">
              {paragraphs.map((paragraph, index) => {
                const isActive = index === activeSegmentIndex;
                const words = isActive ? paragraph.split(/\s+/) : [];
                
                return (
                  <p
                    key={index}
                    ref={isActive ? activeSegmentRef : null}
                    className={`text-sm leading-relaxed transition-all duration-300 ${
                      isActive 
                        ? 'text-foreground' 
                        : hasStarted && index < activeSegmentIndex
                          ? 'text-muted-foreground/60'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {isActive ? (() => {
                      const splitIndex = Math.max(0, activeWordIndex + 1);
                      const completed = words.slice(0, splitIndex).join(' ');
                      const remaining = words.slice(splitIndex).join(' ');

                      return (
                        <>
                          {completed && (
                            <span className="text-primary font-medium">
                              {completed}{remaining ? ' ' : ''}
                            </span>
                          )}
                          {remaining && (
                            <span className="text-foreground">{remaining}</span>
                          )}
                        </>
                      );
                    })() : paragraph}
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            className="absolute inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="text-6xl mb-4"
            >
              🎉
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl font-bold text-foreground"
            >
              Great job!
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground"
            >
              You completed this topic
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flash card modal */}
      <AnimatePresence>
        {showFlashCard && streamingContent.flashSummary && (
          <motion.div
            className="absolute inset-0 bg-background/95 backdrop-blur-sm flex flex-col z-50"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-sm">
                <FlashSummaryCard
                  flashSummary={{
                    id: streamingContent.flashSummary.id,
                    topicId: topic.id,
                    visualType: streamingContent.flashSummary.visual_type as 'diagram' | 'formula' | 'analogy',
                    visualContent: streamingContent.flashSummary.visual_content,
                    bulletPoints: streamingContent.flashSummary.bullet_points as [string, string, string],
                    difficulty: streamingContent.flashSummary.difficulty as 'easy' | 'medium' | 'hard',
                  }}
                  topicTitle={topic.title}
                  onDismiss={handleDismissFlashCard}
                  onPin={handlePinFlashCard}
                />
              </div>
              
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
