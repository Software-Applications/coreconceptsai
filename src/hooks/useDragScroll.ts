import { useRef, useEffect, RefObject } from 'react';

export function useDragScroll<T extends HTMLElement>(): RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let isDown = false;
    let startX: number;
    let startY: number;
    let scrollLeft: number;
    let scrollTop: number;

    const handleMouseDown = (e: MouseEvent) => {
      // If the user is interacting with a horizontal drag-scroll region, don't start vertical drag-scroll.
      const target = e.target as HTMLElement | null;
      if (target?.closest?.('[data-drag-scroll="x"]')) return;

      isDown = true;
      element.style.cursor = 'grabbing';
      startX = e.pageX - element.offsetLeft;
      startY = e.pageY - element.offsetTop;
      scrollLeft = element.scrollLeft;
      scrollTop = element.scrollTop;
    };

    const handleMouseLeave = () => {
      isDown = false;
      element.style.cursor = 'grab';
    };

    const handleMouseUp = () => {
      isDown = false;
      element.style.cursor = 'grab';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - element.offsetLeft;
      const y = e.pageY - element.offsetTop;
      const walkX = (x - startX) * 1.5;
      const walkY = (y - startY) * 1.5;
      element.scrollLeft = scrollLeft - walkX;
      element.scrollTop = scrollTop - walkY;
    };

    element.style.cursor = 'grab';
    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mouseup', handleMouseUp);
    element.addEventListener('mousemove', handleMouseMove);

    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mouseup', handleMouseUp);
      element.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return ref;
}

export function useDragScrollHorizontal<T extends HTMLElement>(): RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let isDown = false;
    let hasDragged = false;
    let startX = 0;
    let scrollLeft = 0;
    let pointerId: number | null = null;
    
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
      element.style.scrollSnapType = originalSnapType;
    };

    const applyMomentum = () => {
      // Stop if velocity is negligible
      if (Math.abs(velocity) < 0.1) {
        velocity = 0;
        animationFrameId = null;
        element.style.cursor = 'grab';
        restoreSnap();
        return;
      }
      
      // Apply velocity to scroll position
      element.scrollLeft -= velocity * 16; // ~16ms per frame at 60fps
      
      // Apply friction/deceleration
      velocity *= 0.92;
      
      animationFrameId = requestAnimationFrame(applyMomentum);
    };

    const handlePointerDown = (e: PointerEvent) => {
      // Only respond to mouse, not touch
      if (e.pointerType !== 'mouse') return;
      // Only primary button
      if (e.button !== 0) return;

      // Cancel any ongoing momentum animation
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        restoreSnap();
      }

      isDown = true;
      hasDragged = false;
      pointerId = e.pointerId;
      startX = e.clientX;
      scrollLeft = element.scrollLeft;
      
      // Initialize velocity tracking
      lastX = e.clientX;
      lastTime = performance.now();
      velocity = 0;

      // Capture pointer so dragging continues even if cursor leaves element
      element.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDown) return;
      if (e.pointerId !== pointerId) return;

      const dx = e.clientX - startX;
      
      // Drag threshold: only start scrolling after 5px movement
      if (!hasDragged) {
        if (Math.abs(dx) > 5) {
          hasDragged = true;
          element.style.cursor = 'grabbing';
          disableSnap();
        } else {
          return; // Not dragging yet
        }
      }

      // Prevent text selection / default behaviors
      e.preventDefault();

      const now = performance.now();
      const deltaTime = now - lastTime;
      
      // Track velocity (pixels per millisecond)
      if (deltaTime > 0) {
        velocity = (e.clientX - lastX) / deltaTime;
      }
      
      lastX = e.clientX;
      lastTime = now;

      // Update scroll position
      const walkX = dx * 1.25;
      element.scrollLeft = scrollLeft - walkX;
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!isDown) return;
      if (e.pointerId !== pointerId) return;

      isDown = false;
      pointerId = null;

      // Release pointer capture
      try {
        element.releasePointerCapture(e.pointerId);
      } catch {}

      // Only apply momentum if we actually dragged
      if (hasDragged && Math.abs(velocity) > 0.1) {
        applyMomentum();
      } else {
        element.style.cursor = 'grab';
        if (hasDragged) restoreSnap();
      }
      
      hasDragged = false;
    };

    const handlePointerCancel = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      
      isDown = false;
      hasDragged = false;
      pointerId = null;
      element.style.cursor = 'grab';
      restoreSnap();
    };

    const handleDragStart = (e: DragEvent) => {
      // Prevent image/button drag ghosting while we "grab-scroll"
      if (hasDragged) {
        e.preventDefault();
      }
    };

    // Touch events - let native scrolling handle it
    const handleTouchStart = () => {
      // Cancel any ongoing momentum animation so touch scrolling feels native
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        restoreSnap();
      }
    };

    element.style.cursor = 'grab';

    // Pointer events for custom drag with momentum (mouse only)
    element.addEventListener('pointerdown', handlePointerDown);
    element.addEventListener('pointermove', handlePointerMove);
    element.addEventListener('pointerup', handlePointerUp);
    element.addEventListener('pointercancel', handlePointerCancel);

    // Touch - just cancel momentum, let native scrolling work
    element.addEventListener('touchstart', handleTouchStart, { passive: true });

    element.addEventListener('dragstart', handleDragStart);

    return () => {
      // Cleanup animation frame
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      
      element.removeEventListener('pointerdown', handlePointerDown);
      element.removeEventListener('pointermove', handlePointerMove);
      element.removeEventListener('pointerup', handlePointerUp);
      element.removeEventListener('pointercancel', handlePointerCancel);
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  return ref;
}
