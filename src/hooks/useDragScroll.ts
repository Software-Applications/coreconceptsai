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
    let activePointerId: number | null = null;

    const handlePointerDown = (e: PointerEvent) => {
      // Only respond to primary mouse button; allow touch/pen.
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      e.stopPropagation();
      e.preventDefault();

      isDown = true;
      activePointerId = e.pointerId;
      startX = e.clientX;
      scrollLeft = element.scrollLeft;

      if (e.pointerType === 'mouse') {
        element.style.cursor = 'grabbing';
      } else {
        // Ensure we keep receiving move events (helps inside nested scroll containers in native shells).
        try {
          element.setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDown) return;
      if (activePointerId !== e.pointerId) return;

      e.stopPropagation();
      e.preventDefault();

      const walkX = (e.clientX - startX) * 1.25;
      element.scrollLeft = scrollLeft - walkX;
    };

    const endPointerDrag = (e?: PointerEvent) => {
      if (!isDown) return;
      if (e && activePointerId !== e.pointerId) return;

      isDown = false;
      activePointerId = null;
      element.style.cursor = 'grab';

      if (e && e.pointerType !== 'mouse') {
        try {
          element.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
    };

    const handleDragStart = (e: DragEvent) => {
      // Prevent image/button drag ghosting while we "grab-scroll"
      e.preventDefault();
    };

    element.style.cursor = 'grab';

    // Pointer events (works for mouse + touch + pen, including Capacitor shells)
    element.addEventListener('pointerdown', handlePointerDown, { passive: false });
    element.addEventListener('pointermove', handlePointerMove, { passive: false });
    element.addEventListener('pointerup', endPointerDrag);
    element.addEventListener('pointercancel', endPointerDrag);
    element.addEventListener('pointerleave', endPointerDrag);

    element.addEventListener('dragstart', handleDragStart);

    return () => {
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
