import { useRef, useEffect, useCallback, useState, RefObject } from 'react';

/**
 * Configuration options for the tap vs drag hook
 */
interface TapVsDragOptions {
  /** Minimum pixels of movement before considering it a drag (default: 5) */
  dragThreshold?: number;
  /** Time in ms after drag ends to suppress clicks (default: 200) */
  clickSuppressionDelay?: number;
  /** Enable momentum scrolling for mouse drags (default: true) */
  enableMomentum?: boolean;
  /** Friction coefficient for momentum (0-1, higher = more friction, default: 0.92) */
  momentumFriction?: number;
}

/**
 * Return type of the useTapVsDrag hook
 */
interface TapVsDragResult<T extends HTMLElement> {
  /** Ref to attach to the scrollable container */
  scrollRef: RefObject<T>;
  /** Whether a drag is currently in progress */
  isDragging: boolean;
  /** Wrap onClick handlers with this to prevent clicks during/after drags */
  handleClick: (callback: () => void) => () => void;
}

/**
 * A unified hook for horizontal scrollable containers that distinguishes
 * between taps (clicks) and drags. This prevents accidental activations
 * when the user intends to scroll.
 * 
 * Features:
 * - Mouse drag scrolling with momentum
 * - Click suppression during and after drags
 * - Touch events use native scrolling
 * - Pointer capture only after drag threshold is exceeded
 * 
 * @example
 * ```tsx
 * const { scrollRef, handleClick } = useTapVsDrag<HTMLDivElement>();
 * 
 * return (
 *   <div ref={scrollRef} className="overflow-x-auto">
 *     {items.map(item => (
 *       <button onClick={handleClick(() => onSelect(item))}>
 *         {item.name}
 *       </button>
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useTapVsDrag<T extends HTMLElement>(
  options: TapVsDragOptions = {}
): TapVsDragResult<T> {
  const {
    dragThreshold = 5,
    clickSuppressionDelay = 200,
    enableMomentum = true,
    momentumFriction = 0.92,
  } = options;

  const ref = useRef<T>(null);
  const [element, setElement] = useState<T | null>(null);
  const isDraggingRef = useRef(false);
  const lastDragEndRef = useRef(0);

  // Callback ref to detect when element mounts/unmounts (e.g. inside accordions)
  const callbackRef = useCallback((node: T | null) => {
    (ref as React.MutableRefObject<T | null>).current = node;
    setElement(node);
  }, []);

  useEffect(() => {
    if (!element) return;

    let isDown = false;
    let hasDragged = false;
    let startX = 0;
    let scrollLeft = 0;
    let pointerId: number | null = null;
    let isPointerCaptured = false;

    // Velocity tracking for momentum
    let lastX = 0;
    let lastTime = 0;
    let velocity = 0;
    let animationFrameId: number | null = null;

    // Store original snap style to restore later
    let originalSnapType = '';

    const disableSnap = () => {
      originalSnapType = element.style.scrollSnapType || '';
      element.style.scrollSnapType = 'none';
    };

    const restoreSnap = () => {
      if (element && element.style) {
        element.style.scrollSnapType = originalSnapType;
      }
    };

    const applyMomentum = () => {
      if (!element || !element.style || !enableMomentum) {
        animationFrameId = null;
        return;
      }

      if (Math.abs(velocity) < 0.1) {
        velocity = 0;
        animationFrameId = null;
        element.style.cursor = 'grab';
        restoreSnap();
        return;
      }

      element.scrollLeft -= velocity * 16;
      velocity *= momentumFriction;
      animationFrameId = requestAnimationFrame(applyMomentum);
    };

    const handlePointerDown = (e: PointerEvent) => {
      // Only respond to mouse, not touch (touch uses native scrolling)
      if (e.pointerType !== 'mouse') return;
      if (e.button !== 0) return;

      // Cancel any ongoing momentum animation
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        restoreSnap();
      }

      isDown = true;
      hasDragged = false;
      isDraggingRef.current = false;
      pointerId = e.pointerId;
      isPointerCaptured = false;
      startX = e.clientX;
      scrollLeft = element.scrollLeft;

      lastX = e.clientX;
      lastTime = performance.now();
      velocity = 0;

      // Don't capture pointer yet - wait until drag threshold is exceeded
      // This allows nested buttons to receive clicks if the user doesn't drag
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDown) return;
      if (e.pointerId !== pointerId) return;

      const dx = e.clientX - startX;

      if (!hasDragged) {
        if (Math.abs(dx) > dragThreshold) {
          hasDragged = true;
          isDraggingRef.current = true;
          element.style.cursor = 'grabbing';
          disableSnap();

          // Capture pointer only after we know the user is dragging
          try {
            element.setPointerCapture(e.pointerId);
            isPointerCaptured = true;
          } catch {}
        } else {
          return;
        }
      }

      e.preventDefault();

      const now = performance.now();
      const deltaTime = now - lastTime;

      if (deltaTime > 0) {
        velocity = (e.clientX - lastX) / deltaTime;
      }

      lastX = e.clientX;
      lastTime = now;

      const walkX = dx * 1.25;
      element.scrollLeft = scrollLeft - walkX;
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!isDown) return;
      if (e.pointerId !== pointerId) return;

      isDown = false;
      pointerId = null;

      if (isPointerCaptured) {
        try {
          element.releasePointerCapture(e.pointerId);
        } catch {}
        isPointerCaptured = false;
      }

      if (hasDragged) {
        lastDragEndRef.current = Date.now();
        
        if (enableMomentum && Math.abs(velocity) > 0.1) {
          applyMomentum();
        } else {
          element.style.cursor = 'grab';
          restoreSnap();
        }
      } else {
        element.style.cursor = 'grab';
      }

      // Small delay before clearing isDragging to allow click suppression
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 10);

      hasDragged = false;
    };

    const handlePointerCancel = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;

      isDown = false;
      hasDragged = false;
      isDraggingRef.current = false;
      pointerId = null;

      if (isPointerCaptured) {
        try {
          element.releasePointerCapture(e.pointerId);
        } catch {}
        isPointerCaptured = false;
      }

      element.style.cursor = 'grab';
      restoreSnap();
    };

    // Suppress clicks that happen right after a drag ends
    const handleClickCapture = (e: MouseEvent) => {
      const timeSinceDrag = Date.now() - lastDragEndRef.current;
      if (timeSinceDrag < clickSuppressionDelay) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleDragStart = (e: DragEvent) => {
      if (hasDragged) {
        e.preventDefault();
      }
    };

    // Touch events - let native scrolling handle it
    const handleTouchStart = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        restoreSnap();
      }
    };

    element.style.cursor = 'grab';

    element.addEventListener('pointerdown', handlePointerDown);
    element.addEventListener('pointermove', handlePointerMove);
    element.addEventListener('pointerup', handlePointerUp);
    element.addEventListener('pointercancel', handlePointerCancel);
    element.addEventListener('click', handleClickCapture, true);
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('dragstart', handleDragStart);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      element.removeEventListener('pointerdown', handlePointerDown);
      element.removeEventListener('pointermove', handlePointerMove);
      element.removeEventListener('pointerup', handlePointerUp);
      element.removeEventListener('pointercancel', handlePointerCancel);
      element.removeEventListener('click', handleClickCapture, true);
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('dragstart', handleDragStart);
    };
  }, [element, dragThreshold, clickSuppressionDelay, enableMomentum, momentumFriction]);

  /**
   * Wraps a click handler to prevent it from firing during/after drags
   */
  const handleClick = useCallback(
    (callback: () => void) => {
      return () => {
        const timeSinceDrag = Date.now() - lastDragEndRef.current;
        if (!isDraggingRef.current && timeSinceDrag >= clickSuppressionDelay) {
          callback();
        }
      };
    },
    [clickSuppressionDelay]
  );

  return {
    scrollRef: callbackRef as unknown as RefObject<T>,
    isDragging: isDraggingRef.current,
    handleClick,
  };
}

/**
 * Simpler version that just returns a ref - backwards compatible with useDragScrollHorizontal
 * Use this when you don't need the handleClick wrapper
 */
export function useHorizontalScroll<T extends HTMLElement>(
  options?: TapVsDragOptions
): RefObject<T> {
  const { scrollRef } = useTapVsDrag<T>(options);
  return scrollRef;
}
