import { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;
    let rafId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      // Dot is instant
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
      }
    };

    // Ring follows with smooth lerp — runs in one shared rAF loop
    const tick = () => {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringX}px, ${ringY}px)`;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // Magnetic scale on interactive elements
    const onLeave = () => {}; // scale resets naturally via lerp


    const onEnterBtn = (e: Event) => {
      const el = e.currentTarget as HTMLElement;
      el.addEventListener('mouseleave', onLeave, { once: true });
      if (ringRef.current) {
        ringRef.current.style.width = '48px';
        ringRef.current.style.height = '48px';
        ringRef.current.style.borderColor = '#3b82f6';
        ringRef.current.style.opacity = '0.8';
      }
    };
    const onLeaveBtn = () => {
      if (ringRef.current) {
        ringRef.current.style.width = '32px';
        ringRef.current.style.height = '32px';
        ringRef.current.style.borderColor = 'rgba(255,255,255,0.35)';
        ringRef.current.style.opacity = '1';
      }
    };

    const attachToInteractive = () => {
      document.querySelectorAll<HTMLElement>('button, a, [data-cursor-hover]').forEach(el => {
        el.removeEventListener('mouseenter', onEnterBtn);
        el.removeEventListener('mouseleave', onLeaveBtn);
        el.addEventListener('mouseenter', onEnterBtn);
        el.addEventListener('mouseleave', onLeaveBtn);
      });
    };

    attachToInteractive();
    const observer = new MutationObserver(attachToInteractive);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {/* Lagging ring */}
      <div
        ref={ringRef}
        className="custom-cursor-elem"
        style={{
          position: 'fixed', top: '-16px', left: '-16px',
          width: '32px', height: '32px',
          borderRadius: '50%',
          border: '1.5px solid rgba(255,255,255,0.35)',
          pointerEvents: 'none',
          zIndex: 9999,
          transition: 'width 0.2s, height 0.2s, border-color 0.2s, opacity 0.2s',
          willChange: 'transform',
        }}
      />
      {/* Instant dot */}
      <div
        ref={dotRef}
        className="custom-cursor-elem"
        style={{
          position: 'fixed', top: '-3px', left: '-3px',
          width: '6px', height: '6px',
          borderRadius: '50%',
          background: 'white',
          pointerEvents: 'none',
          zIndex: 10000,
          boxShadow: '0 0 8px rgba(255,255,255,0.8)',
          willChange: 'transform',
        }}
      />
    </>
  );
}
