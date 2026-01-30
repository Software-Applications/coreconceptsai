import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const loadingMessages = [
  "Analyzing key concepts...",
  "Synthesizing core principles...",
  "Building your explanation...",
  "Connecting the dots...",
  "Almost there...",
];

export const GeneratingProgressToast = () => {
  const [progress, setProgress] = useState(5);
  const [messageIndex, setMessageIndex] = useState(0);

  // Animate progress from 5 to ~85 over time
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const increment = prev < 30 ? 3 : prev < 60 ? 2 : prev < 80 ? 1 : 0.5;
        return Math.min(prev + increment, 85);
      });
    }, 400);

    return () => clearInterval(progressInterval);
  }, []);

  // Cycle through loading messages
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % loadingMessages.length);
    }, 2500);

    return () => clearInterval(messageInterval);
  }, []);

  return (
    <div className="flex flex-col gap-1.5 min-w-[200px]">
      <div className="flex items-center gap-1.5">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
        </motion.div>
        <AnimatePresence mode="wait">
          <motion.span
            key={messageIndex}
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            transition={{ duration: 0.15 }}
            className="font-medium text-xs text-foreground"
          >
            {loadingMessages[messageIndex]}
          </motion.span>
        </AnimatePresence>
      </div>
      
      <Progress value={progress} className="h-0.5" />
    </div>
  );
};
