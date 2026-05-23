import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shirt } from 'lucide-react';

const CustomCursor = () => {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isPointer, setIsPointer] = useState(false);
  const [hidden, setHidden] = useState(true); // Start hidden until mouse moves

  useEffect(() => {
    // We add a global style to hide the default cursor
    const style = document.createElement('style');
    style.innerHTML = `
      * {
        cursor: none !important;
      }
    `;
    document.head.appendChild(style);

    const updatePosition = (e) => {
      setHidden(false);
      let x, y;
      if (e.touches && e.touches.length > 0) {
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
      } else {
        x = e.clientX;
        y = e.clientY;
      }
      setPosition({ x, y });
    };

    const handleMouseLeave = (e) => {
      if (
        e.clientY <= 0 || 
        e.clientX <= 0 || 
        e.clientX >= window.innerWidth || 
        e.clientY >= window.innerHeight
      ) {
        setHidden(true);
      }
    };
    
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
      } catch (err) {
        setIsPointer(false);
      }
    };

    document.addEventListener('mousemove', updatePosition);
    document.addEventListener('touchmove', updatePosition, { passive: true });
    document.addEventListener('touchstart', updatePosition, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseover', handleMouseOver);

    return () => {
      document.head.removeChild(style);
      document.removeEventListener('mousemove', updatePosition);
      document.removeEventListener('touchmove', updatePosition);
      document.removeEventListener('touchstart', updatePosition);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[9999] flex items-center justify-center mix-blend-difference"
      animate={{
        x: position.x - (isPointer ? 14 : 10), // Adjust centering based on size
        y: position.y - (isPointer ? 14 : 10),
        scale: isPointer ? 1.2 : 1,
        opacity: hidden ? 0 : 1,
      }}
      transition={{ type: 'spring', stiffness: 800, damping: 35, mass: 0.1 }}
    >
      <Shirt size={isPointer ? 28 : 20} className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
    </motion.div>
  );
};

export default CustomCursor;
