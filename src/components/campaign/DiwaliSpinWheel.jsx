import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

// 5 Diwali Festive Segments matching the official probability and discount tiers
export const DIWALI_SEGMENTS = [
  { label: '20% OFF', color: '#590907', textColor: '#F5E1A4', sub: 'FESTIVE DROP', value: 20 },
  { label: '30% OFF', color: '#D4AF37', textColor: '#30231F', sub: 'DIWALI SPECIAL', value: 30 },
  { label: '50% OFF', color: '#3B0403', textColor: '#E8D2B5', sub: 'MEGA DEAL', value: 50 },
  { label: '70% OFF', color: '#E8D2B5', textColor: '#590907', sub: 'JACKPOT', value: 70 },
  { label: 'FREE TEE', color: '#FAF5ED', textColor: '#590907', sub: 'VIP SURPRISE', value: null },
];

export const DiwaliSpinWheel = ({
  isSpinning = false,
  winningIndex = null,
  onSpinComplete,
  size = 'normal', // 'normal' | 'compact'
}) => {
  const controls = useAnimation();
  const [currentRotation, setCurrentRotation] = useState(0);

  const numSegments = DIWALI_SEGMENTS.length;
  const segmentAngle = 360 / numSegments; // 72 deg

  useEffect(() => {
    if (isSpinning && winningIndex !== null && winningIndex >= 0) {
      // Calculate rotation so that winningIndex lands at top (0 deg / 12 o'clock)
      const spins = 6; // 6 full rotations
      const centerAngle = (winningIndex + 0.5) * segmentAngle;
      const rotationToTop = 360 - centerAngle;

      const targetRotation =
        currentRotation + (spins * 360) + rotationToTop - (currentRotation % 360);

      controls
        .start({
          rotate: targetRotation,
          transition: {
            duration: 4.2,
            ease: [0.18, 0.89, 0.32, 1], // Smooth cubic-bezier deceleration
          },
        })
        .then(() => {
          setCurrentRotation(targetRotation);
          if (onSpinComplete) onSpinComplete();
        });
    }
  }, [isSpinning, winningIndex, controls, segmentAngle, currentRotation, onSpinComplete]);

  const radius = 50;
  const cx = 50;
  const cy = 50;

  // 16 decorative golden studs around the rim
  const studs = Array.from({ length: 16 }, (_, i) => {
    const angle = (i * 360) / 16;
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + 47.5 * Math.cos(rad),
      y: cy + 47.5 * Math.sin(rad),
    };
  });

  const dimClass = size === 'compact' 
    ? 'w-64 h-64 sm:w-72 sm:h-72' 
    : 'w-72 h-72 sm:w-88 sm:h-88 md:w-96 md:h-96';

  return (
    <div className={`relative ${dimClass} mx-auto select-none`}>
      {/* Outer Festive Amber Glow Aura */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#FFC837]/20 via-[#D4AF37]/30 to-[#590907]/20 blur-xl animate-pulse" />

      {/* Decorative Golden Diya Pointer at 12 o'clock */}
      <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center filter drop-shadow-[0_6px_8px_rgba(0,0,0,0.6)]">
        {/* Animated Flickering Flame */}
        <div className="w-4 h-6 relative mb-[-6px]">
          <div className="w-3.5 h-5 mx-auto bg-gradient-to-t from-[#FF8008] via-[#FFC837] to-[#FFF4D0] rounded-full blur-[0.5px] animate-pulse" />
          <div className="w-1.5 h-2.5 mx-auto bg-white rounded-full mt-[-10px] opacity-90" />
        </div>
        {/* Pointer Arrow */}
        <svg width="34" height="28" viewBox="0 0 34 28" fill="none">
          <path
            d="M17 28L4 5C4 5 7 0 17 0C27 0 30 5 30 5L17 28Z"
            fill="url(#diyaPointerGrad)"
            stroke="#FFE57F"
            strokeWidth="1.5"
          />
          {/* Inner jewel accent */}
          <circle cx="17" cy="8" r="3.5" fill="#590907" stroke="#FFE57F" strokeWidth="1" />
          <defs>
            <linearGradient id="diyaPointerGrad" x1="17" y1="0" x2="17" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFF1B8" />
              <stop offset="40%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#8A5A16" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* The Rotating Wheel */}
      <motion.div
        className="w-full h-full rounded-full relative overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.45)] border-[6px] border-[#D4AF37]"
        animate={controls}
        initial={{ rotate: 0 }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          <defs>
            {/* Gold Rim Pattern */}
            <radialGradient id="hubGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFF4D0" />
              <stop offset="45%" stopColor="#D4AF37" />
              <stop offset="85%" stopColor="#996515" />
              <stop offset="100%" stopColor="#590907" />
            </radialGradient>
          </defs>

          {/* Slices */}
          {DIWALI_SEGMENTS.map((segment, index) => {
            const startAngle = index * segmentAngle;
            const endAngle = (index + 1) * segmentAngle;

            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;

            const x1 = cx + radius * Math.cos(startRad);
            const y1 = cy + radius * Math.sin(startRad);
            const x2 = cx + radius * Math.cos(endRad);
            const y2 = cy + radius * Math.sin(endRad);

            const largeArcFlag = segmentAngle > 180 ? 1 : 0;

            const pathData = [
              `M ${cx} ${cy}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z',
            ].join(' ');

            // Text coordinates (center angle of wedge)
            const textAngle = startAngle + segmentAngle / 2;
            const textRad = (textAngle * Math.PI) / 180;
            const textRadius = radius * 0.64;
            const tx = cx + textRadius * Math.cos(textRad);
            const ty = cy + textRadius * Math.sin(textRad);

            // Subtitle text radius
            const subRadius = radius * 0.83;
            const sx = cx + subRadius * Math.cos(textRad);
            const sy = cy + subRadius * Math.sin(textRad);

            return (
              <g key={index}>
                {/* Wedge slice */}
                <path
                  d={pathData}
                  fill={segment.color}
                  stroke="#D4AF37"
                  strokeWidth="0.8"
                />

                {/* Subtitle / Category Label */}
                <text
                  x={sx}
                  y={sy}
                  fill={segment.textColor}
                  fontSize="2.4"
                  fontWeight="600"
                  fontFamily="'Cinzel', 'Playfair Display', serif"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  transform={`rotate(${textAngle}, ${sx}, ${sy})`}
                  letterSpacing="0.25"
                  opacity="0.85"
                >
                  {segment.sub}
                </text>

                {/* Main Offer Text */}
                <text
                  x={tx}
                  y={ty}
                  fill={segment.textColor}
                  fontSize="4.8"
                  fontWeight="900"
                  fontFamily="'Syne', 'Inter', sans-serif"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  transform={`rotate(${textAngle}, ${tx}, ${ty})`}
                  letterSpacing="0.15"
                >
                  {segment.label}
                </text>
              </g>
            );
          })}

          {/* Outer Ring with 16 Golden Studs */}
          <circle cx="50" cy="50" r="47.5" fill="none" stroke="#590907" strokeWidth="2.5" />
          {studs.map((stud, idx) => (
            <circle
              key={idx}
              cx={stud.x}
              cy={stud.y}
              r="1"
              fill="#FFF4D0"
              stroke="#D4AF37"
              strokeWidth="0.4"
            />
          ))}

          {/* Center Mandala / Golden Hub */}
          <circle cx="50" cy="50" r="14" fill="#590907" stroke="#D4AF37" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="11" fill="url(#hubGrad)" stroke="#FFE57F" strokeWidth="1" />
          <circle cx="50" cy="50" r="4.5" fill="#590907" stroke="#FFE57F" strokeWidth="0.8" />
          <circle cx="50" cy="50" r="2" fill="#FFF4D0" />
        </svg>

        {/* Center VYBERA Emblem */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-14 h-14 rounded-full flex flex-col items-center justify-center shadow-inner">
            <span className="text-[7px] font-black text-[#FFF4D0] tracking-[0.25em] uppercase font-display leading-none">
              VYB
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DiwaliSpinWheel;
