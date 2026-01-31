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
    let startX = 0;
    let scrollLeft = 0;
    
    // Velocity tracking for momentum
    let lastX = 0;
    let lastTime = 0;
    let velocity = 0;
    let animationFrameId: number | null = null;

    const applyMomentum = () => {
      // Stop if velocity is negligible
      if (Math.abs(velocity) < 0.1) {
        velocity = 0;
        animationFrameId = null;
        element.style.cursor = 'grab';
        return;
      }
      
      // Apply velocity to scroll position
      element.scrollLeft -= velocity * 16; // ~16ms per frame at 60fps
      
      // Apply friction/deceleration
      velocity *= 0.92;
      
      animationFrameId = requestAnimationFrame(applyMomentum);
    };

    const handlePointerDown = (e: PointerEvent) => {
      // Only handle mouse events - let touch/pen use native momentum scrolling
      if (e.pointerType !== 'mouse') return;
      if (e.button !== 0) return;

      // Cancel any ongoing momentum animation
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }

      e.stopPropagation();
      e.preventDefault();

      isDown = true;
      startX = e.clientX;
      scrollLeft = element.scrollLeft;
      
      // Initialize velocity tracking
      lastX = e.clientX;
      lastTime = performance.now();
      velocity = 0;

      element.style.cursor = 'grabbing';
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDown) return;
      if (e.pointerType !== 'mouse') return;

      e.stopPropagation();
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
      const walkX = (e.clientX - startX) * 1.25;
      element.scrollLeft = scrollLeft - walkX;
    };

    const endPointerDrag = (e?: PointerEvent) => {
      if (!isDown) return;
      if (e && e.pointerType !== 'mouse') return;

      isDown = false;
      
      // Start momentum animation if there's velocity
      if (Math.abs(velocity) > 0.1) {
        applyMomentum();
      } else {
        element.style.cursor = 'grab';
      }
    };

    const handleDragStart = (e: DragEvent) => {
      // Prevent image/button drag ghosting while we "grab-scroll"
      e.preventDefault();
    };

    element.style.cursor = 'grab';

    // Only use mouse events for custom drag - let touch use native scrolling
    element.addEventListener('pointerdown', handlePointerDown, { passive: false });
    element.addEventListener('pointermove', handlePointerMove, { passive: false });
    element.addEventListener('pointerup', endPointerDrag);
    element.addEventListener('pointercancel', endPointerDrag);
    element.addEventListener('pointerleave', endPointerDrag);

    element.addEventListener('dragstart', handleDragStart);

    return () => {
      // Cleanup animation frame
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      
      element.removeEventListener('pointerdown', handlePointerDown as any);
      element.removeEventListener('pointermove', handlePointerMove as any);
      element.removeEventListener('pointerup', endPointerDrag as any);
      element.removeEventListener('pointercancel', endPointerDrag as any);
      element.removeEventListener('pointerleave', endPointerDrag as any);
      element.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  return ref;
}
