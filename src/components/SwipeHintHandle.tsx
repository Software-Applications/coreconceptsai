import { motion } from 'framer-motion';

interface SwipeHintHandleProps {
  direction?: 'down' | 'right';
}

export const SwipeHintHandle = ({ direction = 'down' }: SwipeHintHandleProps) => {
  const isHorizontal = direction === 'right';
  
  return (
    <div className={`flex ${isHorizontal ? 'flex-col h-full items-center justify-center px-1' : 'justify-center pt-2 pb-1'}`}>
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
          delay: 0.3, // Wait for sheet to finish opening
        }}
      />
    </div>
  );
};
