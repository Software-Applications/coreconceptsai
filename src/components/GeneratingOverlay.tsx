import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';

const LOADING_MESSAGES = [
  "Writing a concise transcript for this topic...",
  "Crafting key concepts and explanations...",
  "Preparing your personalized audio summary...",
];

const ROTATION_INTERVAL = 2000; // 2 seconds

interface GeneratingOverlayProps {
  isGenerating: boolean;
  topicTitle?: string;
  onCancel?: () => void;
}

export const GeneratingOverlay = ({ isGenerating, topicTitle, onCancel }: GeneratingOverlayProps) => {
  const [messageIndex, setMessageIndex] = useState(0);

  // Rotate messages every 2 seconds while generating
  useEffect(() => {
    if (!isGenerating) {
      setMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, ROTATION_INTERVAL);

    return () => clearInterval(interval);
  }, [isGenerating]);

  return (
    <AnimatePresence>
      {isGenerating && (
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
            <Sparkles className="w-10 h-10 text-primary" />
          </motion.div>
          
          {/* Static primary title */}
          <h2 className="text-lg font-semibold text-foreground text-center px-8 mb-1">
            Generating Your Brief
          </h2>
          {topicTitle && (
            <p className="text-sm text-primary font-medium text-center px-8 mb-4 truncate max-w-xs">
              {topicTitle}
            </p>
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
                {LOADING_MESSAGES[messageIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
