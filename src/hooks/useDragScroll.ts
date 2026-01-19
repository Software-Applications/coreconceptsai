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
    let startX: number;
    let scrollLeft: number;
    let lastX: number;
    let lastTime: number;
    let velocity = 0;
    let animationId: number | null = null;

    const stopMomentum = () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    };

    const applyMomentum = () => {
      if (Math.abs(velocity) < 0.5) {
        animationId = null;
        return;
      }
      
      element.scrollLeft += velocity;
      velocity *= 0.92; // Friction coefficient
      animationId = requestAnimationFrame(applyMomentum);
    };

    // Mouse events
    const handleMouseDown = (e: MouseEvent) => {
      stopMomentum();
      isDown = true;
      element.style.cursor = 'grabbing';
      startX = e.pageX - element.offsetLeft;
      scrollLeft = element.scrollLeft;
      lastX = e.pageX;
      lastTime = Date.now();
      velocity = 0;
    };

    const handleMouseLeave = () => {
      if (isDown) {
        isDown = false;
        element.style.cursor = 'grab';
        applyMomentum();
      }
    };

    const handleMouseUp = () => {
      if (isDown) {
        isDown = false;
        element.style.cursor = 'grab';
        applyMomentum();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      
      const now = Date.now();
      const dt = now - lastTime;
      
      if (dt > 0) {
        velocity = (lastX - e.pageX) / dt * 15;
      }
      
      lastX = e.pageX;
      lastTime = now;
      
      const x = e.pageX - element.offsetLeft;
      const walkX = (x - startX) * 1.5;
      element.scrollLeft = scrollLeft - walkX;
    };

    // Touch events for mobile
    const handleTouchStart = (e: TouchEvent) => {
      stopMomentum();
      isDown = true;
      startX = e.touches[0].pageX - element.offsetLeft;
      scrollLeft = element.scrollLeft;
      lastX = e.touches[0].pageX;
      lastTime = Date.now();
      velocity = 0;
    };

    const handleTouchEnd = () => {
      isDown = false;
      applyMomentum();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDown) return;
      
      const now = Date.now();
      const dt = now - lastTime;
      
      if (dt > 0) {
        velocity = (lastX - e.touches[0].pageX) / dt * 15;
      }
      
      lastX = e.touches[0].pageX;
      lastTime = now;
      
      const x = e.touches[0].pageX - element.offsetLeft;
      const walkX = (x - startX) * 1.5;
      element.scrollLeft = scrollLeft - walkX;
    };

    element.style.cursor = 'grab';
    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mouseup', handleMouseUp);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      stopMomentum();
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mouseup', handleMouseUp);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return ref;
}
