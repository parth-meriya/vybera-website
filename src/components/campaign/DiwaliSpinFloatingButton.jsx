import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import DiwaliDiyaIcon from './DiwaliDiyaIcon';

export const DiwaliSpinFloatingButton = ({ onClick, hasSpun = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <aside
      aria-label="Festive promotion"
      className="fixed bottom-6 right-5 sm:right-6 z-40 flex items-center select-none"
    >
      <motion.button
        type="button"
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={hasSpun ? 'View your Diwali Reward' : 'Open Diwali Spin and Win wheel'}
        className="group relative flex items-center gap-2.5 px-3.5 py-3 sm:px-4 sm:py-3.5 bg-gradient-to-r from-[#590907] via-[#7B0D0A] to-[#590907] text-[#FAF5ED] rounded-full border-2 border-[#D4AF37] shadow-[0_8px_30px_rgba(89,9,7,0.45)] hover:shadow-[0_10px_35px_rgba(212,175,55,0.4)] transition-all"
      >
        {/* Ambient Glow */}
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-[#D4AF37]/25 blur-md animate-pulse pointer-events-none"
        />

        {/* Diya Icon */}
        <span className="relative flex-shrink-0">
          <DiwaliDiyaIcon size={24} />
        </span>

        {/* Text Label */}
        <span className="relative flex flex-col items-start text-left pr-1">
          <span className="text-[9px] font-black tracking-[0.2em] uppercase text-[#FFE57F] leading-none">
            {hasSpun ? 'DIWALI REWARD' : 'DIWALI DHAMAKA'}
          </span>
          <span className="text-xs font-black uppercase tracking-wider text-[#FAF5ED] leading-tight font-display">
            {hasSpun ? 'View Gift ✨' : 'Spin & Win ✨'}
          </span>
        </span>

        {/* Mini Sparkle Pill */}
        <span
          aria-hidden="true"
          className="hidden sm:flex items-center justify-center w-5 h-5 rounded-full bg-[#D4AF37] text-[#590907]"
        >
          <Sparkles size={11} className="animate-spin" style={{ animationDuration: '6s' }} />
        </span>
      </motion.button>
    </aside>
  );
};

export default DiwaliSpinFloatingButton;
