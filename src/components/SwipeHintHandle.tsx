import { motion } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface SwipeHintHandleProps {
  direction?: 'down' | 'right';
}

export const SwipeHintHandle = ({ direction = 'down' }: SwipeHintHandleProps) => {
  const isHorizontal = direction === 'right';
  const ArrowIcon = isHorizontal ? ChevronRight : ChevronDown;
  
  return (
    <div className={`flex ${isHorizontal ? 'flex-col h-full items-center justify-center px-1' : 'flex-col items-center pt-2 pb-0.5'}`}>
      {/* Handle bar */}
      <motion.div 
        className={`${isHorizontal ? 'w-1 h-10' : 'w-10 h-1'} bg-muted-foreground/30 rounded-full`}
        initial={{ scale: 1, opacity: 0.3 }}
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 0.6,
          ease: "easeInOut",
          delay: 0.3,
        }}
      />
      
      {/* Arrow hint that fades out */}
      <motion.div
        initial={{ opacity: 0, y: isHorizontal ? 0 : -2, x: isHorizontal ? -2 : 0 }}
        animate={{ 
          opacity: [0, 0.5, 0.5, 0],
          y: isHorizontal ? 0 : [-2, 2, 4, 6],
          x: isHorizontal ? [-2, 2, 4, 6] : 0,
        }}
        transition={{
          duration: 1.2,
          ease: "easeOut",
          delay: 0.4,
          times: [0, 0.2, 0.6, 1],
        }}
        className="text-muted-foreground"
      >
        <ArrowIcon className="w-4 h-4" strokeWidth={2.5} />
      </motion.div>
    </div>
  );
};
