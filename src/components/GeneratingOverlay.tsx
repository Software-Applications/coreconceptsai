import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Volume2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const TRANSCRIPT_MESSAGES = [
  "Writing your personalized brief...",
  "Crafting key concepts and explanations...",
  "Building your learning experience...",
];

const AUDIO_MESSAGES = [
  "Generating high-quality narration...",
  "Creating audio with your selected voice...",
  "Almost ready to play...",
];

const ROTATION_INTERVAL = 2500;

interface GeneratingOverlayProps {
  isGenerating: boolean;
  isGeneratingAudio?: boolean;
  topicTitle?: string;
  onCancel?: () => void;
}

export const GeneratingOverlay = ({ 
  isGenerating, 
  isGeneratingAudio = false,
  topicTitle, 
  onCancel,
}: GeneratingOverlayProps) => {
  const [messageIndex, setMessageIndex] = useState(0);

  const messages = isGeneratingAudio ? AUDIO_MESSAGES : TRANSCRIPT_MESSAGES;
  const showOverlay = isGenerating || isGeneratingAudio;

  // Rotate messages while generating
  useEffect(() => {
    if (!showOverlay) {
      setMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, ROTATION_INTERVAL);

    return () => clearInterval(interval);
  }, [showOverlay, messages.length]);

  return (
    <AnimatePresence>
      {showOverlay && (
        <motion.div
          className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Cancel button - positioned below status bar area */}
          {onCancel && (
            <button
              onClick={onCancel}
              className="absolute top-14 right-4 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors z-40"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          )}

          <motion.div
            className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {isGeneratingAudio ? (
              <Volume2 className="w-10 h-10 text-primary" />
            ) : (
              <Sparkles className="w-10 h-10 text-primary" />
            )}
          </motion.div>
          
          {/* Static primary title */}
          <h2 className="text-lg font-semibold text-foreground text-center px-8 mb-1">
            {isGeneratingAudio ? "Generating Audio" : "Generating Your Brief"}
          </h2>
          {topicTitle && (
            <p className="text-sm text-primary font-medium text-center px-8 mb-4 truncate max-w-xs">
              {topicTitle}
            </p>
          )}

          {/* Progress indicator for audio generation */}
          {isGeneratingAudio && (
            <div className="w-48 mb-4">
              <Progress value={undefined} className="h-1.5 animate-pulse" />
            </div>
          )}
          
          {/* Rotating sub-copy with crossfade */}
          <div className="h-8 relative w-full flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={messageIndex}
                className="text-sm text-muted-foreground text-center px-8 absolute max-w-[280px]"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                {messages[messageIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
