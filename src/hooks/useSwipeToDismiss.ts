import { useState, useCallback } from 'react';
import { PanInfo } from 'framer-motion';

interface UseSwipeToDismissOptions {
  onDismiss: () => void;
  threshold?: number; // Distance in px to trigger dismiss
  velocityThreshold?: number; // Velocity to trigger dismiss regardless of distance
  direction?: 'down' | 'right' | 'left'; // Which direction triggers dismiss
}

export const useSwipeToDismiss = ({
  onDismiss,
  threshold = 100,
  velocityThreshold = 500,
  direction = 'down'
}: UseSwipeToDismissOptions) => {
  const [dragOffset, setDragOffset] = useState(0);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const offset = direction === 'down' ? info.offset.y : 
                     direction === 'right' ? info.offset.x : 
                     -info.offset.x;
      const velocity = direction === 'down' ? info.velocity.y : 
                       direction === 'right' ? info.velocity.x : 
                       -info.velocity.x;

      // Dismiss if dragged past threshold or with enough velocity
      if (offset > threshold || velocity > velocityThreshold) {
        onDismiss();
      }
      
      setDragOffset(0);
    },
    [onDismiss, threshold, velocityThreshold, direction]
  );

  const handleDrag = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const offset = direction === 'down' ? info.offset.y : 
                     direction === 'right' ? info.offset.x : 
                     -info.offset.x;
      // Only track positive offset (dragging in dismiss direction)
      setDragOffset(Math.max(0, offset));
    },
    [direction]
  );

  // Calculate opacity based on drag offset for visual feedback
  const dismissProgress = Math.min(dragOffset / threshold, 1);
  const backdropOpacity = 1 - (dismissProgress * 0.5);

  const dragProps = {
    drag: direction === 'down' ? 'y' as const : 'x' as const,
    dragConstraints: { top: 0, left: 0, right: 0, bottom: 0 },
    dragElastic: { 
      top: 0, 
      bottom: direction === 'down' ? 0.8 : 0, 
      left: direction === 'left' ? 0.8 : 0,
      right: direction === 'right' ? 0.8 : 0 
    },
    onDrag: handleDrag,
    onDragEnd: handleDragEnd,
  };

  return {
    dragProps,
    dragOffset,
    dismissProgress,
    backdropOpacity,
  };
};
