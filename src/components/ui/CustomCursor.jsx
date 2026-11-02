import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const CustomCursor = () => {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isPointer, setIsPointer] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Detect touch device
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch) {
      setIsTouchDevice(true);
      return;
    }

    const updatePosition = (e) => {
      setHidden(false);
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseLeave = () => setHidden(true);
    const handleMouseEnter = () => setHidden(false);

    const handleMouseOver = (e) => {
      if (!e.target) return;
      const target = e.target;
      try {
        if (
          target.tagName?.toLowerCase() === 'a' ||
          target.tagName?.toLowerCase() === 'button' ||
          target.tagName?.toLowerCase() === 'input' ||
          target.tagName?.toLowerCase() === 'textarea' ||
          target.closest('a') ||
          target.closest('button') ||
          window.getComputedStyle(target).cursor === 'pointer'
        ) {
          setIsPointer(true);
        } else {
          setIsPointer(false);
        }
      } catch {
        setIsPointer(false);
      }
    };

    window.addEventListener('mousemove', updatePosition, { passive: true });
    window.addEventListener('mouseover', handleMouseOver, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', updatePosition);
      window.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);

  if (isTouchDevice || hidden) return null;

  return (
    <div className={`custom-cursor ${isPointer ? 'cursor-hovered' : ''}`}>
      <motion.div
        className="cursor-dot"
        animate={{
          x: position.x,
          y: position.y,
          scale: isPointer ? 1.5 : 1,
        }}
        transition={{ type: 'spring', damping: 40, stiffness: 450, mass: 0.1 }}
      />
      <motion.div
        className="cursor-ring"
        animate={{
          x: position.x,
          y: position.y,
          scale: isPointer ? 1.3 : 1,
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 220, mass: 0.3 }}
      />
    </div>
  );
};

export default CustomCursor;
