import { useState, useEffect, useRef, useMemo, type MouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Play, Pause, SkipBack, SkipForward, 
  Rewind, FastForward, Headphones
} from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { FlashSummaryCard } from './FlashSummaryCard';
import { springTransition } from '@/lib/motionVariants';
import type { DailyDownloadTopic } from '@/data/dailyDownloadData';
import { generateMockTranscript, type TranscriptSegment } from '@/data/dailyDownloadData';

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
  const [mockProgress, setMockProgress] = useState(0);
  
  // Transcript scroll refs
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const activeSegmentRef = useRef<HTMLParagraphElement | null>(null);
  const dragState = useRef({ isDown: false, startY: 0, scrollTop: 0 });
  
  const {
    isPlaying,
    progress,
    playbackRate,
    toggle,
    skipForward,
    skipBackward,
    cyclePlaybackRate,
    formatTime
  } = useAudioPlayer(topic?.audioUrl || null, {
    onEnded: () => setShowFlashCard(true)
  });

  // Generate transcript for current topic
  const transcript = useMemo(() => {
    if (!topic) return [];
    return generateMockTranscript(topic);
  }, [topic]);

  // Calculate current time in seconds
  const displayProgress = progress > 0 ? progress : mockProgress;
  const currentSeconds = (displayProgress / 100) * 632;
  const totalSeconds = 632;

  // Find active transcript segment
  const activeSegmentIndex = useMemo(() => {
    return transcript.findIndex(
      seg => currentSeconds >= seg.startTime && currentSeconds < seg.endTime
    );
  }, [transcript, currentSeconds]);

  // Auto-scroll to active segment
  useEffect(() => {
    if (activeSegmentRef.current && transcriptRef.current) {
      activeSegmentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeSegmentIndex]);

  // Mock progress simulation for demo
  useEffect(() => {
    if (!isPlaying || !topic) return;
    
    const interval = setInterval(() => {
      setMockProgress(prev => {
        const next = prev + (100 / 632) * playbackRate; // Simulate 10:32 duration
        if (next >= 100) {
          setShowFlashCard(true);
          onTopicListened?.(topic.id);
          return 100;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, playbackRate, topic, onTopicListened]);

  // Reset state when topic changes
  useEffect(() => {
    setMockProgress(0);
    setShowFlashCard(false);
  }, [topic?.id]);

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
    toggle();
  };

  const handleSkip = (direction: 'forward' | 'backward') => {
    lightTap();
    if (direction === 'forward') {
      skipForward(15);
      setMockProgress(prev => Math.min(prev + (15 / 632) * 100, 100));
    } else {
      skipBackward(15);
      setMockProgress(prev => Math.max(prev - (15 / 632) * 100, 0));
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

  // Generate waveform bars
  const waveformBars = Array.from({ length: 40 }, (_, i) => ({
    height: Math.random() * 60 + 20,
    delay: i * 0.02
  }));

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
            <div className="w-full max-w-sm mx-auto mb-1">
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${displayProgress}%` }}
                />
              </div>
            </div>

            {/* Time display with speed control */}
            <div className="flex justify-between items-center w-full max-w-sm mx-auto mb-3">
              <span className="text-xs text-muted-foreground">{formatTime(currentSeconds)}</span>
              
              <button
                onClick={() => { lightTap(); cyclePlaybackRate(); }}
                className="px-3 py-1 rounded-full bg-muted/80 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                {playbackRate}x
              </button>
              
              <span className="text-xs text-muted-foreground">{formatTime(totalSeconds)}</span>
            </div>

            {/* Playback controls - compact */}
            <div className="flex items-center justify-center w-full max-w-sm mx-auto mb-4">
              <div className="flex items-center flex-1 justify-end">
                <button
                  onClick={() => handleSkip('backward')}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <SkipBack className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="mx-6">
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

              <div className="flex items-center flex-1 justify-start">
                <button
                  onClick={() => handleSkip('forward')}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <SkipForward className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
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
                            ? 'text-foreground font-medium' 
                            : isPast 
                              ? 'text-muted-foreground/60' 
                              : 'text-muted-foreground/40'
                        }`}
                      >
                        {isActive && (
                          <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full mr-2 animate-pulse" />
                        )}
                        {segment.text}
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
