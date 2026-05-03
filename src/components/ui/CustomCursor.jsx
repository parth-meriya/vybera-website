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

    const handleMouseLeave = () => setHidden(true);
    const handleMouseEnter = () => setHidden(false);

    const handleMouseOver = (e) => {
      const target = e.target;
      if (
        target.tagName.toLowerCase() === 'a' ||
        target.tagName.toLowerCase() === 'button' ||
        target.tagName.toLowerCase() === 'input' ||
        target.tagName.toLowerCase() === 'textarea' ||
        target.closest('a') ||
        target.closest('button') ||
        window.getComputedStyle(target).cursor === 'pointer'
      ) {
        setIsPointer(true);
      } else {
        setIsPointer(false);
      }
    };

    window.addEventListener('mousemove', updatePosition);
    window.addEventListener('touchmove', updatePosition, { passive: true });
    window.addEventListener('touchstart', updatePosition, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      document.head.removeChild(style);
      window.removeEventListener('mousemove', updatePosition);
      window.removeEventListener('touchmove', updatePosition);
      window.removeEventListener('touchstart', updatePosition);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('mouseover', handleMouseOver);
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
