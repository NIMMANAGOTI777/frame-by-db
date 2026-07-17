'use client';

import { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Disable on touch devices
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches) {
      return;
    }

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      
      // Update dot instantly
      dot.style.top = `${mouseY}px`;
      dot.style.left = `${mouseX}px`;
      dot.style.opacity = '1';
      ring.style.opacity = '1';
    };

    const animateRing = () => {
      // Smooth lerped trailing
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      
      ring.style.top = `${ringY}px`;
      ring.style.left = `${ringX}px`;
      
      requestAnimationFrame(animateRing);
    };

    const animationId = requestAnimationFrame(animateRing);
    window.addEventListener('mousemove', onMouseMove);

    // Hover effects
    const addHover = () => {
      dot.style.width = '24px';
      dot.style.height = '24px';
      dot.style.backgroundColor = 'rgba(212, 175, 55, 0.2)';
      ring.style.width = '60px';
      ring.style.height = '60px';
      ring.style.borderColor = '#D4AF37';
    };

    const removeHover = () => {
      dot.style.width = '8px';
      dot.style.height = '8px';
      dot.style.backgroundColor = '#D4AF37';
      ring.style.width = '40px';
      ring.style.height = '40px';
      ring.style.borderColor = 'rgba(212, 175, 55, 0.4)';
    };

    const setupListeners = () => {
      const clickables = document.querySelectorAll(
        'a, button, select, input, textarea, [role="button"], .swiper-button-next, .swiper-button-prev'
      );
      clickables.forEach((el) => {
        el.addEventListener('mouseenter', addHover);
        el.addEventListener('mouseleave', removeHover);
      });
    };

    // Initial setup
    setupListeners();

    // Monitor DOM updates to attach listeners to dynamically rendered elements
    const observer = new MutationObserver(setupListeners);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', onMouseMove);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="custom-cursor hidden md:block opacity-0" />
      <div ref={ringRef} className="custom-cursor-ring hidden md:block opacity-0" />
    </>
  );
}
