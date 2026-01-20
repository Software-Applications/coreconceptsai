import { useState, useEffect, useRef, useMemo, useCallback, type MouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Play, Pause, Headphones
} from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { FlashSummaryCard } from './FlashSummaryCard';
import { springTransition } from '@/lib/motionVariants';
import type { DailyDownloadTopic } from '@/data/dailyDownloadData';
import { generateMockTranscript, type TranscriptSegment, type TranscriptWord } from '@/data/dailyDownloadData';

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
  
  // Transcript scroll refs
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const activeSegmentRef = useRef<HTMLParagraphElement | null>(null);
  const dragState = useRef({ isDown: false, startY: 0, scrollTop: 0 });
  
  const handleSpeechEnd = useCallback(() => {
    if (topic) {
      setShowFlashCard(true);
      onTopicListened?.(topic.id);
    }
  }, [topic, onTopicListened]);

  const {
    isPlaying,
    isPaused,
    isSpeaking,
    currentCharIndex,
    progress,
    playbackRate,
    speak,
    pause,
    resume,
    stop,
    cyclePlaybackRate
  } = useSpeechSynthesis({
    onEnd: handleSpeechEnd
  });

  // Generate transcript for current topic
  const transcript = useMemo(() => {
    if (!topic) return [];
    return generateMockTranscript(topic);
  }, [topic]);

  // Get full transcript text for speech
  const fullTranscriptText = useMemo(() => {
    return transcript.map(seg => seg.text).join(' ');
  }, [transcript]);

  // Estimate total duration based on text length and speaking rate (~150 words/min)
  const estimatedDuration = useMemo(() => {
    const wordCount = fullTranscriptText.split(/\s+/).length;
    return Math.max((wordCount / 150) * 60, 60); // At least 60 seconds
  }, [fullTranscriptText]);

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

  // Reset state when topic changes
  useEffect(() => {
    stop();
    setShowFlashCard(false);
    setHasStarted(false);
  }, [topic?.id, stop]);

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
      // First time playing - start speech
      setHasStarted(true);
      speak(fullTranscriptText);
    } else if (isPlaying) {
      pause();
    } else if (isPaused) {
      resume();
    } else {
      // Restart from beginning
      speak(fullTranscriptText);
    }
  };

  const handleDismissFlashCard = () => {
    successNotification();
    setShowFlashCard(false);
    onClose();
  };

  const handlePinFlashCard = () => {
    if (topic) {
      successNotification();
      onPinCard(topic);
      setShowFlashCard(false);
      onClose();
    }
  };

  // Generate waveform bars - memoized to prevent re-renders
  const waveformBars = useMemo(() => 
    Array.from({ length: 40 }, (_, i) => ({
      height: Math.random() * 60 + 20,
      delay: i * 0.02
    })), []);

  if (!topic) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-background flex flex-col"
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={springTransition}
        >
          {/* Header */}
          <header className="flex items-center justify-between p-4 pt-safe">
            <button
              onClick={() => { lightTap(); onClose(); }}
              className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-6 h-6 text-foreground" />
            </button>
            <div className="text-center">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Daily Download
              </p>
              <p className="text-sm text-primary font-medium">{subjectName}</p>
            </div>
            <div className="w-10" /> {/* Spacer for centering */}
          </header>

          {/* Main content */}
          <div className="flex-1 flex flex-col px-6 overflow-hidden">
            {/* Compact player section */}
            <div className="flex items-center gap-4 py-4">
              {/* Topic icon - smaller */}
              <motion.div
                className="w-16 h-16 shrink-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
                animate={isPlaying ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Headphones className="w-8 h-8 text-primary" />
              </motion.div>

              {/* Title and description */}
              <div className="flex-1 min-w-0">
                <h1 className="text-base font-bold text-foreground truncate">
                  {topic.title}
                </h1>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {topic.description}
                </p>
              </div>
            </div>

            {/* Waveform visualization - compact */}
            <div className="flex items-center justify-center gap-0.5 h-10 mb-3">
              {waveformBars.map((bar, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-primary/60 rounded-full"
                  animate={isPlaying ? {
                    height: [bar.height * 0.2, bar.height * 0.6, bar.height * 0.3, bar.height * 0.5, bar.height * 0.2],
                  } : { height: bar.height * 0.2 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: bar.delay,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-sm mx-auto mb-2">
              <div className="h-2 bg-muted rounded-full overflow-hidden relative">
                <motion.div 
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1, ease: "linear" }}
                />
                {/* Progress knob */}
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full shadow-md border-2 border-background"
                  style={{ left: `calc(${Math.min(progress, 98)}% - 8px)` }}
                />
              </div>
            </div>

            {/* Time display with speed control */}
            <div className="flex justify-between items-center w-full max-w-sm mx-auto mb-4">
              <span className="text-sm font-medium text-foreground tabular-nums">
                {formatTime(currentSeconds)}
              </span>
              
              <button
                onClick={() => { lightTap(); cyclePlaybackRate(); }}
                className="px-3 py-1.5 rounded-full bg-muted text-xs font-semibold text-foreground hover:bg-muted/80 transition-colors"
              >
                {playbackRate}x
              </button>
              
              <span className="text-sm text-muted-foreground tabular-nums">
                {formatTime(estimatedDuration)}
              </span>
            </div>

            {/* Playback controls - compact (skip buttons removed - Web Speech API doesn't support seeking) */}
            <div className="flex items-center justify-center w-full max-w-sm mx-auto mb-4">
              <motion.button
                onClick={handlePlayPause}
                className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
                whileTap={{ scale: 0.9 }}
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7" />
                ) : (
                  <Play className="w-7 h-7 ml-0.5" />
                )}
              </motion.button>
            </div>

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
      )}
    </AnimatePresence>
  );
};
