import { useEffect, useRef, useState } from 'react';

const CustomCursor = () => {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    let dotX = 0, dotY = 0;
    let ringX = 0, ringY = 0;
    let raf;

    const onMouseMove = (e) => {
      dotX = e.clientX;
      dotY = e.clientY;
    };

    const onMouseEnterInteractive = () => setHovered(true);
    const onMouseLeaveInteractive = () => setHovered(false);

    const moveDot = () => {
      if (dotRef.current) {
        dotRef.current.style.left = dotX + 'px';
        dotRef.current.style.top = dotY + 'px';
      }
      // Ring lags behind
      ringX += (dotX - ringX) * 0.12;
      ringY += (dotY - ringY) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.left = ringX + 'px';
        ringRef.current.style.top = ringY + 'px';
      }
      raf = requestAnimationFrame(moveDot);
    };

    window.addEventListener('mousemove', onMouseMove);
    raf = requestAnimationFrame(moveDot);

    // Add hover detection to interactive elements
    const addHoverListeners = () => {
      const els = document.querySelectorAll(
        'a, button, [role="button"], input, textarea, select, .cursor-pointer, label'
      );
      els.forEach(el => {
        el.addEventListener('mouseenter', onMouseEnterInteractive);
        el.addEventListener('mouseleave', onMouseLeaveInteractive);
      });
    };
    addHoverListeners();

    // Re-scan on DOM mutations
    const observer = new MutationObserver(addHoverListeners);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="custom-cursor">
      <div
        ref={dotRef}
        className="cursor-dot fixed pointer-events-none"
        style={{ position: 'fixed', width: 8, height: 8, background: 'white', borderRadius: '50%', transform: 'translate(-50%,-50%)', zIndex: 99999, transition: 'width 0.2s, height 0.2s' }}
      />
      <div
        ref={ringRef}
        className={`fixed pointer-events-none`}
        style={{
          position: 'fixed',
          width: hovered ? 52 : 32,
          height: hovered ? 52 : 32,
          border: `1px solid rgba(255,255,255,${hovered ? 0.7 : 0.4})`,
          borderRadius: '50%',
          transform: 'translate(-50%,-50%)',
          zIndex: 99998,
          transition: 'width 0.25s cubic-bezier(0.25,0.46,0.45,0.94), height 0.25s cubic-bezier(0.25,0.46,0.45,0.94), border-color 0.25s',
          boxShadow: hovered ? '0 0 15px rgba(255,255,255,0.15)' : 'none',
        }}
      />
    </div>
  );
};

export default CustomCursor;
