import { useEffect, useRef, useState } from 'react';

/**
 * Two-layer fluid cursor: a tight dot that tracks instantly, and a
 * spring-trailing ring that catches up with easing. Expands and glows
 * on elements marked with [data-cursor-hover].
 */
export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [enabled, setEnabled] = useState(true);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isTouch) {
      setEnabled(false);
      return;
    }

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let raf;

    const onMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      }
    };

    const onOver = (e) => {
      setHovering(!!e.target.closest('[data-cursor-hover]'));
    };

    const tick = () => {
      const ease = reducedMotion ? 1 : 0.18;
      ringX += (mouseX - ringX) * ease;
      ringY += (mouseY - ringY) * ease;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseover', onOver, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[9999]">
      <div
        ref={dotRef}
        className="fixed left-0 top-0 rounded-full transition-[width,height,background] duration-200 ease-out"
        style={{
          width: hovering ? 10 : 6,
          height: hovering ? 10 : 6,
          background: '#A78BFA',
          boxShadow: '0 0 10px rgba(167,139,250,0.9), 0 0 22px rgba(34,211,238,0.5)'
        }}
      />
      <div
        ref={ringRef}
        className="fixed left-0 top-0 rounded-full border transition-[width,height,border-color,box-shadow] duration-300 ease-out"
        style={{
          width: hovering ? 56 : 32,
          height: hovering ? 56 : 32,
          borderColor: hovering ? 'rgba(34,211,238,0.65)' : 'rgba(167,139,250,0.45)',
          boxShadow: hovering ? '0 0 26px rgba(34,211,238,0.35)' : '0 0 14px rgba(124,58,237,0.2)'
        }}
      />
    </div>
  );
}
