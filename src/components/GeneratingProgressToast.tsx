import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface GeneratingProgressToastProps {
  topicTitle: string;
}

const loadingMessages = [
  "Analyzing key concepts...",
  "Synthesizing core principles...",
  "Building your explanation...",
  "Connecting the dots...",
  "Almost there...",
];

export const GeneratingProgressToast = ({ topicTitle }: GeneratingProgressToastProps) => {
  const [progress, setProgress] = useState(5);
  const [messageIndex, setMessageIndex] = useState(0);

  // Animate progress from 5 to ~85 over time (never hits 100 until complete)
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        // Slow down as we approach 85%
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
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center gap-2">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="h-4 w-4 text-primary" />
        </motion.div>
        <span className="font-medium text-sm">Generating AI Content</span>
      </div>
      
      <p className="text-xs text-muted-foreground line-clamp-1">
        {topicTitle}
      </p>
      
      <div className="space-y-1.5">
        <Progress value={progress} className="h-1.5" />
        <motion.p
          key={messageIndex}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="text-xs text-muted-foreground"
        >
          {loadingMessages[messageIndex]}
        </motion.p>
      </div>
    </div>
  );
};
