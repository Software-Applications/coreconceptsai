import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

interface HeroIntroProps {
  onStartExploring: () => void;
}

export const HeroIntro = forwardRef<HTMLDivElement, HeroIntroProps>(
  ({ onStartExploring }, ref) => {
    return (
      <motion.div
        ref={ref}
        className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-lg font-bold text-foreground mb-2">
          Master the Fundamentals
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Tough topics shouldn't be a barrier to your progress. Our AI breaks down high-level academic concepts into simple, digestible explanations. It's the "Aha!" moment you've been looking for, designed to help you learn—and retain—better.
        </p>
        <button
          onClick={onStartExploring}
          className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Start Exploring
          <motion.span
            animate={{ y: [0, 3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <ArrowDown className="w-4 h-4" />
          </motion.span>
        </button>
      </motion.div>
    );
  }
);

HeroIntro.displayName = 'HeroIntro';
