import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const LOADING_MESSAGES = [
  "Synthesizing core principles...",
  "Translating complex theories into simple insights...",
  "Distilling the essentials for you...",
];

const ROTATION_INTERVAL = 3000; // 3 seconds

interface GeneratingOverlayProps {
  isGenerating: boolean;
}

export const GeneratingOverlay = ({ isGenerating }: GeneratingOverlayProps) => {
  const [messageIndex, setMessageIndex] = useState(0);

  // Rotate messages every 3 seconds while generating
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
          <motion.div
            className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Sparkles className="w-10 h-10 text-primary" />
          </motion.div>
          
          {/* Rotating message with crossfade */}
          <div className="h-8 relative flex items-center justify-center mb-2">
            <AnimatePresence mode="wait">
              <motion.p
                key={messageIndex}
                className="text-lg font-semibold text-foreground text-center px-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {LOADING_MESSAGES[messageIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
          
          <p className="text-sm text-muted-foreground text-center px-8">
            Creating your personalized explanation
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
